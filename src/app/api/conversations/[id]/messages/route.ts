/**
 * POST /api/conversations/[id]/messages — Send a message in a conversation
 *
 * Flow:
 * 1. Verify user is authenticated
 * 2. Verify conversation exists and belongs to user
 * 3. Verify conversation is still active
 * 4. Validate message content
 * 5. Save user message to DB
 * 6. Build AI context (system prompt + history)
 * 7. Call AI provider to get response
 * 8. Parse AI response and save to DB
 * 9. Update conversation stats
 * 10. Return user message + AI response with corrections/vocabulary
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, errorResponse, successResponse, parseRequestBody } from "@/lib/api-helpers";
import { messageSendSchema } from "@/lib/validations";
import { getAIProvider, buildSystemPrompt } from "@/lib/ai";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params;

  // 1. Authenticate
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("UNAUTHORIZED", "Please log in", 401);
  }

  // 2. Get user's DB record
  const dbUser = await db.user.findUnique({
    where: { supabaseUid: user.id },
  });
  if (!dbUser) {
    return errorResponse("NOT_FOUND", "User profile not found", 404);
  }

  // 3. Verify conversation exists and belongs to user
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true },
      },
      scenario: { select: { title: true, description: true, openingLine: true } },
    },
  });

  if (!conversation) {
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

  // 6. Save user message to DB
  const userMessage = await db.message.create({
    data: {
      conversationId,
      role: "user",
      content,
    },
  });

  // 7. Build AI context
  const [sourceLang, targetLang] = conversation.languagePair.split("-");
  const actualTarget = targetLang === dbUser.nativeLanguage ? sourceLang : targetLang;

  const scenarioContext = conversation.scenario
    ? `Scenario: ${conversation.scenario.title}. ${conversation.scenario.description}.`
    : "Free conversation practice.";

  const systemPrompt = buildSystemPrompt(
    actualTarget,
    dbUser.nativeLanguage,
    conversation.difficultyLevel,
    scenarioContext
  );

  // Build history from existing messages
  const history = conversation.messages.map((msg) => ({
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
      proficiencyLevel: conversation.difficultyLevel,
      history,
      userMessage: content,
    });
  } catch (error) {
    console.error("[Messages API] AI provider error:", error);
    return errorResponse("AI_ERROR", "Failed to get AI response. Please try again.", 500);
  }

  // 9. Save AI message to DB
  // Cast JSON fields to satisfy Prisma's JSON type (arrays need explicit cast)
  const aiMessage = await db.message.create({
    data: {
      conversationId,
      role: "assistant",
      content: aiResponse.reply,
      contentTranslated: aiResponse.translatedReply,
      corrections:
        aiResponse.corrections.length > 0
          ? JSON.parse(JSON.stringify(aiResponse.corrections))
          : undefined,
      vocabularyItems:
        aiResponse.vocabularyItems.length > 0
          ? JSON.parse(JSON.stringify(aiResponse.vocabularyItems))
          : undefined,
      grammarNotes:
        aiResponse.grammarNotes.length > 0
          ? JSON.parse(JSON.stringify(aiResponse.grammarNotes))
          : undefined,
    },
  });

  // 10. Update conversation stats
  await db.conversation.update({
    where: { id: conversationId },
    data: { messageCount: { increment: 2 } }, // +2 (user + AI)
  });

  // Update daily messages count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await db.dailyUsage.upsert({
    where: { userId_date: { userId: dbUser.id, date: today } },
    create: { userId: dbUser.id, date: today, conversationsCount: 0, messagesCount: 2 },
    update: { messagesCount: { increment: 2 } },
  });

  // 11. Return response
  return successResponse({
    userMessage: {
      id: userMessage.id,
      content: userMessage.content,
      role: "user",
      createdAt: userMessage.createdAt.toISOString(),
    },
    aiMessage: {
      id: aiMessage.id,
      content: aiMessage.content,
      translatedContent: aiMessage.contentTranslated,
      role: "assistant",
      corrections: aiResponse.corrections,
      vocabularyItems: aiResponse.vocabularyItems,
      grammarNotes: aiResponse.grammarNotes,
      createdAt: aiMessage.createdAt.toISOString(),
    },
  });
}
