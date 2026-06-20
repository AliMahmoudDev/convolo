/**
 * POST /api/conversations/[id]/end — End a conversation and get summary
 *
 * Flow:
 * 1. Verify user is authenticated
 * 2. Verify conversation exists, belongs to user, and is active
 * 3. Mark conversation as completed
 * 4. Calculate session summary (score, corrections, vocabulary, duration)
 * 5. Update user progress
 * 6. Return summary
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-helpers";
import { getScoreRating } from "@/lib/constants";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  // 3. Verify conversation
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        select: { role: true, corrections: true, vocabularyItems: true },
      },
    },
  });

  if (!conversation) {
    return errorResponse("NOT_FOUND", "Conversation not found", 404);
  }

  if (conversation.userId !== dbUser.id) {
    return errorResponse("FORBIDDEN", "You don't have access to this conversation", 403);
  }

  if (conversation.status !== "active") {
    return errorResponse("VALIDATION_ERROR", "This conversation has already ended");
  }

  // 4. Calculate summary
  const endedAt = new Date();
  const durationMs = endedAt.getTime() - conversation.startedAt.getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  // Count corrections from AI messages
  let correctionsCount = 0;
  let newVocabularyCount = 0;
  const vocabularyWords: string[] = [];

  for (const msg of conversation.messages) {
    if (msg.role === "assistant") {
      const corrections = msg.corrections as unknown[];
      const vocabulary = msg.vocabularyItems as unknown[];
      if (Array.isArray(corrections)) correctionsCount += corrections.length;
      if (Array.isArray(vocabulary)) {
        for (const v of vocabulary) {
          if (typeof v === "object" && v !== null && "word" in v) {
            const word = (v as { word: string }).word;
            if (word && !vocabularyWords.includes(word)) {
              vocabularyWords.push(word);
              newVocabularyCount++;
            }
          }
        }
      }
    }
  }

  // Calculate score based on corrections vs messages
  // Fewer corrections = higher score
  const userMessageCount = conversation.messages.filter((m) => m.role === "user").length;
  const correctionsRatio = userMessageCount > 0 ? correctionsCount / userMessageCount : 0;
  const overallScore = Math.max(0, Math.min(100, Math.round(100 - correctionsRatio * 20)));

  const scoreRating = getScoreRating(overallScore);

  // 5. Mark conversation as completed
  await db.conversation.update({
    where: { id: conversationId },
    data: {
      status: "completed",
      endedAt,
      overallScore,
      messageCount: conversation.messages.length,
    },
  });

  // 6. Update user progress (upsert)
  await db.userProgress.upsert({
    where: { userId_languagePair: { userId: dbUser.id, languagePair: conversation.languagePair } },
    create: {
      userId: dbUser.id,
      languagePair: conversation.languagePair,
      totalConversations: 1,
      totalMessages: userMessageCount,
      totalMinutes: durationMinutes,
      totalWordsLearned: newVocabularyCount,
      totalCorrections: correctionsCount,
      avgScore: overallScore,
      currentStreak: 1,
      longestStreak: 1,
      lastPracticeAt: endedAt,
      xpPoints: overallScore,
    },
    update: {
      totalConversations: { increment: 1 },
      totalMessages: { increment: userMessageCount },
      totalMinutes: { increment: durationMinutes },
      totalWordsLearned: { increment: newVocabularyCount },
      totalCorrections: { increment: correctionsCount },
      lastPracticeAt: endedAt,
      xpPoints: { increment: overallScore },
    },
  });

  // 7. Return summary
  return successResponse({
    overallScore,
    scoreRating,
    totalMessages: conversation.messages.length,
    correctionsCount,
    newVocabularyCount,
    durationMinutes: Math.max(1, durationMinutes),
  });
}
