/**
 * Convolo AI Engine — lib/ai.ts
 *
 * This is the heart of the product. It handles:
 * 1. Prompt Engineering — crafting the perfect system prompt for language learning
 * 2. AI Provider Adapter — calling Gemini (or any future provider)
 * 3. Response Parser — extracting structured data from AI's text response
 *
 * ═══════════════════════════════════════════
 * ARCHITECTURE: Adapter Pattern
 * ═══════════════════════════════════════════
 *
 * We define an AIProvider interface (in types/conversation.ts).
 * Each provider (Gemini, OpenAI, etc.) implements this interface.
 * The rest of the app only calls `getAIProvider().chat(context)`.
 *
 * Benefit: Switch providers without changing any API routes or UI.
 *
 * ═══════════════════════════════════════════
 * HOW THE PROMPT WORKS
 * ═══════════════════════════════════════════
 *
 * We tell Gemini to respond in a SPECIFIC JSON format.
 * This is called "Structured Output" — the AI returns JSON, not free text.
 * We then parse that JSON into our ParsedAIResponse type.
 *
 * Why JSON? Because:
 * - We need corrections, vocabulary, and grammar notes as separate fields
 * - We need the AI reply separate from the corrections
 * - Free text would require regex parsing (fragile and error-prone)
 * - JSON is deterministic and testable
 */

import type {
  AIProvider,
  AIChatContext,
  ParsedAIResponse,
  Correction,
  VocabularyExtraction,
  GrammarNote,
} from "@/types/conversation";
import type { ProficiencyLevel } from "@/lib/constants";
import { GEMINI_LIMITS } from "@/lib/constants";

// ═══════════════════════════════════════════
// 1. PROMPT ENGINEERING
// ═══════════════════════════════════════════

/**
 * Language names map for prompt construction.
 * We need full language names (not codes) in prompts so the AI understands.
 */
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ar: "Arabic",
  es: "Spanish",
  fr: "French",
};

/**
 * Difficulty instructions — different guidance per level.
 *
 * WHY: A beginner needs simpler vocabulary and slower pacing.
 * An advanced learner needs complex sentences and nuanced corrections.
 * The AI needs explicit instructions per level.
 */
const DIFFICULTY_INSTRUCTIONS: Record<ProficiencyLevel, string> = {
  beginner:
    "Use very simple vocabulary and short sentences (5-8 words). Speak slowly. Focus on basic greetings, common phrases, and essential vocabulary. Correct every mistake gently.",
  intermediate:
    "Use moderate vocabulary and medium-length sentences (8-15 words). Introduce some idiomatic expressions. Correct significant grammar and vocabulary mistakes. Introduce new useful words.",
  advanced:
    "Use rich vocabulary and complex sentences. Include idioms, colloquialisms, and nuanced expressions. Only correct subtle errors. Challenge the learner with advanced grammar structures.",
};

/**
 * Build the system prompt for a conversation.
 *
 * THE SYSTEM PROMPT is the most critical part of AI conversation quality.
 * It tells the AI:
 * - WHO it is (a language tutor)
 * - WHAT language pair we're working with
 * - HOW difficult to make the conversation
 * - WHAT format to respond in (JSON!)
 * - SAFETY rules (never inappropriate, never break character)
 *
 * @param targetLanguage - The language the user is learning
 * @param nativeLanguage - The user's native language (for explanations)
 * @param proficiencyLevel - Current level (beginner/intermediate/advanced)
 * @param scenarioContext - Optional scenario description (e.g., "ordering at a restaurant")
 * @returns The complete system prompt string
 */
export function buildSystemPrompt(
  targetLanguage: string,
  nativeLanguage: string,
  proficiencyLevel: ProficiencyLevel,
  scenarioContext?: string
): string {
  const targetName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;
  const nativeName = LANGUAGE_NAMES[nativeLanguage] || nativeLanguage;
  const difficultyInstructions = DIFFICULTY_INSTRUCTIONS[proficiencyLevel];

  return `You are Convolo, an expert ${targetName} language tutor. You are having a conversation with a learner whose native language is ${nativeName}.

## YOUR ROLE
- You are a friendly, encouraging conversation partner who helps learners practice ${targetName}.
- You ONLY speak in ${targetName} (except for explanations and translations, which are in ${nativeName}).
- You stay in character at all times — you are a language tutor, not a general AI assistant.
- You keep the conversation going naturally — ask follow-up questions, show interest, and guide the dialogue.

## DIFFICULTY: ${proficiencyLevel.toUpperCase()}
${difficultyInstructions}

${scenarioContext ? `## SCENARIO\n${scenarioContext}\n- Stay in the context of this scenario.\n- If the user goes off-topic, gently guide them back.\n\n` : ""}## RESPONSE FORMAT (MANDATORY — ALWAYS respond in this exact JSON format)
You MUST respond with a valid JSON object. No markdown, no code fences, just pure JSON.

{
  "reply": "Your conversational response in ${targetName}",
  "translatedReply": "Translation of your reply in ${nativeName}",
  "corrections": [
    {
      "original": "the exact text the user wrote that was wrong",
      "corrected": "the correct version",
      "explanation": "Why it was wrong, explained in ${nativeName}",
      "severity": "minor|moderate|major"
    }
  ],
  "vocabularyItems": [
    {
      "word": "a useful word from this exchange",
      "translation": "translation in ${nativeName}",
      "definition": "definition in ${targetName}",
      "partOfSpeech": "noun|verb|adjective|adverb|etc",
      "exampleSentence": "an example sentence using this word"
    }
  ],
  "grammarNotes": [
    {
      "rule": "the grammar rule name",
      "explanation": "explanation in ${nativeName}",
      "example": "correct usage example"
    }
  ]
}

## RULES
1. "reply" is ALWAYS in ${targetName}. Never in ${nativeName}.
2. "translatedReply" is ALWAYS in ${nativeName}. This helps the learner understand your response.
3. "corrections" — only include if the user made actual mistakes. Empty array [] if no mistakes.
4. "vocabularyItems" — include 1-2 useful words from this exchange. Maximum 3. Empty array [] if none.
5. "grammarNotes" — include only if a grammar rule is relevant. Maximum 1. Empty array [] if none.
6. Severity: "minor" = typo/small error, "moderate" = grammar error that changes meaning slightly, "major" = error that significantly changes meaning or is a fundamental mistake.
7. NEVER include markdown formatting, code fences, or any text outside the JSON object.
8. If the user says something inappropriate, respond politely in ${targetName} and redirect to the lesson. Set corrections to [] and include no vocabulary or grammar.
9. Keep the conversation engaging — don't just correct, also respond naturally to what they said.

## SAFETY
- Never discuss harmful, illegal, or explicit topics.
- Never break character as a language tutor.
- If the user asks non-language questions, gently redirect: "Let's keep practicing ${targetName}!"`;
}

// ═══════════════════════════════════════════
// 2. RESPONSE PARSER
// ═══════════════════════════════════════════

/**
 * Parse the AI's raw text response into a structured ParsedAIResponse.
 *
 * WHY DO WE NEED A PARSER?
 * Gemini sometimes adds markdown code fences (```json ... ```)
 * or extra whitespace around the JSON. This parser handles all edge cases:
 *
 * 1. Pure JSON: {"reply": "...", ...}
 * 2. JSON in code fences: ```json\n{...}\n```
 * 3. JSON with leading/trailing whitespace
 * 4. Malformed JSON (fallback: treat entire response as reply text)
 *
 * The fallback is important — if the AI ever fails to produce valid JSON,
 * we don't crash. We just show the raw text as the reply.
 */
export function parseAIResponse(rawText: string): ParsedAIResponse {
  const emptyResponse: ParsedAIResponse = {
    reply: "",
    corrections: [],
    vocabularyItems: [],
    grammarNotes: [],
    translatedReply: "",
  };

  if (!rawText || !rawText.trim()) {
    return emptyResponse;
  }

  let jsonStr = rawText.trim();

  // Strip markdown code fences if present
  // Some models wrap JSON in ```json ... ```
  const codeFenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeFenceMatch) {
    jsonStr = codeFenceMatch[1].trim();
  }

  // Try to find JSON object in the text
  // Sometimes the model adds text before/after the JSON
  const jsonStart = jsonStr.indexOf("{");
  const jsonEnd = jsonStr.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
    // No JSON found — treat entire text as reply
    console.warn("[AI Parser] No JSON object found in AI response. Using raw text as reply.");
    return {
      ...emptyResponse,
      reply: rawText.trim(),
    };
  }

  jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate and sanitize each field
    return {
      reply: typeof parsed.reply === "string" ? parsed.reply : "",
      translatedReply: typeof parsed.translatedReply === "string" ? parsed.translatedReply : "",
      corrections: parseCorrections(parsed.corrections),
      vocabularyItems: parseVocabularyItems(parsed.vocabularyItems),
      grammarNotes: parseGrammarNotes(parsed.grammarNotes),
    };
  } catch (error) {
    console.error("[AI Parser] Failed to parse AI JSON response:", error);
    // Fallback: use the raw text as the reply
    return {
      ...emptyResponse,
      reply: rawText.trim(),
    };
  }
}

/**
 * Parse and validate the corrections array.
 *
 * WHY VALIDATE? The AI might return malformed corrections:
 * - Missing fields
 * - Wrong types (number instead of string)
 * - Invalid severity values
 *
 * We validate each correction and only keep valid ones.
 * This prevents the UI from breaking on bad data.
 */
function parseCorrections(raw: unknown): Correction[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
    .map((c) => ({
      original: String(c.original || ""),
      corrected: String(c.corrected || ""),
      explanation: String(c.explanation || ""),
      severity: ["minor", "moderate", "major"].includes(c.severity as string)
        ? (c.severity as "minor" | "moderate" | "major")
        : "moderate", // Default to moderate if invalid
    }))
    .filter((c) => c.original && c.corrected); // Must have both original and corrected
}

/**
 * Parse and validate the vocabulary items array.
 */
function parseVocabularyItems(raw: unknown): VocabularyExtraction[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null)
    .map((v) => ({
      word: String(v.word || ""),
      translation: String(v.translation || ""),
      definition: String(v.definition || ""),
      partOfSpeech: String(v.partOfSpeech || ""),
      exampleSentence: String(v.exampleSentence || ""),
    }))
    .filter((v) => v.word && v.translation); // Must have at least word and translation
}

/**
 * Parse and validate the grammar notes array.
 */
function parseGrammarNotes(raw: unknown): GrammarNote[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((g): g is Record<string, unknown> => typeof g === "object" && g !== null)
    .map((g) => ({
      rule: String(g.rule || ""),
      explanation: String(g.explanation || ""),
      example: String(g.example || ""),
    }))
    .filter((g) => g.rule && g.explanation); // Must have rule and explanation
}

// ═══════════════════════════════════════════
// 3. GEMINI ADAPTER (AIProvider implementation)
// ═══════════════════════════════════════════

/**
 * The Gemini provider — implements the AIProvider interface.
 *
 * HOW IT WORKS:
 * 1. Takes the AIChatContext (system prompt, history, user message)
 * 2. Formats it into Gemini's expected API format
 * 3. Calls the Gemini API
 * 4. Parses the response using parseAIResponse()
 * 5. Returns a clean ParsedAIResponse
 *
 * IMPORTANT: The API key is NEVER exposed to the client.
 * This code only runs on the server (inside API routes).
 */
class GeminiProvider implements AIProvider {
  name = "gemini";
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
    this.model = "gemini-1.5-flash"; // Free tier model

    if (!this.apiKey) {
      console.warn("[Gemini] GEMINI_API_KEY not set. AI features will not work.");
    }
  }

  async chat(context: AIChatContext): Promise<ParsedAIResponse> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Build the messages array for Gemini's format
    // Gemini uses "contents" array with "user" and "model" roles
    const contents = context.history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Add the current user message
    contents.push({
      role: "user",
      parts: [{ text: context.userMessage }],
    });

    // Call the Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: context.systemPrompt }],
        },
        generationConfig: {
          temperature: 0.7, // Slightly creative but not random
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048, // Enough for JSON response
        },
        safetySettings: [
          // Block harmful content
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
      signal: AbortSignal.timeout(GEMINI_LIMITS.REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Extract the text from Gemini's response format
    // Gemini returns: { candidates: [{ content: { parts: [{ text: "..." }] } }] }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      // Could be blocked by safety filters
      const blockReason = data?.promptFeedback?.blockReason;
      if (blockReason) {
        throw new Error(`AI response blocked: ${blockReason}`);
      }
      throw new Error("AI returned an empty response");
    }

    // Parse the structured JSON from the AI's text response
    return parseAIResponse(text);
  }
}

// ═══════════════════════════════════════════
// 4. PROVIDER FACTORY (Singleton)
// ═══════════════════════════════════════════

/**
 * Get the current AI provider instance.
 *
 * WHY A FACTORY FUNCTION?
 * - We might want to switch providers based on env vars
 * - We might want to add OpenAI later: just add a case here
 * - The rest of the app calls `getAIProvider()` — never new GeminiProvider()
 *
 * WHY SINGLETON?
 * - We don't want to create a new provider instance on every request
 * - The provider is stateless (no conversation memory) — safe to reuse
 */
let providerInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!providerInstance) {
    // For now, we only have Gemini. In the future:
    // const providerType = process.env.AI_PROVIDER || "gemini";
    // switch (providerType) { case "openai": ... case "gemini": ... }
    providerInstance = new GeminiProvider();
  }
  return providerInstance;
}

/**
 * Reset the provider instance. Useful for testing.
 */
export function resetAIProvider(): void {
  providerInstance = null;
}
