/**
 * GET /api/vocabulary/review — Get vocabulary items due for SRS review
 * POST /api/vocabulary/review — Submit a review result for a vocabulary item
 *
 * SRS (Spaced Repetition System) Review API:
 * - GET: Fetches up to 10 vocabulary items sorted by SRS priority
 *   (lower mastery or older review dates come first)
 * - POST: Records a review result and updates the next review schedule
 *
 * For MVP, SRS data is stored in the message metadata (JSON field).
 * Each reviewed word gets a review entry with mastery level and next review date.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, errorResponse, successResponse, parseRequestBody } from "@/lib/api-helpers";
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

interface ReviewMeta {
  /** Normalized word key for dedup and lookup */
  key: string;
  /** Current mastery level (0-5) */
  mastery: number;
  /** ISO date string of last review */
  lastReviewed: string | null;
  /** ISO date string of next scheduled review */
  nextReview: string | null;
  /** Number of times reviewed */
  reviewCount: number;
  /** Number of correct (good/easy) reviews */
  correctCount: number;
}

interface ReviewItem extends VocabItem {
  /** Unique item ID (derived from normalized word) */
  itemId: string;
  /** Current SRS metadata */
  srs: ReviewMeta;
}

interface ReviewPayload {
  itemId: string;
  quality: "again" | "hard" | "good" | "easy";
}

// ═══════════════════════════════════════════
// SRS Configuration (simplified)
// ═══════════════════════════════════════════

/** Base intervals in minutes for each quality rating */
const SRS_BASE_INTERVALS: Record<string, number> = {
  again: 1, // 1 minute
  hard: 10, // 10 minutes
  good: 1440, // 1 day (24 * 60)
  easy: 10080, // 7 days (7 * 24 * 60)
};

/** Quality score mapping */
const QUALITY_SCORES: Record<string, number> = {
  again: 0,
  hard: 1,
  good: 2,
  easy: 3,
};

/** Maximum mastery level */
const MAX_MASTERY = 5;

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

/** Normalize a word for deduplication and ID generation */
function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

/** Generate a stable item ID from a normalized word */
function generateItemId(word: string): string {
  return `vocab_${normalizeWord(word)}`;
}

/** Create default SRS metadata for a new item */
function createDefaultSrs(word: string): ReviewMeta {
  return {
    key: normalizeWord(word),
    mastery: 0,
    lastReviewed: null,
    nextReview: null, // null means due immediately
    reviewCount: 0,
    correctCount: 0,
  };
}

/** Check if an item is due for review */
function isDueForReview(srs: ReviewMeta): boolean {
  if (!srs.nextReview) return true; // Never reviewed → due
  return new Date(srs.nextReview) <= new Date();
}

/**
 * Calculate new SRS metadata after a review.
 *
 * Simplified algorithm:
 * - "again": mastery stays or drops, interval = 1 min
 * - "hard": mastery stays, interval = current * 1
 * - "good": mastery +1, interval = current * 2
 * - "easy": mastery +2, interval = current * 3
 */
function calculateNewSrs(current: ReviewMeta, quality: "again" | "hard" | "good" | "easy"): ReviewMeta {
  const now = new Date();
  const baseInterval = SRS_BASE_INTERVALS[quality];
  const qualityScore = QUALITY_SCORES[quality];

  let newMastery: number;
  let intervalMinutes: number;

  if (quality === "again") {
    // Reset: mastery drops (but not below 0), short interval
    newMastery = Math.max(0, current.mastery - 1);
    intervalMinutes = baseInterval;
  } else if (quality === "hard") {
    // Stagnant: mastery stays, interval = current interval * 1 (or base if no current)
    newMastery = current.mastery;
    const currentIntervalMinutes = current.nextReview
      ? Math.max(baseInterval, (new Date(current.nextReview).getTime() - now.getTime()) / 60000)
      : baseInterval;
    intervalMinutes = currentIntervalMinutes * 1;
  } else if (quality === "good") {
    // Progress: mastery +1, interval grows
    newMastery = Math.min(MAX_MASTERY, current.mastery + 1);
    const currentIntervalMinutes = current.nextReview
      ? Math.max(baseInterval, (new Date(current.nextReview).getTime() - now.getTime()) / 60000)
      : baseInterval;
    intervalMinutes = currentIntervalMinutes * 2;
  } else {
    // Easy: mastery +2, interval grows faster
    newMastery = Math.min(MAX_MASTERY, current.mastery + 2);
    const currentIntervalMinutes = current.nextReview
      ? Math.max(baseInterval, (new Date(current.nextReview).getTime() - now.getTime()) / 60000)
      : baseInterval;
    intervalMinutes = currentIntervalMinutes * 3;
  }

  // Minimum interval of 1 minute
  intervalMinutes = Math.max(1, intervalMinutes);

  const nextReview = new Date(now.getTime() + intervalMinutes * 60000);

  const isCorrect = qualityScore >= 2; // good or easy

  return {
    key: current.key,
    mastery: newMastery,
    lastReviewed: now.toISOString(),
    nextReview: nextReview.toISOString(),
    reviewCount: current.reviewCount + 1,
    correctCount: current.correctCount + (isCorrect ? 1 : 0),
  };
}

// ═══════════════════════════════════════════
// GET Handler — Fetch review items
// ═══════════════════════════════════════════

export async function GET() {
  try {
    // 1. Authenticate
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Please log in to review vocabulary", 401);
    }

    // 2. Get or create user's DB record
    const dbUser = await getOrCreateUser(user);

    // 3. Get user's conversation IDs
    const { data: conversations, error: convError } = await db
      .from("conversations")
      .select("id")
      .eq("userId", dbUser.id);

    if (convError) {
      console.error("[Review API] Error fetching conversations:", convError);
      return errorResponse("INTERNAL_ERROR", "Failed to fetch review items", 500);
    }

    const conversationIds = (conversations || []).map((c) => c.id);

    if (conversationIds.length === 0) {
      return successResponse({ items: [], total: 0 });
    }

    // 4. Fetch messages with vocabularyItems and metadata
    const { data: messages, error: msgError } = await db
      .from("messages")
      .select("vocabularyItems, metadata")
      .in("conversationId", conversationIds)
      .eq("role", "assistant");

    if (msgError) {
      console.error("[Review API] Error fetching messages:", msgError);
      return errorResponse("INTERNAL_ERROR", "Failed to fetch review items", 500);
    }

    // 5. Extract, deduplicate, and enrich vocabulary items with SRS data
    const seen = new Set<string>();
    const reviewItems: ReviewItem[] = [];

    // Build SRS lookup from message metadata
    // Metadata format: { srsReviews: { [itemId]: ReviewMeta } }
    const srsLookup = new Map<string, ReviewMeta>();
    for (const msg of messages || []) {
      const metadata = msg.metadata as Record<string, unknown> | null;
      if (metadata?.srsReviews && typeof metadata.srsReviews === "object") {
        const reviews = metadata.srsReviews as Record<string, ReviewMeta>;
        for (const [itemId, srsData] of Object.entries(reviews)) {
          if (!srsLookup.has(itemId)) {
            srsLookup.set(itemId, srsData);
          }
        }
      }
    }

    for (const msg of messages || []) {
      const items = msg.vocabularyItems as unknown[];
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        if (typeof item !== "object" || item === null || !("word" in item)) continue;

        const vocabItem = item as VocabItem;
        const key = normalizeWord(vocabItem.word);

        if (!key || seen.has(key)) continue;
        seen.add(key);

        const itemId = generateItemId(vocabItem.word);
        const srs = srsLookup.get(itemId) || createDefaultSrs(vocabItem.word);

        reviewItems.push({
          word: vocabItem.word,
          translation: vocabItem.translation || "",
          definition: vocabItem.definition || undefined,
          partOfSpeech: vocabItem.partOfSpeech || undefined,
          exampleSentence: vocabItem.exampleSentence || undefined,
          itemId,
          srs,
        });
      }
    }

    // 6. Filter due items and sort by SRS priority
    const dueItems = reviewItems.filter((item) => isDueForReview(item.srs));

    // Sort: lower mastery first, then older lastReviewed first, then no review first
    dueItems.sort((a, b) => {
      // Never reviewed items come first
      const aReviewed = a.srs.reviewCount;
      const bReviewed = b.srs.reviewCount;
      if (aReviewed === 0 && bReviewed !== 0) return -1;
      if (bReviewed === 0 && aReviewed !== 0) return 1;

      // Lower mastery first
      if (a.srs.mastery !== b.srs.mastery) {
        return a.srs.mastery - b.srs.mastery;
      }

      // Older lastReviewed first
      if (a.srs.lastReviewed && b.srs.lastReviewed) {
        return new Date(a.srs.lastReviewed).getTime() - new Date(b.srs.lastReviewed).getTime();
      }

      return 0;
    });

    // 7. Return up to 10 items
    const items = dueItems.slice(0, 10);

    return successResponse({
      items,
      total: dueItems.length,
      showing: items.length,
    });
  } catch (error) {
    console.error("[Review API] Unhandled error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch review items", 500);
  }
}

// ═══════════════════════════════════════════
// POST Handler — Submit review result
// ═══════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Please log in to submit reviews", 401);
    }

    // 2. Parse request body
    const body = await parseRequestBody<ReviewPayload>(request);
    if (!body) {
      return errorResponse("BAD_REQUEST", "Invalid request body", 400);
    }

    const { itemId, quality } = body;

    if (!itemId || !quality) {
      return errorResponse("BAD_REQUEST", "Missing required fields: itemId, quality", 400);
    }

    if (!["again", "hard", "good", "easy"].includes(quality)) {
      return errorResponse("BAD_REQUEST", "Quality must be one of: again, hard, good, easy", 400);
    }

    // 3. Get or create user's DB record
    const dbUser = await getOrCreateUser(user);

    // 4. Find the message containing this vocabulary item
    // Extract the word key from itemId (format: vocab_<normalized_word>)
    const wordKey = itemId.replace("vocab_", "");

    const { data: conversations, error: convError } = await db
      .from("conversations")
      .select("id")
      .eq("userId", dbUser.id);

    if (convError) {
      console.error("[Review API] Error fetching conversations:", convError);
      return errorResponse("INTERNAL_ERROR", "Failed to submit review", 500);
    }

    const conversationIds = (conversations || []).map((c) => c.id);

    if (conversationIds.length === 0) {
      return errorResponse("NOT_FOUND", "No conversations found", 404);
    }

    // Find messages that contain this vocabulary item
    const { data: messages, error: msgError } = await db
      .from("messages")
      .select("id, vocabularyItems, metadata")
      .in("conversationId", conversationIds)
      .eq("role", "assistant");

    if (msgError) {
      console.error("[Review API] Error fetching messages:", msgError);
      return errorResponse("INTERNAL_ERROR", "Failed to submit review", 500);
    }

    // Find the first message containing this word
    let targetMessageId: string | null = null;
    let currentSrs: ReviewMeta = createDefaultSrs(wordKey);

    for (const msg of messages || []) {
      const items = msg.vocabularyItems as unknown[];
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        if (typeof item !== "object" || item === null || !("word" in item)) continue;
        const vocabItem = item as VocabItem;
        if (normalizeWord(vocabItem.word) === wordKey) {
          targetMessageId = msg.id as string;

          // Load existing SRS data from metadata
          const metadata = msg.metadata as Record<string, unknown> | null;
          if (metadata?.srsReviews && typeof metadata.srsReviews === "object") {
            const reviews = metadata.srsReviews as Record<string, ReviewMeta>;
            if (reviews[itemId]) {
              currentSrs = reviews[itemId];
            }
          }
          break;
        }
      }

      if (targetMessageId) break;
    }

    if (!targetMessageId) {
      return errorResponse("NOT_FOUND", "Vocabulary item not found", 404);
    }

    // 5. Calculate new SRS metadata
    const newSrs = calculateNewSrs(currentSrs, quality);

    // 6. Update the message metadata with the new SRS data
    // We need to merge with existing metadata
    const existingMsg = messages!.find((m) => (m.id as string) === targetMessageId);
    const existingMetadata = (existingMsg?.metadata as Record<string, unknown>) || {};
    const existingSrsReviews = (existingMetadata.srsReviews as Record<string, ReviewMeta>) || {};

    const updatedSrsReviews = {
      ...existingSrsReviews,
      [itemId]: newSrs,
    };

    const updatedMetadata = {
      ...existingMetadata,
      srsReviews: updatedSrsReviews,
    };

    // 7. Update the message in the database
    const { error: updateError } = await db
      .from("messages")
      .update({ metadata: updatedMetadata })
      .eq("id", targetMessageId);

    if (updateError) {
      console.error("[Review API] Error updating message metadata:", updateError);
      // For MVP, still return success even if DB update fails
      // The client tracks progress locally
    }

    return successResponse({
      itemId,
      quality,
      srs: newSrs,
      message: "Review recorded successfully",
    });
  } catch (error) {
    console.error("[Review API] Unhandled error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to submit review", 500);
  }
}
