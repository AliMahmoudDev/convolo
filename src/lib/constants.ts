/**
 * Convolo App Constants
 *
 * Central configuration for limits, languages, levels, and feature flags.
 * All values here are the source of truth for both client and server.
 */

// ═══════════════════════════════════════════
// Subscription Limits
// ═══════════════════════════════════════════

export const FREE_TIER = {
  /** Maximum conversations per day for free users */
  MAX_CONVERSATIONS_PER_DAY: 3,
  /** Maximum vocabulary items for free users */
  MAX_VOCABULARY_ITEMS: 100,
  /** Available scenario categories for free users */
  SCENARIO_CATEGORIES: ["daily", "social"] as const,
} as const;

export const PRO_TIER = {
  /** Unlimited conversations */
  MAX_CONVERSATIONS_PER_DAY: Infinity,
  /** Unlimited vocabulary items */
  MAX_VOCABULARY_ITEMS: Infinity,
  /** All scenario categories */
  SCENARIO_CATEGORIES: ["daily", "travel", "business", "academic", "social", "medical"] as const,
} as const;

// ═══════════════════════════════════════════
// AI / Gemini Limits
// ═══════════════════════════════════════════

export const GEMINI_LIMITS = {
  /** Requests per minute (free tier) */
  RPM: 15,
  /** Requests per day (free tier) */
  RPD: 1500,
  /** Maximum tokens per minute */
  TPM: 1_000_000,
  /** Timeout for a single AI request in milliseconds */
  REQUEST_TIMEOUT_MS: 30_000,
} as const;

// ═══════════════════════════════════════════
// Supported Languages
// ═══════════════════════════════════════════

export const SUPPORTED_LANGUAGES = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    direction: "ltr" as const,
    flagEmoji: "🇬🇧",
  },
  { code: "ar", name: "Arabic", nativeName: "العربية", direction: "rtl" as const, flagEmoji: "🇸🇦" },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    direction: "ltr" as const,
    flagEmoji: "🇪🇸",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    direction: "ltr" as const,
    flagEmoji: "🇫🇷",
  },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

// ═══════════════════════════════════════════
// Proficiency Levels
// ═══════════════════════════════════════════

export const PROFICIENCY_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type ProficiencyLevel = (typeof PROFICIENCY_LEVELS)[number];

// ═══════════════════════════════════════════
// Conversation Scoring
// ═══════════════════════════════════════════

export const SCORING = {
  /** Minimum score possible */
  MIN_SCORE: 0,
  /** Maximum score possible */
  MAX_SCORE: 100,
  /** Score threshold for "excellent" rating */
  EXCELLENT_THRESHOLD: 90,
  /** Score threshold for "good" rating */
  GOOD_THRESHOLD: 70,
  /** Score threshold for "needs improvement" rating */
  NEEDS_IMPROVEMENT_THRESHOLD: 50,
} as const;

// ═══════════════════════════════════════════
// SRS (Spaced Repetition) Intervals
// ═══════════════════════════════════════════

export const SRS_INTERVALS = {
  /** Hours until next review at each mastery level (0-5) */
  HOURS: [4, 24, 72, 168, 336, 720] as readonly number[],
  /** Maximum mastery level */
  MAX_MASTERY: 5,
} as const;

// ═══════════════════════════════════════════
// Streak Calculation
// ═══════════════════════════════════════════

export const STREAK = {
  /** Hours of grace period after midnight to still count as "consecutive" */
  GRACE_PERIOD_HOURS: 4,
} as const;

// ═══════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════

/**
 * Check if a user has exceeded their daily conversation limit.
 * This is a pure function used on both client and server.
 */
export function hasExceededDailyLimit(conversationsToday: number, isPro: boolean): boolean {
  const limit = isPro ? PRO_TIER.MAX_CONVERSATIONS_PER_DAY : FREE_TIER.MAX_CONVERSATIONS_PER_DAY;
  return conversationsToday >= limit;
}

/**
 * Get the remaining conversations for today.
 */
export function getRemainingConversations(conversationsToday: number, isPro: boolean): number {
  if (isPro) return Infinity;
  return Math.max(0, FREE_TIER.MAX_CONVERSATIONS_PER_DAY - conversationsToday);
}

/**
 * Get the next SRS review date based on current mastery level.
 */
export function getNextReviewDate(masteryLevel: number): Date {
  const clampedMastery = Math.min(Math.max(0, masteryLevel), SRS_INTERVALS.MAX_MASTERY);
  const hours = SRS_INTERVALS.HOURS[clampedMastery];
  const nextReview = new Date();
  nextReview.setHours(nextReview.getHours() + hours);
  return nextReview;
}

/**
 * Get the score rating label based on a numeric score.
 */
export function getScoreRating(score: number): "excellent" | "good" | "needs_improvement" | "poor" {
  if (score >= SCORING.EXCELLENT_THRESHOLD) return "excellent";
  if (score >= SCORING.GOOD_THRESHOLD) return "good";
  if (score >= SCORING.NEEDS_IMPROVEMENT_THRESHOLD) return "needs_improvement";
  return "poor";
}

/**
 * Check if a scenario category is available for a given subscription tier.
 */
export function isCategoryAvailable(category: string, isPro: boolean): boolean {
  const availableCategories = isPro ? PRO_TIER.SCENARIO_CATEGORIES : FREE_TIER.SCENARIO_CATEGORIES;
  return availableCategories.includes(category as never);
}

/**
 * Build a language pair string from source and target language codes.
 */
export function buildLanguagePair(source: LanguageCode, target: LanguageCode): string {
  return `${source}-${target}`;
}

/**
 * Parse a language pair string into source and target codes.
 */
export function parseLanguagePair(pair: string): { source: string; target: string } | null {
  const parts = pair.split("-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { source: parts[0], target: parts[1] };
}
