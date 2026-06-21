/**
 * GET /api/conversations/[id] — Fetch a conversation with all its messages
 * POST /api/conversations/[id] — End a conversation and get summary
 *
 * Uses Supabase JS Client (PostgREST over HTTPS).
 * Column names use camelCase as returned by PostgREST.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-helpers";
import { getOrCreateUser } from "@/lib/user-provisioning";
import { getScoreRating } from "@/lib/constants";

// ═══════════════════════════════════════════
// GET — Fetch conversation with messages
// ═══════════════════════════════════════════

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params;

  try {
    // 1. Authenticate
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Please log in", 401);
    }

    // 2. Get or create user's DB record
    const dbUser = await getOrCreateUser(user);

    // 3. Fetch conversation
    const { data: conversation, error: convError } = await db
      .from("conversations")
      .select(
        `
        id,
        userId,
        languagePair,
        difficultyLevel,
        status,
        startedAt,
        endedAt,
        messageCount,
        overallScore,
        scenarioId,
        scenario:scenarios(title, description)
      `
      )
      .eq("id", conversationId)
      .maybeSingle();

    if (convError || !conversation) {
      return errorResponse("NOT_FOUND", "Conversation not found", 404);
    }

    if (conversation.userId !== dbUser.id) {
      return errorResponse("FORBIDDEN", "You don't have access to this conversation", 403);
    }

    // 4. Fetch messages
    const { data: messages, error: msgError } = await db
      .from("messages")
      .select(
        "id, role, content, contentTranslated, corrections, vocabularyItems, grammarNotes, metadata, createdAt"
      )
      .eq("conversationId", conversationId)
      .order("createdAt", { ascending: true });

    if (msgError) {
      console.error("[Conversation GET] Messages fetch error:", msgError);
      return errorResponse("INTERNAL_ERROR", "Failed to load messages", 500);
    }

    // 5. Calculate duration for active conversations
    const startedAt = new Date(conversation.startedAt);
    const endedAt = conversation.endedAt ? new Date(conversation.endedAt) : new Date();
    const durationMs = endedAt.getTime() - startedAt.getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    // 6. Count total corrections and vocabulary
    let totalCorrections = 0;
    let totalVocabulary = 0;
    const uniqueWords: string[] = [];

    for (const msg of messages || []) {
      if (msg.role === "assistant") {
        const corrections = msg.corrections as unknown[];
        const vocabulary = msg.vocabularyItems as unknown[];
        if (Array.isArray(corrections)) totalCorrections += corrections.length;
        if (Array.isArray(vocabulary)) {
          for (const v of vocabulary) {
            if (typeof v === "object" && v !== null && "word" in v) {
              const word = (v as { word: string }).word;
              if (word && !uniqueWords.includes(word)) {
                uniqueWords.push(word);
                totalVocabulary++;
              }
            }
          }
        }
      }
    }

    // 7. Return conversation data
    return successResponse({
      id: conversation.id,
      languagePair: conversation.languagePair,
      difficultyLevel: conversation.difficultyLevel,
      status: conversation.status,
      startedAt: conversation.startedAt,
      endedAt: conversation.endedAt ?? null,
      durationMinutes: Math.max(1, durationMinutes),
      messageCount: conversation.messageCount,
      overallScore: conversation.overallScore,
      scenario: conversation.scenario,
      totalCorrections,
      totalVocabulary,
      messages: (messages || []).map((msg) => {
        // Extract suggestions from metadata if available
        const metadata = (msg.metadata || {}) as Record<string, unknown>;
        const suggestions = Array.isArray(metadata.suggestions)
          ? (metadata.suggestions as string[])
          : [];
        return {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          translatedContent: msg.contentTranslated,
          corrections: msg.corrections,
          vocabularyItems: msg.vocabularyItems,
          grammarNotes: msg.grammarNotes,
          suggestions,
          createdAt: msg.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error("[Conversation GET] Unhandled error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to load conversation. Please try again.", 500);
  }
}

// ═══════════════════════════════════════════
// POST — End conversation and get summary
// ═══════════════════════════════════════════

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = await params;

  try {
    // 1. Authenticate
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Please log in", 401);
    }

    // 2. Get or create user's DB record
    const dbUser = await getOrCreateUser(user);

    // 3. Verify conversation
    const { data: conversation, error: convError } = await db
      .from("conversations")
      .select("id, userId, languagePair, status, startedAt, difficultyLevel")
      .eq("id", conversationId)
      .maybeSingle();

    if (convError || !conversation) {
      return errorResponse("NOT_FOUND", "Conversation not found", 404);
    }

    if (conversation.userId !== dbUser.id) {
      return errorResponse("FORBIDDEN", "You don't have access to this conversation", 403);
    }

    if (conversation.status !== "active") {
      return errorResponse("VALIDATION_ERROR", "This conversation has already ended");
    }

    // 4. Fetch messages for summary calculation
    const { data: messages } = await db
      .from("messages")
      .select("role, corrections, vocabularyItems")
      .eq("conversationId", conversationId);

    // 5. Calculate summary
    const endedAt = new Date();
    const startedAt = new Date(conversation.startedAt);
    const durationMs = endedAt.getTime() - startedAt.getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    // Count corrections from AI messages
    let correctionsCount = 0;
    let newVocabularyCount = 0;
    const vocabularyWords: string[] = [];

    for (const msg of messages || []) {
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
    const userMessageCount = (messages || []).filter((m) => m.role === "user").length;
    const correctionsRatio = userMessageCount > 0 ? correctionsCount / userMessageCount : 0;
    const overallScore = Math.max(0, Math.min(100, Math.round(100 - correctionsRatio * 20)));

    const scoreRating = getScoreRating(overallScore);

    const totalMessages = (messages || []).length;
    const now = endedAt.toISOString();

    // 6. Mark conversation as completed
    await db
      .from("conversations")
      .update({
        status: "completed",
        endedAt: now,
        overallScore,
        messageCount: totalMessages,
      })
      .eq("id", conversationId);

    // 7. Update user progress (upsert pattern)
    const { data: existingProgress } = await db
      .from("user_progress")
      .select("*")
      .eq("userId", dbUser.id)
      .eq("languagePair", conversation.languagePair)
      .maybeSingle();

    if (existingProgress) {
      await db
        .from("user_progress")
        .update({
          totalConversations: existingProgress.totalConversations + 1,
          totalMessages: existingProgress.totalMessages + userMessageCount,
          totalMinutes: existingProgress.totalMinutes + durationMinutes,
          totalWordsLearned: existingProgress.totalWordsLearned + newVocabularyCount,
          totalCorrections: existingProgress.totalCorrections + correctionsCount,
          lastPracticeAt: now,
          xpPoints: existingProgress.xpPoints + overallScore,
          updatedAt: now,
        })
        .eq("id", existingProgress.id);
    } else {
      await db.from("user_progress").insert({
        id: crypto.randomUUID(),
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
        lastPracticeAt: now,
        levelProgress: 0,
        xpPoints: overallScore,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 8. Return summary
    return successResponse({
      overallScore,
      scoreRating,
      totalMessages,
      correctionsCount,
      newVocabularyCount,
      durationMinutes: Math.max(1, durationMinutes),
    });
  } catch (error) {
    console.error("[Conversation POST] Unhandled error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to end conversation. Please try again.", 500);
  }
}
