/**
 * GET /api/vocabulary — List user's vocabulary items extracted from conversations
 *
 * Extracts unique vocabulary items from the `messages` table where role = 'assistant'.
 * For MVP, we extract on-the-fly from messages rather than using a separate table.
 *
 * Query params:
 *   ?search=xxx  — filter by word, translation, or definition (case-insensitive)
 *   ?page=1      — page number (1-based, default 1)
 *   ?limit=50    — items per page (default 50, max 200)
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-helpers";
import { getOrCreateUser } from "@/lib/user-provisioning";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface VocabItem {
  word: string;
  translation: string;
  definition?: string;
  partOfSpeech?: string;
  exampleSentence?: string;
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

/** Normalize a vocab item word for deduplication. */
function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

/** Check if a string matches a search query (case-insensitive). */
function matchesSearch(item: VocabItem, query: string): boolean {
  const q = query.toLowerCase();
  return (
    item.word.toLowerCase().includes(q) ||
    item.translation.toLowerCase().includes(q) ||
    !!(item.definition && item.definition.toLowerCase().includes(q)) ||
    !!(item.partOfSpeech && item.partOfSpeech.toLowerCase().includes(q))
  );
}

// ═══════════════════════════════════════════
// GET Handler
// ═══════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Please log in to view your vocabulary", 401);
    }

    // 2. Get or create user's DB record
    const dbUser = await getOrCreateUser(user);

    // 3. Parse query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));

    // 4. Get user's conversation IDs
    const { data: conversations, error: convError } = await db
      .from("conversations")
      .select("id")
      .eq("userId", dbUser.id);

    if (convError) {
      console.error("[Vocabulary API] Error fetching conversations:", convError);
      return errorResponse("INTERNAL_ERROR", "Failed to fetch vocabulary", 500);
    }

    const conversationIds = (conversations || []).map((c: any) => c.id);

    if (conversationIds.length === 0) {
      return successResponse({ items: [], total: 0, page, limit, totalPages: 0 });
    }

    // 5. Fetch messages with vocabularyItems from those conversations
    const { data: messages, error: msgError } = await db
      .from("messages")
      .select("vocabularyItems")
      .in("conversationId", conversationIds)
      .eq("role", "assistant");

    if (msgError) {
      console.error("[Vocabulary API] Error fetching messages:", msgError);
      return errorResponse("INTERNAL_ERROR", "Failed to fetch vocabulary", 500);
    }

    // 6. Extract and deduplicate vocabulary items
    const seen = new Set<string>();
    const uniqueItems: VocabItem[] = [];

    for (const msg of messages || []) {
      const items = msg.vocabularyItems as unknown[];
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        if (typeof item !== "object" || item === null || !("word" in item)) continue;

        const vocabItem = item as VocabItem;
        const key = normalizeWord(vocabItem.word);

        if (!key || seen.has(key)) continue;
        seen.add(key);

        // Apply search filter
        if (search && !matchesSearch(vocabItem, search)) continue;

        uniqueItems.push({
          word: vocabItem.word,
          translation: vocabItem.translation || "",
          definition: vocabItem.definition || undefined,
          partOfSpeech: vocabItem.partOfSpeech || undefined,
          exampleSentence: vocabItem.exampleSentence || undefined,
        });
      }
    }

    // 7. Paginate
    const total = uniqueItems.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedItems = uniqueItems.slice(start, start + limit);

    return successResponse({
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("[Vocabulary API] Unhandled error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch vocabulary", 500);
  }
}
