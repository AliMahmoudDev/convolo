/**
 * GET /api/vocabulary — List user's vocabulary items extracted from conversations
 *
 * Extracts unique vocabulary items from the `messages` table where role = 'assistant'.
 * For MVP, we extract on-the-fly from messages rather than using a separate table.
 *
 * Query params:
 *   ?languagePair=en-ar — filter by language pair (e.g., "en-ar")
 *   ?search=xxx         — filter by word, translation, or definition (case-insensitive)
 *   ?page=1             — page number (1-based, default 1)
 *   ?limit=50           — items per page (default 50, max 200)
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
  languagePair?: string;
}

interface LanguageGroup {
  languagePair: string;
  nativeLang: string;
  targetLang: string;
  count: number;
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
    const languagePair = searchParams.get("languagePair")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));

    // 4. Get ALL user's conversation IDs (not filtered by language)
    // Words may have been moved between languages via overrides, so we need all
    const { data: conversations, error: convError } = await db
      .from("conversations")
      .select("id, languagePair")
      .eq("userId", dbUser.id);

    if (convError) {
      console.error("[Vocabulary API] Error fetching conversations:", convError);
      return errorResponse("INTERNAL_ERROR", "Failed to fetch vocabulary", 500);
    }

    const conversationIds = (conversations || []).map((c: any) => c.id);

    // Build a map of conversationId -> languagePair for tagging vocab items
    const convLangMap = new Map<string, string>();
    for (const conv of conversations || []) {
      convLangMap.set(conv.id, conv.languagePair || "unknown");
    }

    if (conversationIds.length === 0) {
      return successResponse({
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
        languageGroups: [],
      });
    }

    // 5. Fetch messages with vocabularyItems + metadata (for language overrides) from those conversations
    const { data: messages, error: msgError } = await db
      .from("messages")
      .select("conversationId, vocabularyItems, metadata")
      .in("conversationId", conversationIds)
      .eq("role", "assistant");

    if (msgError) {
      console.error("[Vocabulary API] Error fetching messages:", msgError);
      return errorResponse("INTERNAL_ERROR", "Failed to fetch vocabulary", 500);
    }

    // 6. Extract and deduplicate vocabulary items (tagged with languagePair)
    // Check vocabularyOverrides in metadata for per-word language reassignment
    const seen = new Set<string>();
    const uniqueItems: VocabItem[] = [];
    const langGroupCounts = new Map<string, number>();

    for (const msg of messages || []) {
      const items = msg.vocabularyItems as unknown[];
      if (!Array.isArray(items)) continue;

      const msgLangPair = convLangMap.get(msg.conversationId as string) || "unknown";

      // Build override lookup from message metadata
      const metadata = msg.metadata as Record<string, unknown> | null;
      const vocabOverrides =
        (metadata?.vocabularyOverrides as Record<string, { languagePair: string }>) || {};

      for (const item of items) {
        if (typeof item !== "object" || item === null || !("word" in item)) continue;

        const vocabItem = item as VocabItem;
        const key = normalizeWord(vocabItem.word);

        if (!key || seen.has(key)) continue;
        seen.add(key);

        // Check if this word has a language override
        const itemId = `vocab_${key}`;
        const override = vocabOverrides[itemId];
        const effectiveLangPair = override?.languagePair || msgLangPair;

        // Apply search filter
        if (search && !matchesSearch(vocabItem, search)) continue;

        // Apply language pair filter (using effective/overridden pair)
        if (languagePair && effectiveLangPair !== languagePair) continue;

        uniqueItems.push({
          word: vocabItem.word,
          translation: vocabItem.translation || "",
          definition: vocabItem.definition || undefined,
          partOfSpeech: vocabItem.partOfSpeech || undefined,
          exampleSentence: vocabItem.exampleSentence || undefined,
          languagePair: effectiveLangPair,
        });

        // Track counts per language pair (using effective pair)
        langGroupCounts.set(effectiveLangPair, (langGroupCounts.get(effectiveLangPair) || 0) + 1);
      }
    }

    // 7. Build language groups summary
    const languageGroups: LanguageGroup[] = Array.from(langGroupCounts.entries())
      .map(([pair, count]) => {
        const [nativeLang, targetLang] = pair.split("-");
        return {
          languagePair: pair,
          nativeLang: nativeLang || "?",
          targetLang: targetLang || "?",
          count,
        };
      })
      .sort((a, b) => b.count - a.count); // Most words first

    // 8. Paginate
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
      languageGroups,
    });
  } catch (error) {
    console.error("[Vocabulary API] Unhandled error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch vocabulary", 500);
  }
}
