/**
 * POST /api/conversations — Start a new conversation
 *
 * Flow:
 * 1. Verify user is authenticated
 * 2. Validate request body (languagePair, scenarioId, difficultyLevel)
 * 3. Check daily conversation limit (free tier = 3/day)
 * 4. If scenarioId provided, fetch scenario from DB
 * 5. Create conversation record in DB
 * 6. Generate AI opening message
 * 7. Create user's DailyUsage record (or increment count)
 * 8. Return conversation + opening message
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, errorResponse, successResponse, parseRequestBody } from "@/lib/api-helpers";
import { conversationStartSchema } from "@/lib/validations";
import { hasExceededDailyLimit } from "@/lib/constants";
import { getAIProvider, buildSystemPrompt } from "@/lib/ai";
import { getOrCreateUser } from "@/lib/user-provisioning";
import type { AIChatContext } from "@/types/conversation";

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("UNAUTHORIZED", "Please log in to start a conversation", 401);
  }

  // 2. Validate input
  const body = await parseRequestBody<Record<string, unknown>>(request);
  if (!body) {
    return errorResponse("VALIDATION_ERROR", "Invalid request body");
  }

  const parseResult = conversationStartSchema.safeParse(body);
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    return errorResponse("VALIDATION_ERROR", firstError?.message || "Invalid input");
  }

  const { languagePair, scenarioId, difficultyLevel } = parseResult.data;

  // 3. Get or create user's DB record (auto-provisioning)
  const dbUser = await getOrCreateUser(user);

  const isPro = dbUser.subscription?.plan !== "free" && dbUser.subscription?.status === "active";

  // 4. Check daily limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyUsage = await db.dailyUsage.findUnique({
    where: { userId_date: { userId: dbUser.id, date: today } },
  });

  const conversationsToday = dailyUsage?.conversationsCount ?? 0;

  if (hasExceededDailyLimit(conversationsToday, isPro)) {
    return errorResponse(
      "FREE_LIMIT_EXCEEDED",
      "You've reached your daily conversation limit. Upgrade to Pro for unlimited conversations.",
      429
    );
  }

  // 5. Fetch scenario if provided
  let scenario = null;
  if (scenarioId) {
    scenario = await db.scenario.findUnique({ where: { id: scenarioId } });
    if (!scenario) {
      return errorResponse("NOT_FOUND", "Scenario not found", 404);
    }
    // Check premium scenario access
    if (scenario.isPremium && !isPro) {
      return errorResponse("PREMIUM_REQUIRED", "This scenario requires a Pro subscription", 403);
    }
  }

  const effectiveDifficulty = difficultyLevel || dbUser.proficiencyLevel;

  // 6. Create conversation in DB
  const conversation = await db.conversation.create({
    data: {
      userId: dbUser.id,
      scenarioId: scenarioId || null,
      languagePair,
      difficultyLevel: effectiveDifficulty,
      status: "active",
      startedAt: new Date(),
    },
  });

  // 7. Generate AI opening message
  const scenarioContext = scenario
    ? `Scenario: ${scenario.title}. ${scenario.description}. ${scenario.openingLine ? `Start the conversation with: "${scenario.openingLine}"` : ""}`
    : "Free conversation — the user wants to practice casually. Start with a friendly greeting and ask them about their day or interests.";

  const systemPrompt = buildSystemPrompt(
    languagePair.split("-")[0] === dbUser.nativeLanguage
      ? languagePair.split("-")[1]
      : languagePair.split("-")[0],
    dbUser.nativeLanguage,
    effectiveDifficulty,
    scenarioContext
  );

  let openingMessage = "Hello! Let's start practicing. How are you today?";
  let openingTranslation = "مرحبا! لنبدأ التمرين. كيف حالك اليوم؟";

  try {
    const aiProvider = getAIProvider();
    const targetLang =
      languagePair.split("-")[0] === dbUser.nativeLanguage
        ? languagePair.split("-")[1]
        : languagePair.split("-")[0];

    const aiResponse = await aiProvider.chat({
      systemPrompt,
      targetLanguage: targetLang,
      nativeLanguage: dbUser.nativeLanguage,
      proficiencyLevel: effectiveDifficulty,
      history: [],
      userMessage: "Start the conversation with a greeting.",
    });

    openingMessage = aiResponse.reply || openingMessage;
    openingTranslation = aiResponse.translatedReply || openingTranslation;

    // Save the opening message to DB
    await db.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: openingMessage,
        contentTranslated: openingTranslation,
      },
    });
  } catch (error) {
    console.error("[Conversations API] Failed to generate opening message:", error);
    // Save fallback message
    await db.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: openingMessage,
        contentTranslated: openingTranslation,
      },
    });
  }

  // 8. Update daily usage count
  await db.dailyUsage.upsert({
    where: { userId_date: { userId: dbUser.id, date: today } },
    create: {
      userId: dbUser.id,
      date: today,
      conversationsCount: 1,
      messagesCount: 0,
    },
    update: {
      conversationsCount: { increment: 1 },
    },
  });

  // 9. Update conversation message count
  await db.conversation.update({
    where: { id: conversation.id },
    data: { messageCount: 1 },
  });

  // 10. Return response
  return successResponse(
    {
      id: conversation.id,
      status: "active",
      languagePair: conversation.languagePair,
      difficultyLevel: conversation.difficultyLevel,
      openingMessage,
      openingTranslation,
    },
    201
  );
}
