import { describe, it, expect } from "vitest";
import {
  FREE_TIER,
  PRO_TIER,
  GEMINI_LIMITS,
  SCORING,
  SRS_INTERVALS,
  SUPPORTED_LANGUAGES,
  hasExceededDailyLimit,
  getRemainingConversations,
  getNextReviewDate,
  getScoreRating,
  isCategoryAvailable,
  buildLanguagePair,
  parseLanguagePair,
} from "@/lib/constants";

// ═══════════════════════════════════════════
// Tier Limits Constants
// ═══════════════════════════════════════════

describe("Tier Limits", () => {
  it("free tier allows 3 conversations per day", () => {
    expect(FREE_TIER.MAX_CONVERSATIONS_PER_DAY).toBe(3);
  });

  it("free tier has limited vocabulary items", () => {
    expect(FREE_TIER.MAX_VOCABULARY_ITEMS).toBe(100);
  });

  it("free tier only has daily and social categories", () => {
    expect(FREE_TIER.SCENARIO_CATEGORIES).toEqual(["daily", "social"]);
  });

  it("pro tier has unlimited conversations", () => {
    expect(PRO_TIER.MAX_CONVERSATIONS_PER_DAY).toBe(Infinity);
  });

  it("pro tier has all scenario categories", () => {
    expect(PRO_TIER.SCENARIO_CATEGORIES).toContain("business");
    expect(PRO_TIER.SCENARIO_CATEGORIES).toContain("academic");
    expect(PRO_TIER.SCENARIO_CATEGORIES).toContain("medical");
    expect(PRO_TIER.SCENARIO_CATEGORIES).toHaveLength(6);
  });
});

// ═══════════════════════════════════════════
// Gemini Limits Constants
// ═══════════════════════════════════════════

describe("Gemini Limits", () => {
  it("free tier allows 10 RPM (Gemini 2.5 Flash)", () => {
    expect(GEMINI_LIMITS.RPM).toBe(10);
  });

  it("free tier allows 1500 RPD", () => {
    expect(GEMINI_LIMITS.RPD).toBe(1500);
  });

  it("request timeout is 30 seconds", () => {
    expect(GEMINI_LIMITS.REQUEST_TIMEOUT_MS).toBe(30_000);
  });
});

// ═══════════════════════════════════════════
// hasExceededDailyLimit
// ═══════════════════════════════════════════

describe("hasExceededDailyLimit", () => {
  describe("free tier users", () => {
    it("returns false when under limit", () => {
      expect(hasExceededDailyLimit(0, false)).toBe(false);
      expect(hasExceededDailyLimit(1, false)).toBe(false);
      expect(hasExceededDailyLimit(2, false)).toBe(false);
    });

    it("returns true when at limit", () => {
      expect(hasExceededDailyLimit(3, false)).toBe(true);
    });

    it("returns true when over limit", () => {
      expect(hasExceededDailyLimit(5, false)).toBe(true);
    });
  });

  describe("pro users", () => {
    it("never exceeds limit", () => {
      expect(hasExceededDailyLimit(0, true)).toBe(false);
      expect(hasExceededDailyLimit(100, true)).toBe(false);
      expect(hasExceededDailyLimit(10000, true)).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════
// getRemainingConversations
// ═══════════════════════════════════════════

describe("getRemainingConversations", () => {
  describe("free tier users", () => {
    it("returns 3 when no conversations today", () => {
      expect(getRemainingConversations(0, false)).toBe(3);
    });

    it("decreases correctly", () => {
      expect(getRemainingConversations(1, false)).toBe(2);
      expect(getRemainingConversations(2, false)).toBe(1);
      expect(getRemainingConversations(3, false)).toBe(0);
    });

    it("never returns negative", () => {
      expect(getRemainingConversations(10, false)).toBe(0);
    });
  });

  describe("pro users", () => {
    it("always returns Infinity", () => {
      expect(getRemainingConversations(0, true)).toBe(Infinity);
      expect(getRemainingConversations(1000, true)).toBe(Infinity);
    });
  });
});

// ═══════════════════════════════════════════
// getNextReviewDate (SRS)
// ═══════════════════════════════════════════

describe("getNextReviewDate", () => {
  it("returns a date in the future", () => {
    const result = getNextReviewDate(0);
    expect(result.getTime()).toBeGreaterThan(Date.now());
  });

  it("mastery 0 reviews in 4 hours", () => {
    const before = Date.now() + 4 * 60 * 60 * 1000 - 1000;
    const result = getNextReviewDate(0).getTime();
    const after = Date.now() + 4 * 60 * 60 * 1000 + 1000;
    expect(result).toBeGreaterThan(before);
    expect(result).toBeLessThan(after);
  });

  it("mastery 1 reviews in 24 hours", () => {
    const before = Date.now() + 24 * 60 * 60 * 1000 - 1000;
    const result = getNextReviewDate(1).getTime();
    const after = Date.now() + 24 * 60 * 60 * 1000 + 1000;
    expect(result).toBeGreaterThan(before);
    expect(result).toBeLessThan(after);
  });

  it("clamps negative mastery to 0", () => {
    const negative = getNextReviewDate(-1);
    const zero = getNextReviewDate(0);
    // Both should be approximately the same (4 hours from now)
    expect(Math.abs(negative.getTime() - zero.getTime())).toBeLessThan(100);
  });

  it("clamps mastery above max to max level", () => {
    const aboveMax = getNextReviewDate(10);
    const maxLevel = getNextReviewDate(SRS_INTERVALS.MAX_MASTERY);
    expect(Math.abs(aboveMax.getTime() - maxLevel.getTime())).toBeLessThan(100);
  });

  it("each mastery level has a longer interval than the previous", () => {
    for (let i = 1; i < SRS_INTERVALS.HOURS.length; i++) {
      expect(SRS_INTERVALS.HOURS[i]).toBeGreaterThan(SRS_INTERVALS.HOURS[i - 1]);
    }
  });
});

// ═══════════════════════════════════════════
// getScoreRating
// ═══════════════════════════════════════════

describe("getScoreRating", () => {
  it("returns 'excellent' for scores >= 90", () => {
    expect(getScoreRating(100)).toBe("excellent");
    expect(getScoreRating(90)).toBe("excellent");
    expect(getScoreRating(95)).toBe("excellent");
  });

  it("returns 'good' for scores 70-89", () => {
    expect(getScoreRating(89)).toBe("good");
    expect(getScoreRating(70)).toBe("good");
    expect(getScoreRating(80)).toBe("good");
  });

  it("returns 'needs_improvement' for scores 50-69", () => {
    expect(getScoreRating(69)).toBe("needs_improvement");
    expect(getScoreRating(50)).toBe("needs_improvement");
    expect(getScoreRating(60)).toBe("needs_improvement");
  });

  it("returns 'poor' for scores below 50", () => {
    expect(getScoreRating(49)).toBe("poor");
    expect(getScoreRating(0)).toBe("poor");
    expect(getScoreRating(25)).toBe("poor");
  });
});

// ═══════════════════════════════════════════
// isCategoryAvailable
// ═══════════════════════════════════════════

describe("isCategoryAvailable", () => {
  describe("free tier users", () => {
    it("can access daily scenarios", () => {
      expect(isCategoryAvailable("daily", false)).toBe(true);
    });

    it("can access social scenarios", () => {
      expect(isCategoryAvailable("social", false)).toBe(true);
    });

    it("cannot access business scenarios", () => {
      expect(isCategoryAvailable("business", false)).toBe(false);
    });

    it("cannot access travel scenarios", () => {
      expect(isCategoryAvailable("travel", false)).toBe(false);
    });

    it("cannot access academic scenarios", () => {
      expect(isCategoryAvailable("academic", false)).toBe(false);
    });

    it("cannot access medical scenarios", () => {
      expect(isCategoryAvailable("medical", false)).toBe(false);
    });
  });

  describe("pro users", () => {
    it("can access all categories", () => {
      expect(isCategoryAvailable("daily", true)).toBe(true);
      expect(isCategoryAvailable("social", true)).toBe(true);
      expect(isCategoryAvailable("business", true)).toBe(true);
      expect(isCategoryAvailable("travel", true)).toBe(true);
      expect(isCategoryAvailable("academic", true)).toBe(true);
      expect(isCategoryAvailable("medical", true)).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════
// Language Pair Helpers
// ═══════════════════════════════════════════

describe("buildLanguagePair", () => {
  it("builds a pair string from two codes", () => {
    expect(buildLanguagePair("en", "ar")).toBe("en-ar");
    expect(buildLanguagePair("es", "en")).toBe("es-en");
  });
});

describe("parseLanguagePair", () => {
  it("parses a valid pair string", () => {
    expect(parseLanguagePair("en-ar")).toEqual({ source: "en", target: "ar" });
    expect(parseLanguagePair("es-fr")).toEqual({ source: "es", target: "fr" });
  });

  it("returns null for invalid pair strings", () => {
    expect(parseLanguagePair("invalid")).toBeNull();
    expect(parseLanguagePair("")).toBeNull();
    expect(parseLanguagePair("en")).toBeNull();
    expect(parseLanguagePair("-ar")).toBeNull();
    expect(parseLanguagePair("en-")).toBeNull();
  });
});

// ═══════════════════════════════════════════
// Supported Languages
// ═══════════════════════════════════════════

describe("SUPPORTED_LANGUAGES", () => {
  it("includes 4 languages", () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(4);
  });

  it("includes English", () => {
    const en = SUPPORTED_LANGUAGES.find((l) => l.code === "en");
    expect(en).toBeDefined();
    expect(en?.direction).toBe("ltr");
  });

  it("includes Arabic with RTL direction", () => {
    const ar = SUPPORTED_LANGUAGES.find((l) => l.code === "ar");
    expect(ar).toBeDefined();
    expect(ar?.direction).toBe("rtl");
    expect(ar?.nativeName).toBe("العربية");
  });

  it("all languages have required fields", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(lang.code).toBeTruthy();
      expect(lang.name).toBeTruthy();
      expect(lang.nativeName).toBeTruthy();
      expect(["ltr", "rtl"]).toContain(lang.direction);
    }
  });
});
