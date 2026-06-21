/**
 * GET /api/user/progress — Fetch the current user's detailed progress data
 *
 * Returns comprehensive learning analytics:
 * - Overview stats (conversations, messages, minutes, XP, corrections, words)
 * - Current & longest streak
 * - Average score & level progress
 * - Weekly activity (last 7 days)
 * - Per-language-pair progress
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

    // ═══════════════════════════════════════════
    // 1. Core aggregates from conversations
    // ═══════════════════════════════════════════

    const { count: totalConversations } = await db
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("userId", dbUser.id);

    // ═══════════════════════════════════════════
    // 2. Total messages count
    // ═══════════════════════════════════════════

    const { count: totalMessages } = await db
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("userId", dbUser.id);

    // ═══════════════════════════════════════════
    // 3. Total minutes from conversations (durationMinutes)
    // ═══════════════════════════════════════════

    const { data: convDurations } = await db
      .from("conversations")
      .select("durationMinutes")
      .eq("userId", dbUser.id);

    const totalMinutes = (convDurations || []).reduce(
      (sum, c) => sum + (c.durationMinutes || 0),
      0
    );

    // ═══════════════════════════════════════════
    // 4. Total corrections from messages
    // ═══════════════════════════════════════════

    const { data: correctionMessages } = await db
      .from("messages")
      .select("corrections")
      .eq("role", "assistant")
      .eq("userId", dbUser.id);

    let totalCorrections = 0;
    for (const msg of correctionMessages || []) {
      const items = msg.corrections as unknown[];
      if (Array.isArray(items)) {
        totalCorrections += items.length;
      }
    }

    // ═══════════════════════════════════════════
    // 5. Words learned (unique vocabulary items)
    // ═══════════════════════════════════════════

    const { data: vocabMessages } = await db
      .from("messages")
      .select("vocabularyItems")
      .eq("role", "assistant")
      .eq("userId", dbUser.id);

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

    const totalWordsLearned = uniqueWords.size;

    // ═══════════════════════════════════════════
    // 6. User progress record (XP, avgScore, levelProgress)
    // ═══════════════════════════════════════════

    const { data: progressRecord } = await db
      .from("user_progress")
      .select("xpPoints, avgScore, levelProgress, languagePair")
      .eq("userId", dbUser.id);

    // Aggregate XP and score across all language pairs
    const xpPoints = (progressRecord || []).reduce((sum, r) => sum + (r.xpPoints || 0), 0);

    // Weighted average score
    const validScores = (progressRecord || []).filter((r) => r.avgScore != null);
    const avgScore =
      validScores.length > 0
        ? Math.round(validScores.reduce((sum, r) => sum + (r.avgScore || 0), 0) / validScores.length)
        : 0;

    const levelProgress =
      validScores.length > 0
        ? Math.round(
            validScores.reduce((sum, r) => sum + (r.levelProgress || 0), 0) / validScores.length
          )
        : 0;

    // ═══════════════════════════════════════════
    // 7. Streak calculation from daily_usage
    // ═══════════════════════════════════════════

    // Fetch all daily_usage records for the user, ordered by date descending
    const { data: allDailyUsage } = await db
      .from("daily_usage")
      .select("date, conversationsCount, messagesCount, minutesCount")
      .eq("userId", dbUser.id)
      .order("date", { ascending: false });

    const dailyUsageByDate = new Map<string, number>();
    for (const du of allDailyUsage || []) {
      dailyUsageByDate.set(du.date, du.conversationsCount || 0);
    }

    // Current streak: count consecutive days with activity
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const count = dailyUsageByDate.get(dateStr);

      if (count && count > 0) {
        currentStreak++;
      } else if (i === 0) {
        // Today has no activity yet — skip to yesterday
        continue;
      } else {
        break;
      }
    }

    // Longest streak: calculate from sorted daily usage
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    const sortedUsage = (allDailyUsage || [])
      .filter((du) => (du.conversationsCount || 0) > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    for (const du of sortedUsage) {
      const currentDate = new Date(du.date + "T00:00:00Z");
      if (prevDate) {
        const diffTime = currentDate.getTime() - prevDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      prevDate = currentDate;
    }

    // ═══════════════════════════════════════════
    // 8. Last practice timestamp
    // ═══════════════════════════════════════════

    const { data: lastConversation } = await db
      .from("conversations")
      .select("updatedAt")
      .eq("userId", dbUser.id)
      .order("updatedAt", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastPracticeAt = lastConversation?.updatedAt || null;

    // ═══════════════════════════════════════════
    // 9. Weekly activity (last 7 days)
    // ═══════════════════════════════════════════

    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayUsage = allDailyUsage?.find((du) => du.date === dateStr);

      weeklyActivity.push({
        date: dateStr,
        conversations: dayUsage?.conversationsCount || 0,
        messages: dayUsage?.messagesCount || 0,
        minutes: dayUsage?.minutesCount || 0,
      });
    }

    // ═══════════════════════════════════════════
    // 10. Language progress (grouped by languagePair from user_progress)
    // ═══════════════════════════════════════════

    // Also get per-language conversation counts
    const { data: langConversations } = await db
      .from("conversations")
      .select("languagePair")
      .eq("userId", dbUser.id);

    // Count conversations per language pair
    const convCountsByLang = new Map<string, number>();
    for (const conv of langConversations || []) {
      const lp = conv.languagePair;
      convCountsByLang.set(lp, (convCountsByLang.get(lp) || 0) + 1);
    }

    // Build language progress from user_progress records
    const languageProgress = (progressRecord || []).map((r) => ({
      languagePair: r.languagePair,
      totalConversations: convCountsByLang.get(r.languagePair) || 0,
      avgScore: r.avgScore || 0,
      wordsLearned: 0,
    }));

    // Also add language pairs that have conversations but no progress record yet
    for (const [lp, count] of convCountsByLang.entries()) {
      if (!languageProgress.find((p) => p.languagePair === lp)) {
        languageProgress.push({
          languagePair: lp,
          totalConversations: count,
          avgScore: 0,
          wordsLearned: 0,
        });
      }
    }

    // ═══════════════════════════════════════════
    // Return the combined progress data
    // ═══════════════════════════════════════════

    return successResponse({
      totalConversations: totalConversations || 0,
      totalMessages: totalMessages || 0,
      totalMinutes: Math.round(totalMinutes),
      totalWordsLearned,
      totalCorrections,
      currentStreak,
      longestStreak,
      xpPoints,
      avgScore,
      levelProgress,
      lastPracticeAt,
      weeklyActivity,
      languageProgress,
    });
  } catch (error) {
    console.error("[Progress API] GET error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to load progress data. Please try again.", 500);
  }
}
