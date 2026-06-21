/**
 * GET /api/conversations — List user's conversations
 * POST /api/conversations — Start a new conversation
 *
 * Uses Supabase JS Client (PostgREST over HTTPS).
 * Column names use camelCase as returned by PostgREST.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, errorResponse, successResponse, parseRequestBody } from "@/lib/api-helpers";
import { hasExceededDailyLimit } from "@/lib/constants";
import { getAIProvider, buildSystemPrompt } from "@/lib/ai";
import { getOrCreateUser } from "@/lib/user-provisioning";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Please log in", 401);
    }

    const dbUser = await getOrCreateUser(user);

    const { data: conversations, error: convError } = await db
      .from("conversations")
      .select(
        `
        *,
        scenario:scenarios(title, category),
        messages(count)
      `
      )
      .eq("userId", dbUser.id)
      .order("startedAt", { ascending: false })
      .limit(50);

    if (convError) {
      console.error("[Conversations API] GET fetch error:", convError);
      return errorResponse("INTERNAL_ERROR", "Failed to fetch conversations", 500);
    }

    const formatted = (conversations || []).map((conv) => ({
      id: conv.id,
      userId: conv.userId,
      scenarioId: conv.scenarioId,
      languagePair: conv.languagePair,
      status: conv.status,
      difficultyLevel: conv.difficultyLevel,
      startedAt: conv.startedAt,
      endedAt: conv.endedAt,
      messageCount: conv.messageCount,
      overallScore: conv.overallScore,
      createdAt: conv.createdAt,
      scenario: conv.scenario,
    }));

    return successResponse({ conversations: formatted });
  } catch (error) {
    console.error("[Conversations API] GET error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch conversations", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Please log in to start a conversation", 401);
    }

    // 2. Get or create user's DB record
    const dbUser = await getOrCreateUser(user);

    // 3. Parse input
    const body = await parseRequestBody<Record<string, unknown>>(request);
    const nativeLang = (body?.nativeLanguage as string) || dbUser.nativeLanguage || "en";
    const targetLang = (body?.targetLanguage as string) || dbUser.targetLanguage || "es";
    const languagePair = (body?.languagePair as string) || `${nativeLang}-${targetLang}`;
    const difficultyLevel =
      (body?.difficultyLevel as string) || dbUser.proficiencyLevel || "beginner";
    const scenarioId = body?.scenarioId as string | undefined;

    const isPro = dbUser.subscription?.plan !== "free" && dbUser.subscription?.status === "active";

    // 4. Check daily limit
    const today = new Date().toISOString().split("T")[0];

    const { data: dailyUsage } = await db
      .from("daily_usage")
      .select("conversationsCount")
      .eq("userId", dbUser.id)
      .eq("date", today)
      .maybeSingle();

    const conversationsToday = dailyUsage?.conversationsCount ?? 0;

    if (hasExceededDailyLimit(conversationsToday, isPro)) {
      return errorResponse(
        "FREE_LIMIT_EXCEEDED",
        "You've reached your daily conversation limit. Upgrade to Pro for unlimited conversations.",
        429
      );
    }

    // 5. Fetch scenario if provided
    let scenario: Record<string, unknown> | null = null;
    if (scenarioId) {
      const { data: scenarioData, error: scenarioError } = await db
        .from("scenarios")
        .select("*")
        .eq("id", scenarioId)
        .maybeSingle();

      if (scenarioError || !scenarioData) {
        return errorResponse("NOT_FOUND", "Scenario not found", 404);
      }
      scenario = scenarioData as unknown as Record<string, unknown>;

      if (scenario.isPremium && !isPro) {
        return errorResponse("PREMIUM_REQUIRED", "This scenario requires a Pro subscription", 403);
      }
    }

    // 6. Validate difficulty level
    const validLevels = ["beginner", "intermediate", "advanced"];
    const safeDifficulty = validLevels.includes(difficultyLevel)
      ? (difficultyLevel as "beginner" | "intermediate" | "advanced")
      : ("beginner" as const);

    // 7. Create conversation in DB
    const conversationId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { data: conversation, error: convError } = await db
      .from("conversations")
      .insert({
        id: conversationId,
        userId: dbUser.id,
        scenarioId: scenarioId || null,
        languagePair,
        difficultyLevel: safeDifficulty,
        status: "active" as const,
        startedAt: now,
        messageCount: 0,
        createdAt: now,
      })
      .select()
      .single();

    if (convError) {
      console.error("[Conversations API] Create error:", convError);
      return errorResponse("INTERNAL_ERROR", "Failed to create conversation", 500);
    }

    // 8. Generate AI opening message
    const scenarioContext = scenario
      ? `Scenario: ${scenario.title}. ${scenario.description}. ${scenario.openingLine ? `Start the conversation with: "${scenario.openingLine}"` : ""}`
      : "Free conversation — the user wants to practice casually. Start with a friendly greeting and ask them about their day or interests.";

    let openingMessage = "Hello! Let's start practicing. How are you today?";
    let openingTranslation: string | null = null;
    let openingVocabulary: unknown[] = [];

    try {
      const [sourceLang, targetLang] = languagePair.split("-");
      const actualTarget = targetLang === dbUser.nativeLanguage ? sourceLang : targetLang;

      const systemPrompt = buildSystemPrompt(
        actualTarget,
        dbUser.nativeLanguage,
        safeDifficulty,
        scenarioContext
      );

      const aiProvider = getAIProvider();
      const aiResponse = await aiProvider.chat({
        systemPrompt,
        targetLanguage: actualTarget,
        nativeLanguage: dbUser.nativeLanguage,
        proficiencyLevel: safeDifficulty,
        history: [],
        userMessage: "Start the conversation with a greeting.",
      });

      openingMessage = aiResponse.reply || openingMessage;
      openingTranslation = aiResponse.translatedReply || null;
      openingVocabulary = aiResponse.vocabularyItems || [];
    } catch (aiError) {
      console.error("[Conversations API] AI generation failed, using fallback:", aiError);
    }

    // 9. Save the opening message to DB
    const openingMsgData: Record<string, unknown> = {
      id: crypto.randomUUID(),
      conversationId,
      role: "assistant",
      content: openingMessage,
      createdAt: new Date().toISOString(),
    };

    if (openingTranslation) {
      openingMsgData.contentTranslated = openingTranslation;
    }
    if (Array.isArray(openingVocabulary) && openingVocabulary.length > 0) {
      openingMsgData.vocabularyItems = openingVocabulary;
    }

    const { error: msgError } = await db.from("messages").insert(openingMsgData);
    if (msgError) {
      console.error("[Conversations API] Message save error:", msgError);
    }

    // 10. Update daily usage count
    const { data: existingUsage } = await db
      .from("daily_usage")
      .select("conversationsCount")
      .eq("userId", dbUser.id)
      .eq("date", today)
      .maybeSingle();

    if (existingUsage) {
      await db
        .from("daily_usage")
        .update({
          conversationsCount: existingUsage.conversationsCount + 1,
          updatedAt: now,
        })
        .eq("userId", dbUser.id)
        .eq("date", today);
    } else {
      await db.from("daily_usage").insert({
        id: crypto.randomUUID(),
        userId: dbUser.id,
        date: today,
        conversationsCount: 1,
        messagesCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 11. Update conversation message count
    await db.from("conversations").update({ messageCount: 1 }).eq("id", conversationId);

    // 12. Return response
    return successResponse(
      {
        id: conversationId,
        status: "active",
        languagePair,
        difficultyLevel: safeDifficulty,
        openingMessage,
      },
      201
    );
  } catch (error) {
    console.error("[Conversations API] Unhandled error:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return errorResponse("INTERNAL_ERROR", `Something went wrong: ${errMsg}`, 500);
  }
}
