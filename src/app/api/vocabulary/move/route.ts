/**
 * POST /api/vocabulary/move — Move a vocabulary word to a different language pair
 *
 * This allows users to reorganize their vocabulary by moving words
 * from one language to another without affecting the dashboard profile.
 *
 * How it works:
 * - Finds the message containing the word
 * - Adds a vocabularyOverrides entry in the message metadata
 * - The vocabulary API reads overrides and uses them instead of conversation languagePair
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, errorResponse, successResponse, parseRequestBody } from "@/lib/api-helpers";
import { getOrCreateUser } from "@/lib/user-provisioning";

/** Normalize a vocab item word for deduplication. */
function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Please log in to move vocabulary", 401);
    }

    // 2. Parse request
    const body = await parseRequestBody<{
      word: string;
      newLanguagePair: string;
    }>(request);

    if (!body?.word || !body.newLanguagePair) {
      return errorResponse("BAD_REQUEST", "word and newLanguagePair are required", 400);
    }

    const { word, newLanguagePair } = body;
    const normalizedWord = normalizeWord(word);
    const itemId = `vocab_${normalizedWord}`;

    // 3. Get user's conversations
    const dbUser = await getOrCreateUser(user);

    const { data: conversations, error: convError } = await db
      .from("conversations")
      .select("id")
      .eq("userId", dbUser.id);

    if (convError) {
      console.error("[Vocabulary Move API] Error fetching conversations:", convError);
      return errorResponse("INTERNAL_ERROR", "Failed to move vocabulary", 500);
    }

    const conversationIds = (conversations || []).map((c: any) => c.id);
    if (conversationIds.length === 0) {
      return errorResponse("NOT_FOUND", "No conversations found", 404);
    }

    // 4. Find the message containing this word
    const { data: messages, error: msgError } = await db
      .from("messages")
      .select("id, vocabularyItems, metadata")
      .in("conversationId", conversationIds)
      .eq("role", "assistant");

    if (msgError) {
      console.error("[Vocabulary Move API] Error fetching messages:", msgError);
      return errorResponse("INTERNAL_ERROR", "Failed to move vocabulary", 500);
    }

    // Find the message with this word
    let targetMessageId: string | null = null;
    let targetMetadata: Record<string, unknown> = {};

    for (const msg of messages || []) {
      const items = msg.vocabularyItems as unknown[];
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        if (typeof item !== "object" || item === null || !("word" in item)) continue;
        const vocabItem = item as { word: string };
        if (normalizeWord(vocabItem.word) === normalizedWord) {
          targetMessageId = msg.id as string;
          targetMetadata = (msg.metadata as Record<string, unknown>) || {};
          break;
        }
      }

      if (targetMessageId) break;
    }

    if (!targetMessageId) {
      return errorResponse("NOT_FOUND", "Word not found in your vocabulary", 404);
    }

    // 5. Update message metadata with vocabulary override
    const existingOverrides =
      (targetMetadata.vocabularyOverrides as Record<string, { languagePair: string }>) || {};

    const updatedOverrides = {
      ...existingOverrides,
      [itemId]: { languagePair: newLanguagePair },
    };

    const updatedMetadata = {
      ...targetMetadata,
      vocabularyOverrides: updatedOverrides,
    };

    // 6. Save to database
    const { error: updateError } = await db
      .from("messages")
      .update({ metadata: updatedMetadata })
      .eq("id", targetMessageId);

    if (updateError) {
      console.error("[Vocabulary Move API] Error updating metadata:", updateError);
      return errorResponse("INTERNAL_ERROR", "Failed to move vocabulary", 500);
    }

    return successResponse({
      word,
      itemId,
      newLanguagePair,
      message: "Word moved to new language",
    });
  } catch (error) {
    console.error("[Vocabulary Move API] Unhandled error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to move vocabulary", 500);
  }
}
