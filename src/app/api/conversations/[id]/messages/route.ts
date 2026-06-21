/**
 * POST /api/conversations/[id]/messages — Send a message and get AI response
 *
 * Uses GeminiProvider (via getAIProvider()) which returns ParsedAIResponse.
 * The AI is forced to return JSON via responseMimeType: "application/json".
 * Corrections, vocabulary, grammar notes are all parsed and saved to DB.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, errorResponse, successResponse, parseRequestBody } from "@/lib/api-helpers";
import { messageSendSchema } from "@/lib/validations";
import { getAIProvider, buildSystemPrompt } from "@/lib/ai";
import { getOrCreateUser } from "@/lib/user-provisioning";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Please log in", 401);
    }

    const dbUser = await getOrCreateUser(user);

    // Verify conversation belongs to user
    const { data: conversation } = await db
      .from("conversations")
      .select("id, userId")
      .eq("id", id)
      .eq("userId", dbUser.id)
      .maybeSingle();

    if (!conversation) {
      return errorResponse("NOT_FOUND", "Conversation not found", 404);
    }

    const { data: messages, error: msgError } = await db
      .from("messages")
      .select("*")
      .eq("conversationId", id)
      .order("createdAt", { ascending: true });

    if (msgError) {
      console.error("[Messages API] GET error:", msgError);
      return errorResponse("INTERNAL_ERROR", "Failed to fetch messages", 500);
    }

    return successResponse({ messages: messages || [] });
  } catch (error) {
    console.error("[Messages API] GET error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch messages", 500);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params;

  try {
    // 1. Authenticate
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Please log in", 401);
    }

    // 2. Get or create user's DB record (auto-provisioning)
    const dbUser = await getOrCreateUser(user);

    // 3. Verify conversation exists and belongs to user
    const { data: conversation, error: convError } = await db
      .from("conversations")
      .select("id, userId, languagePair, difficultyLevel, messageCount, status")
      .eq("id", conversationId)
      .maybeSingle();

    if (convError || !conversation) {
      return errorResponse("NOT_FOUND", "Conversation not found", 404);
    }

    if (conversation.userId !== dbUser.id) {
      return errorResponse("FORBIDDEN", "You don't have access to this conversation", 403);
    }

    // 4. Verify conversation is still active
    if (conversation.status !== "active") {
      return errorResponse("VALIDATION_ERROR", "This conversation has ended");
    }

    // 5. Validate message content
    const body = await parseRequestBody<Record<string, unknown>>(request);
    if (!body) {
      return errorResponse("VALIDATION_ERROR", "Invalid request body");
    }

    const parseResult = messageSendSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0];
      return errorResponse("VALIDATION_ERROR", firstError?.message || "Invalid input");
    }

    const { content } = parseResult.data;
    const now = new Date().toISOString();

    // 6. Save user message to DB
    const userMessageId = crypto.randomUUID();
    const { data: userMessage, error: msgError } = await db
      .from("messages")
      .insert({
        id: userMessageId,
        conversationId,
        role: "user",
        content,
        createdAt: now,
      })
      .select()
      .single();

    if (msgError) {
      console.error("[Messages API] User message save error:", msgError);
      return errorResponse("INTERNAL_ERROR", "Failed to save message", 500);
    }

    // 7. Build AI context
    const { data: previousMessages } = await db
      .from("messages")
      .select("role, content")
      .eq("conversationId", conversationId)
      .order("createdAt", { ascending: true })
      .limit(20);

    const [sourceLang, targetLang] = conversation.languagePair.split("-");
    const actualTarget = targetLang === dbUser.nativeLanguage ? sourceLang : targetLang;

    const scenarioContext = "Free conversation practice.";

    const systemPrompt = buildSystemPrompt(
      actualTarget,
      dbUser.nativeLanguage,
      conversation.difficultyLevel as "beginner" | "intermediate" | "advanced",
      scenarioContext
    );

    // Build history from existing messages
    const history = (previousMessages || []).map((msg) => ({
      role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: msg.content,
    }));

    // 8. Call AI provider
    let aiResponse;
    try {
      const aiProvider = getAIProvider();
      aiResponse = await aiProvider.chat({
        systemPrompt,
        targetLanguage: actualTarget,
        nativeLanguage: dbUser.nativeLanguage,
        proficiencyLevel: conversation.difficultyLevel as "beginner" | "intermediate" | "advanced",
        history,
        userMessage: content,
      });
    } catch (error) {
      console.error("[Messages API] AI provider error:", error);

      // Save a fallback AI message
      const fallbackContent =
        "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.";
      const fallbackMsgId = crypto.randomUUID();

      const { data: fallbackMsg } = await db
        .from("messages")
        .insert({
          id: fallbackMsgId,
          conversationId,
          role: "assistant",
          content: fallbackContent,
          metadata: { error: true },
          createdAt: new Date().toISOString(),
        })
        .select()
        .single();

      // Update conversation message count
      await db
        .from("conversations")
        .update({ messageCount: (conversation.messageCount || 0) + 2 })
        .eq("id", conversationId);

      return successResponse({
        userMessage: {
          id: userMessage.id,
          content: userMessage.content,
          role: "user",
          createdAt: userMessage.createdAt,
        },
        assistantMessage: {
          id: fallbackMsg?.id || fallbackMsgId,
          content: fallbackContent,
          role: "assistant",
          createdAt: fallbackMsg?.createdAt || new Date().toISOString(),
        },
        provider: "fallback",
      });
    }

    // 9. Save AI message to DB with structured data
    const aiMsgId = crypto.randomUUID();
    const messageData: Record<string, unknown> = {
      id: aiMsgId,
      conversationId,
      role: "assistant",
      content: aiResponse.reply,
      metadata: { provider: getAIProvider().name },
      createdAt: new Date().toISOString(),
    };

    // Save structured fields
    if (aiResponse.translatedReply) {
      messageData.contentTranslated = aiResponse.translatedReply;
    }
    if (aiResponse.corrections && aiResponse.corrections.length > 0) {
      messageData.corrections = aiResponse.corrections;
    }
    if (aiResponse.vocabularyItems && aiResponse.vocabularyItems.length > 0) {
      messageData.vocabularyItems = aiResponse.vocabularyItems;
    }
    if (aiResponse.grammarNotes && aiResponse.grammarNotes.length > 0) {
      messageData.grammarNotes = aiResponse.grammarNotes;
    }

    const { data: aiMessage } = await db.from("messages").insert(messageData).select().single();

    // 10. Update conversation stats
    await db
      .from("conversations")
      .update({ messageCount: (conversation.messageCount || 0) + 2 })
      .eq("id", conversationId);

    // Update daily usage
    const today = new Date().toISOString().split("T")[0];
    const { data: existingUsage } = await db
      .from("daily_usage")
      .select("messagesCount")
      .eq("userId", dbUser.id)
      .eq("date", today)
      .maybeSingle();

    if (existingUsage) {
      await db
        .from("daily_usage")
        .update({
          messagesCount: existingUsage.messagesCount + 2,
          updatedAt: now,
        })
        .eq("userId", dbUser.id)
        .eq("date", today);
    } else {
      await db.from("daily_usage").insert({
        id: crypto.randomUUID(),
        userId: dbUser.id,
        date: today,
        conversationsCount: 0,
        messagesCount: 2,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 11. Return response
    return successResponse({
      userMessage: {
        id: userMessage.id,
        content: userMessage.content,
        role: "user",
        createdAt: userMessage.createdAt,
      },
      assistantMessage: {
        id: aiMessage?.id || aiMsgId,
        content: aiResponse.reply,
        translatedContent: aiResponse.translatedReply || null,
        corrections: aiResponse.corrections || [],
        vocabularyItems: aiResponse.vocabularyItems || [],
        grammarNotes: aiResponse.grammarNotes || [],
        role: "assistant",
        createdAt: aiMessage?.createdAt || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Messages API] Unhandled error:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "Something went wrong while sending your message. Please try again.",
      500
    );
  }
}
