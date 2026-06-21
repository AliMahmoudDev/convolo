/**
 * GET /api/user/stats — Fetch the current user's learning statistics
 *
 * Returns real numbers for the dashboard cards:
 * - Total conversations
 * - Total words learned (unique)
 * - Current day streak
 * - XP points
 */

import { getAuthUser, errorResponse, successResponse } from "@/lib/api-helpers";
import { getOrCreateUser } from "@/lib/user-provisioning";
import { db, todayDateString } from "@/lib/db";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Please log in", 401);
    }

    const dbUser = await getOrCreateUser(user);

    // 1. Total conversations from conversations table
    const { count: totalConversations } = await db
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("userId", dbUser.id);

    // 2. Total unique words from messages
    const { data: vocabMessages } = await db
      .from("messages")
      .select("vocabularyItems")
      .eq("role", "assistant");

    const uniqueWords = new Set<string>();
    for (const msg of vocabMessages || []) {
      const items = msg.vocabularyItems as unknown[];
      if (Array.isArray(items)) {
        for (const item of items) {
          if (typeof item === "object" && item !== null && "word" in item) {
            uniqueWords.add((item as { word: string }).word);
          }
        }
      }
    }

    // 3. Calculate streak from daily_usage (consecutive days with activity)
    let currentStreak = 0;
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const { data: dayUsage } = await db
        .from("daily_usage")
        .select("conversationsCount")
        .eq("userId", dbUser.id)
        .eq("date", dateStr)
        .maybeSingle();

      if (dayUsage && dayUsage.conversationsCount > 0) {
        currentStreak++;
      } else if (i === 0) {
        // Today has no activity yet — skip to yesterday
        continue;
      } else {
        break;
      }
    }

    // 4. XP points from user_progress
    const { data: progress } = await db
      .from("user_progress")
      .select("xpPoints")
      .eq("userId", dbUser.id)
      .maybeSingle();

    const xpPoints = progress?.xpPoints || 0;

    return successResponse({
      conversations: totalConversations || 0,
      wordsLearned: uniqueWords.size,
      dayStreak: currentStreak,
      xpPoints,
    });
  } catch (error) {
    console.error("[Stats API] GET error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to load stats. Please try again.", 500);
  }
}
