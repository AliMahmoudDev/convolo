/**
 * GET /api/achievements — Calculate and return all achievements for the current user
 *
 * Calculates which achievements are unlocked based on the user's real stats,
 * then returns the full list with unlocked status.
 * Also persists newly unlocked achievements to the DB.
 */

import { getAuthUser, errorResponse, successResponse } from "@/lib/api-helpers";
import { getOrCreateUser } from "@/lib/user-provisioning";
import { db } from "@/lib/db";

// ═══════════════════════════════════════════
// Achievement Definitions
// ═══════════════════════════════════════════

interface UserStats {
  conversations: number;
  wordsLearned: number;
  dayStreak: number;
  bestScore: number;
  xpPoints: number;
}

interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (stats: UserStats) => boolean;
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_chat",
    title: "First Steps",
    description: "Complete your first conversation",
    icon: "💬",
    condition: (stats) => stats.conversations >= 1,
  },
  {
    id: "chatterbox",
    title: "Chatterbox",
    description: "Complete 10 conversations",
    icon: "🗣️",
    condition: (stats) => stats.conversations >= 10,
  },
  {
    id: "polyglot",
    title: "Polyglot",
    description: "Complete 25 conversations",
    icon: "🌍",
    condition: (stats) => stats.conversations >= 25,
  },
  {
    id: "word_collector",
    title: "Word Collector",
    description: "Learn 50 words",
    icon: "📚",
    condition: (stats) => stats.wordsLearned >= 50,
  },
  {
    id: "vocabulary_master",
    title: "Vocabulary Master",
    description: "Learn 200 words",
    icon: "🎓",
    condition: (stats) => stats.wordsLearned >= 200,
  },
  {
    id: "streak_3",
    title: "On Fire",
    description: "3-day practice streak",
    icon: "🔥",
    condition: (stats) => stats.dayStreak >= 3,
  },
  {
    id: "streak_7",
    title: "Week Warrior",
    description: "7-day practice streak",
    icon: "⚡",
    condition: (stats) => stats.dayStreak >= 7,
  },
  {
    id: "streak_30",
    title: "Unstoppable",
    description: "30-day practice streak",
    icon: "🏆",
    condition: (stats) => stats.dayStreak >= 30,
  },
  {
    id: "perfectionist",
    title: "Perfectionist",
    description: "Score 95+ on a conversation",
    icon: "⭐",
    condition: (stats) => stats.bestScore >= 95,
  },
  {
    id: "xp_1000",
    title: "XP Hunter",
    description: "Earn 1000 XP",
    icon: "✨",
    condition: (stats) => stats.xpPoints >= 1000,
  },
];

// Map achievement IDs to DB AchievementType enum values
const ACHIEVEMENT_ID_TO_DB_TYPE: Record<string, string> = {
  first_chat: "first_chat",
  chatterbox: "sessions_10",
  polyglot: "polyglot",
  word_collector: "words_50",
  vocabulary_master: "words_100",
  streak_3: "streak_7",
  streak_7: "streak_7",
  streak_30: "streak_30",
  perfectionist: "score_90",
  xp_1000: "early_bird",
};

// ═══════════════════════════════════════════
// GET Handler
// ═══════════════════════════════════════════

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Please log in", 401);
    }

    const dbUser = await getOrCreateUser(user);

    // ─── Gather user stats ───

    // 1. Total conversations
    const { count: totalConversations } = await db
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("userId", dbUser.id);

    // 2. Words learned (unique vocabulary items)
    const { count: wordsLearned } = await db
      .from("vocabulary_items")
      .select("*", { count: "exact", head: true })
      .eq("userId", dbUser.id);

    // 3. Day streak (reuse the same logic as stats API)
    let dayStreak = 0;
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
        dayStreak++;
      } else if (i === 0) {
        // Today has no activity yet — skip to yesterday
        continue;
      } else {
        break;
      }
    }

    // 4. Best score from conversations
    const { data: bestScoreConvs } = await db
      .from("conversations")
      .select("overallScore")
      .eq("userId", dbUser.id)
      .not("overallScore", "is", null)
      .order("overallScore", { ascending: false })
      .limit(1);

    const bestScore =
      bestScoreConvs && bestScoreConvs.length > 0 && bestScoreConvs[0].overallScore != null
        ? Math.round(bestScoreConvs[0].overallScore)
        : 0;

    // 5. XP points from user_progress
    const { data: progress } = await db
      .from("user_progress")
      .select("xpPoints")
      .eq("userId", dbUser.id)
      .maybeSingle();

    const xpPoints = progress?.xpPoints || 0;

    const stats: UserStats = {
      conversations: totalConversations || 0,
      wordsLearned: wordsLearned || 0,
      dayStreak,
      bestScore,
      xpPoints,
    };

    // ─── Calculate achievements ───

    // Fetch already-unlocked achievements from DB
    const { data: existingAchievements } = await db
      .from("achievements")
      .select("achievementType")
      .eq("userId", dbUser.id);

    const existingTypes = new Set(
      (existingAchievements || []).map((a: { achievementType: string }) => a.achievementType)
    );

    const result = ACHIEVEMENTS.map((ach) => {
      const isUnlocked = ach.condition(stats);
      return {
        id: ach.id,
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        unlocked: isUnlocked,
      };
    });

    // ─── Persist newly unlocked achievements to DB ───
    for (const ach of ACHIEVEMENTS) {
      if (ach.condition(stats)) {
        const dbType = ACHIEVEMENT_ID_TO_DB_TYPE[ach.id];
        if (dbType && !existingTypes.has(dbType)) {
          try {
            await db.from("achievements").insert({
              id: crypto.randomUUID(),
              userId: dbUser.id,
              achievementType: dbType,
              unlockedAt: new Date().toISOString(),
            });
          } catch {
            // Ignore duplicate key errors — achievement may already exist
          }
        }
      }
    }

    return successResponse({
      achievements: result,
      stats: {
        conversations: stats.conversations,
        wordsLearned: stats.wordsLearned,
        dayStreak: stats.dayStreak,
        bestScore: stats.bestScore,
        xpPoints: stats.xpPoints,
      },
    });
  } catch (error) {
    console.error("[Achievements API] GET error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to load achievements", 500);
  }
}
