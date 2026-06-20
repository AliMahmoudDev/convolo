import { describe, it, expect } from "vitest";
import { parseAIResponse, buildSystemPrompt } from "@/lib/ai";
import { conversationStartSchema, messageSendSchema } from "@/lib/validations";

// ═══════════════════════════════════════════
// AI Response Parser Tests
// ═══════════════════════════════════════════

describe("parseAIResponse", () => {
  describe("valid JSON responses", () => {
    it("parses a complete valid JSON response", () => {
      const raw = JSON.stringify({
        reply: "مرحبا! كيف حالك اليوم؟",
        translatedReply: "Hello! How are you today?",
        corrections: [
          {
            original: "انا بخير",
            corrected: "أنا بخير",
            explanation: "Missing hamza above the alif",
            severity: "minor",
          },
        ],
        vocabularyItems: [
          {
            word: "حال",
            translation: "condition/state",
            definition: "How someone is doing",
            partOfSpeech: "noun",
            exampleSentence: "كيف حالك؟",
          },
        ],
        grammarNotes: [
          {
            rule: "Hamza on Alif",
            explanation: "When hamza appears at the beginning of a word, it sits on an alif",
            example: "أنا وليس انا",
          },
        ],
      });

      const result = parseAIResponse(raw);

      expect(result.reply).toBe("مرحبا! كيف حالك اليوم؟");
      expect(result.translatedReply).toBe("Hello! How are you today?");
      expect(result.corrections).toHaveLength(1);
      expect(result.corrections[0].original).toBe("انا بخير");
      expect(result.corrections[0].severity).toBe("minor");
      expect(result.vocabularyItems).toHaveLength(1);
      expect(result.vocabularyItems[0].word).toBe("حال");
      expect(result.grammarNotes).toHaveLength(1);
      expect(result.grammarNotes[0].rule).toBe("Hamza on Alif");
    });

    it("parses a response with no corrections or vocabulary", () => {
      const raw = JSON.stringify({
        reply: "Great job! Your sentence was perfect.",
        translatedReply: "أحسنت! جملتك كانت مثالية.",
        corrections: [],
        vocabularyItems: [],
        grammarNotes: [],
      });

      const result = parseAIResponse(raw);
      expect(result.reply).toBe("Great job! Your sentence was perfect.");
      expect(result.corrections).toHaveLength(0);
      expect(result.vocabularyItems).toHaveLength(0);
      expect(result.grammarNotes).toHaveLength(0);
    });

    it("handles response with only reply and translatedReply", () => {
      const raw = JSON.stringify({
        reply: "Hello!",
        translatedReply: "مرحبا!",
      });

      const result = parseAIResponse(raw);
      expect(result.reply).toBe("Hello!");
      expect(result.translatedReply).toBe("مرحبا!");
      expect(result.corrections).toHaveLength(0);
      expect(result.vocabularyItems).toHaveLength(0);
      expect(result.grammarNotes).toHaveLength(0);
    });
  });

  describe("JSON in markdown code fences", () => {
    it("strips ```json ... ``` wrapper", () => {
      const raw =
        "```json\n" +
        JSON.stringify({
          reply: "Hello!",
          translatedReply: "مرحبا!",
          corrections: [],
          vocabularyItems: [],
          grammarNotes: [],
        }) +
        "\n```";

      const result = parseAIResponse(raw);
      expect(result.reply).toBe("Hello!");
    });

    it("strips ``` ... ``` wrapper (without json label)", () => {
      const raw =
        "```\n" +
        JSON.stringify({
          reply: "Hello!",
          translatedReply: "مرحبا!",
          corrections: [],
          vocabularyItems: [],
          grammarNotes: [],
        }) +
        "\n```";

      const result = parseAIResponse(raw);
      expect(result.reply).toBe("Hello!");
    });
  });

  describe("malformed responses", () => {
    it("returns raw text as reply when no JSON is found", () => {
      const raw = "This is just plain text without any JSON.";
      const result = parseAIResponse(raw);
      expect(result.reply).toBe("This is just plain text without any JSON.");
      expect(result.corrections).toHaveLength(0);
    });

    it("returns empty response for empty input", () => {
      const result = parseAIResponse("");
      expect(result.reply).toBe("");
      expect(result.corrections).toHaveLength(0);
    });

    it("returns empty response for whitespace-only input", () => {
      const result = parseAIResponse("   \n\t  ");
      expect(result.reply).toBe("");
    });

    it("handles invalid JSON gracefully", () => {
      const raw = "{ this is not valid JSON }}}";
      const result = parseAIResponse(raw);
      // Should fall back to raw text
      expect(result.reply).toBeTruthy();
    });

    it("extracts JSON from text with surrounding content", () => {
      const raw =
        "Here is my response:\n" +
        JSON.stringify({
          reply: "Hello!",
          translatedReply: "مرحبا!",
          corrections: [],
          vocabularyItems: [],
          grammarNotes: [],
        }) +
        "\nHope that helps!";

      const result = parseAIResponse(raw);
      expect(result.reply).toBe("Hello!");
    });
  });

  describe("correction validation", () => {
    it("filters out corrections missing required fields", () => {
      const raw = JSON.stringify({
        reply: "Hello!",
        translatedReply: "مرحبا!",
        corrections: [
          { original: "wrong", corrected: "right", explanation: "fix", severity: "minor" },
          { original: "", corrected: "right", explanation: "fix" }, // Missing original
          { original: "wrong", corrected: "", explanation: "fix" }, // Missing corrected
        ],
        vocabularyItems: [],
        grammarNotes: [],
      });

      const result = parseAIResponse(raw);
      expect(result.corrections).toHaveLength(1);
      expect(result.corrections[0].original).toBe("wrong");
    });

    it("defaults invalid severity to 'moderate'", () => {
      const raw = JSON.stringify({
        reply: "Hello!",
        translatedReply: "مرحبا!",
        corrections: [
          { original: "wrong", corrected: "right", explanation: "fix", severity: "invalid" },
        ],
        vocabularyItems: [],
        grammarNotes: [],
      });

      const result = parseAIResponse(raw);
      expect(result.corrections[0].severity).toBe("moderate");
    });

    it("handles non-array corrections field", () => {
      const raw = JSON.stringify({
        reply: "Hello!",
        translatedReply: "مرحبا!",
        corrections: "not an array",
        vocabularyItems: [],
        grammarNotes: [],
      });

      const result = parseAIResponse(raw);
      expect(result.corrections).toHaveLength(0);
    });
  });

  describe("vocabulary item validation", () => {
    it("filters out vocabulary items missing word or translation", () => {
      const raw = JSON.stringify({
        reply: "Hello!",
        translatedReply: "مرحبا!",
        corrections: [],
        vocabularyItems: [
          {
            word: "hello",
            translation: "مرحبا",
            definition: "greeting",
            partOfSpeech: "noun",
            exampleSentence: "Hello there!",
          },
          { word: "", translation: "مرحبا" }, // Missing word
          { word: "hello", translation: "" }, // Missing translation
        ],
        grammarNotes: [],
      });

      const result = parseAIResponse(raw);
      expect(result.vocabularyItems).toHaveLength(1);
    });
  });

  describe("grammar note validation", () => {
    it("filters out grammar notes missing rule or explanation", () => {
      const raw = JSON.stringify({
        reply: "Hello!",
        translatedReply: "مرحبا!",
        corrections: [],
        vocabularyItems: [],
        grammarNotes: [
          { rule: "Past Tense", explanation: "Used for completed actions", example: "I went" },
          { rule: "", explanation: "Some explanation" }, // Missing rule
          { rule: "Some rule", explanation: "" }, // Missing explanation
        ],
      });

      const result = parseAIResponse(raw);
      expect(result.grammarNotes).toHaveLength(1);
    });
  });
});

// ═══════════════════════════════════════════
// System Prompt Builder Tests
// ═══════════════════════════════════════════

describe("buildSystemPrompt", () => {
  it("includes the target language name", () => {
    const prompt = buildSystemPrompt("en", "ar", "beginner");
    expect(prompt).toContain("English");
    expect(prompt).toContain("Arabic");
  });

  it("includes the proficiency level", () => {
    const prompt = buildSystemPrompt("en", "ar", "intermediate");
    expect(prompt).toContain("INTERMEDIATE");
  });

  it("includes difficulty-appropriate instructions", () => {
    const beginnerPrompt = buildSystemPrompt("en", "ar", "beginner");
    expect(beginnerPrompt).toContain("very simple vocabulary");

    const advancedPrompt = buildSystemPrompt("en", "ar", "advanced");
    expect(advancedPrompt).toContain("rich vocabulary");
  });

  it("includes scenario context when provided", () => {
    const prompt = buildSystemPrompt("en", "ar", "beginner", "Ordering at a restaurant");
    expect(prompt).toContain("Ordering at a restaurant");
    expect(prompt).toContain("SCENARIO");
  });

  it("does not include scenario section when not provided", () => {
    const prompt = buildSystemPrompt("en", "ar", "beginner");
    expect(prompt).not.toContain("SCENARIO");
  });

  it("includes JSON response format instructions", () => {
    const prompt = buildSystemPrompt("en", "ar", "beginner");
    expect(prompt).toContain("reply");
    expect(prompt).toContain("corrections");
    expect(prompt).toContain("vocabularyItems");
    expect(prompt).toContain("grammarNotes");
  });

  it("includes safety rules", () => {
    const prompt = buildSystemPrompt("en", "ar", "beginner");
    expect(prompt).toContain("SAFETY");
    expect(prompt).toContain("harmful");
  });
});

// ═══════════════════════════════════════════
// Conversation Validation Schema Tests
// ═══════════════════════════════════════════

describe("conversationStartSchema", () => {
  it("accepts a valid language pair", () => {
    const result = conversationStartSchema.safeParse({
      languagePair: "en-ar",
    });
    expect(result.success).toBe(true);
  });

  it("accepts with optional scenarioId and difficultyLevel", () => {
    const result = conversationStartSchema.safeParse({
      languagePair: "es-en",
      scenarioId: "550e8400-e29b-41d4-a716-446655440000",
      difficultyLevel: "advanced",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid language pair format", () => {
    const invalidPairs = ["en", "english-arabic", "EN-AR", "en_ar", "1-2", ""];
    for (const pair of invalidPairs) {
      const result = conversationStartSchema.safeParse({ languagePair: pair });
      expect(result.success, `Expected "${pair}" to be invalid`).toBe(false);
    }
  });

  it("rejects invalid scenarioId format", () => {
    const result = conversationStartSchema.safeParse({
      languagePair: "en-ar",
      scenarioId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid difficultyLevel", () => {
    const result = conversationStartSchema.safeParse({
      languagePair: "en-ar",
      difficultyLevel: "expert",
    });
    expect(result.success).toBe(false);
  });

  it("requires languagePair", () => {
    const result = conversationStartSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("messageSendSchema", () => {
  it("accepts a valid message", () => {
    const result = messageSendSchema.safeParse({ content: "Hello, how are you?" });
    expect(result.success).toBe(true);
  });

  it("accepts a single character message", () => {
    const result = messageSendSchema.safeParse({ content: "Hi" });
    expect(result.success).toBe(true);
  });

  it("rejects empty message", () => {
    const result = messageSendSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("rejects message over 2000 characters", () => {
    const result = messageSendSchema.safeParse({ content: "a".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("accepts message at exactly 2000 characters", () => {
    const result = messageSendSchema.safeParse({ content: "a".repeat(2000) });
    expect(result.success).toBe(true);
  });

  it("requires content field", () => {
    const result = messageSendSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
