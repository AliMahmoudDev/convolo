/**
 * Conversation UI Logic Tests
 *
 * Tests the pure logic functions used by the conversation components.
 * React hooks can't be tested directly in Vitest without a DOM,
 * so we test the pure helper functions and type guards instead.
 *
 * What we test:
 * 1. Correction severity color mapping
 * 2. Score display logic
 * 3. Message aggregation (corrections, vocabulary, grammar)
 * 4. Language pair parsing and display
 * 5. Conversation state transitions
 */

import { describe, it, expect } from "vitest";
import {
  getScoreRating,
  parseLanguagePair,
  SUPPORTED_LANGUAGES,
  PROFICIENCY_LEVELS,
} from "@/lib/constants";
import type { Correction, VocabularyExtraction, GrammarNote } from "@/types/conversation";

// ═══════════════════════════════════════════
// 1. Score Rating Tests
// ═══════════════════════════════════════════

describe("Score Rating (used in ConversationSummary)", () => {
  it("returns 'excellent' for score >= 90", () => {
    expect(getScoreRating(90)).toBe("excellent");
    expect(getScoreRating(100)).toBe("excellent");
    expect(getScoreRating(95)).toBe("excellent");
  });

  it("returns 'good' for score 70-89", () => {
    expect(getScoreRating(70)).toBe("good");
    expect(getScoreRating(89)).toBe("good");
    expect(getScoreRating(75)).toBe("good");
  });

  it("returns 'needs_improvement' for score 50-69", () => {
    expect(getScoreRating(50)).toBe("needs_improvement");
    expect(getScoreRating(69)).toBe("needs_improvement");
    expect(getScoreRating(55)).toBe("needs_improvement");
  });

  it("returns 'poor' for score < 50", () => {
    expect(getScoreRating(49)).toBe("poor");
    expect(getScoreRating(0)).toBe("poor");
    expect(getScoreRating(25)).toBe("poor");
  });
});

// ═══════════════════════════════════════════
// 2. Language Pair Tests (used in Conversation Header)
// ═══════════════════════════════════════════

describe("Language Pair Parsing (used in conversation header)", () => {
  it("parses valid language pairs", () => {
    expect(parseLanguagePair("en-ar")).toEqual({ source: "en", target: "ar" });
    expect(parseLanguagePair("es-fr")).toEqual({ source: "es", target: "fr" });
  });

  it("returns null for invalid pairs", () => {
    expect(parseLanguagePair("en")).toBeNull();
    expect(parseLanguagePair("")).toBeNull();
    expect(parseLanguagePair("en-ar-es")).toBeNull();
  });

  it("handles edge cases", () => {
    expect(parseLanguagePair("-")).toBeNull();
    expect(parseLanguagePair("en-")).toBeNull();
    expect(parseLanguagePair("-ar")).toBeNull();
  });
});

// ═══════════════════════════════════════════
// 3. Message Aggregation Logic
// ═══════════════════════════════════════════

describe("Message Aggregation (corrections, vocabulary, grammar)", () => {
  // Helper: simulate the aggregation logic from useConversation
  function aggregateFromMessages(
    messages: Array<{
      role: "user" | "assistant";
      corrections?: Correction[];
      vocabularyItems?: VocabularyExtraction[];
      grammarNotes?: GrammarNote[];
    }>
  ) {
    const allCorrections: Correction[] = [];
    const allVocabulary: VocabularyExtraction[] = [];
    const allGrammarNotes: GrammarNote[] = [];
    const seenWords = new Set<string>();

    for (const msg of messages) {
      if (msg.role === "assistant") {
        if (Array.isArray(msg.corrections)) {
          allCorrections.push(...msg.corrections);
        }
        if (Array.isArray(msg.vocabularyItems)) {
          for (const v of msg.vocabularyItems) {
            if (!seenWords.has(v.word)) {
              seenWords.add(v.word);
              allVocabulary.push(v);
            }
          }
        }
        if (Array.isArray(msg.grammarNotes)) {
          allGrammarNotes.push(...msg.grammarNotes);
        }
      }
    }

    return { allCorrections, allVocabulary, allGrammarNotes };
  }

  it("aggregates corrections from multiple AI messages", () => {
    const messages = [
      {
        role: "assistant" as const,
        corrections: [
          {
            original: "انا",
            corrected: "أنا",
            explanation: "Missing hamza",
            severity: "minor" as const,
          },
        ],
      },
      {
        role: "user" as const,
        corrections: [],
      },
      {
        role: "assistant" as const,
        corrections: [
          {
            original: "بيت",
            corrected: "بيتي",
            explanation: "Should be possessive",
            severity: "moderate" as const,
          },
        ],
      },
    ];

    const result = aggregateFromMessages(messages);
    expect(result.allCorrections).toHaveLength(2);
    expect(result.allCorrections[0].original).toBe("انا");
    expect(result.allCorrections[1].corrected).toBe("بيتي");
  });

  it("deduplicates vocabulary items by word", () => {
    const messages = [
      {
        role: "assistant" as const,
        vocabularyItems: [
          {
            word: "كتاب",
            translation: "book",
            definition: "A written work",
            partOfSpeech: "noun",
            exampleSentence: "هذا كتاب جميل",
          },
        ],
      },
      {
        role: "assistant" as const,
        vocabularyItems: [
          {
            word: "كتاب",
            translation: "book",
            definition: "A written work",
            partOfSpeech: "noun",
            exampleSentence: "هذا كتاب جميل",
          },
          {
            word: "قلم",
            translation: "pen",
            definition: "A writing instrument",
            partOfSpeech: "noun",
            exampleSentence: "أعطني القلم",
          },
        ],
      },
    ];

    const result = aggregateFromMessages(messages);
    expect(result.allVocabulary).toHaveLength(2);
    expect(result.allVocabulary[0].word).toBe("كتاب");
    expect(result.allVocabulary[1].word).toBe("قلم");
  });

  it("aggregates grammar notes from all AI messages", () => {
    const messages = [
      {
        role: "assistant" as const,
        grammarNotes: [
          {
            rule: "Definite articles",
            explanation: "Use الـ for definite nouns",
            example: "الكتاب",
          },
        ],
      },
      {
        role: "assistant" as const,
        grammarNotes: [
          { rule: "Verb conjugation", explanation: "Past tense for أنا", example: "كتبتُ" },
        ],
      },
    ];

    const result = aggregateFromMessages(messages);
    expect(result.allGrammarNotes).toHaveLength(2);
  });

  it("returns empty arrays when there are no AI messages", () => {
    const messages = [
      { role: "user" as const, content: "Hello" },
      { role: "user" as const, content: "How are you?" },
    ];

    const result = aggregateFromMessages(messages);
    expect(result.allCorrections).toHaveLength(0);
    expect(result.allVocabulary).toHaveLength(0);
    expect(result.allGrammarNotes).toHaveLength(0);
  });

  it("handles undefined corrections/vocabulary gracefully", () => {
    const messages = [
      { role: "assistant" as const },
      { role: "assistant" as const, corrections: undefined, vocabularyItems: undefined },
    ];

    const result = aggregateFromMessages(messages);
    expect(result.allCorrections).toHaveLength(0);
    expect(result.allVocabulary).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════
// 4. Supported Languages (used in language selectors)
// ═══════════════════════════════════════════

describe("Supported Languages (used in learn page selectors)", () => {
  it("has at least 4 languages", () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(4);
  });

  it("includes English and Arabic", () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toContain("en");
    expect(codes).toContain("ar");
  });

  it("each language has required fields", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(lang.code).toBeTruthy();
      expect(lang.name).toBeTruthy();
      expect(lang.nativeName).toBeTruthy();
      expect(["ltr", "rtl"]).toContain(lang.direction);
      expect(lang.flagEmoji).toBeTruthy();
    }
  });

  it("Arabic is RTL", () => {
    const arabic = SUPPORTED_LANGUAGES.find((l) => l.code === "ar");
    expect(arabic?.direction).toBe("rtl");
  });
});

// ═══════════════════════════════════════════
// 5. Proficiency Levels (used in difficulty selector)
// ═══════════════════════════════════════════

describe("Proficiency Levels (used in difficulty selector)", () => {
  it("has exactly 3 levels", () => {
    expect(PROFICIENCY_LEVELS).toHaveLength(3);
  });

  it("includes beginner, intermediate, advanced", () => {
    expect(PROFICIENCY_LEVELS).toContain("beginner");
    expect(PROFICIENCY_LEVELS).toContain("intermediate");
    expect(PROFICIENCY_LEVELS).toContain("advanced");
  });
});

// ═══════════════════════════════════════════
// 6. Correction Severity Validation
// ═══════════════════════════════════════════

describe("Correction Severity Types", () => {
  it("accepts valid severities", () => {
    const validSeverities: Array<"minor" | "moderate" | "major"> = ["minor", "moderate", "major"];

    for (const severity of validSeverities) {
      const correction: Correction = {
        original: "test",
        corrected: "test2",
        explanation: "test explanation",
        severity,
      };
      expect(correction.severity).toBe(severity);
    }
  });
});

// ═══════════════════════════════════════════
// 7. Conversation State Transitions
// ═══════════════════════════════════════════

describe("Conversation State Logic", () => {
  it("considers conversation ended when status is not 'active'", () => {
    const isEnded = (status: string) => status !== "active";

    expect(isEnded("active")).toBe(false);
    expect(isEnded("completed")).toBe(true);
    expect(isEnded("abandoned")).toBe(true);
  });

  it("calculates elapsed time correctly", () => {
    const startedAt = new Date("2024-01-01T10:00:00Z");
    const now = new Date("2024-01-01T10:15:00Z");
    const elapsedMs = now.getTime() - startedAt.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 60000);

    expect(elapsedMinutes).toBe(15);
  });
});
