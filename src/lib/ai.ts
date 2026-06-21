/**
 * Convolo AI Engine — lib/ai.ts
 *
 * Multi-Provider AI System with Auto-Fallback
 * Supports: Groq → xAI (Grok) → OpenAI → Gemini
 *
 * If one provider fails (geo-block, quota, etc.), it tries the next.
 * The rest of the app only calls `sendMessage()` — never directly calls a provider.
 *
 * KEY: All providers are forced to return JSON via:
 * - `response_format: { type: "json_object" }` for OpenAI-compatible providers
 * - System prompt instruction for Gemini
 * - Fallback parsing with parseAIResponse()
 */

import type { AppUser } from "@/lib/user-provisioning";
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

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ar: "Arabic",
  es: "Spanish",
  fr: "French",
  de: "German",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  pt: "Portuguese",
  it: "Italian",
  ru: "Russian",
  hi: "Hindi",
  tr: "Turkish",
};

const DIFFICULTY_INSTRUCTIONS: Record<ProficiencyLevel, string> = {
  beginner:
    "Use very simple vocabulary and short sentences (5-8 words). Speak slowly. Focus on basic greetings, common phrases, and essential vocabulary. Correct EVERY mistake — even small ones. Always provide 2-3 suggestions for what to say next.",
  intermediate:
    "Use moderate vocabulary and medium-length sentences (8-15 words). Introduce some idiomatic expressions. Correct significant grammar and vocabulary mistakes. Provide 1-2 suggestions occasionally.",
  advanced:
    "Use rich vocabulary and complex sentences. Include idioms, colloquialisms, and nuanced expressions. Only correct subtle errors. Challenge the learner with advanced grammar structures. Fewer suggestions needed.",
};

/**
 * Build the system prompt for a conversation.
 * (Backwards compatible with existing code)
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
  ],
  "suggestions": ["suggested reply 1 in ${targetName}", "suggested reply 2 in ${targetName}"]
}

## RULES
1. "reply" is ALWAYS in ${targetName}. Never in ${nativeName}.
2. "translatedReply" is ALWAYS in ${nativeName}. This helps the learner understand your response.
3. "corrections" — ALWAYS check the user's message for mistakes. If they made ANY error, include it here. If the user's message is PERFECT with NO mistakes, return an EMPTY array []. Do NOT add a correction like "No correction needed" or "No errors" — just return []. Only include REAL corrections where the original text was actually wrong and needed fixing.
4. "vocabularyItems" — include 1-3 useful words from this exchange. Maximum 3. Empty array [] if none.
5. "grammarNotes" — include only if a grammar rule is relevant. Maximum 1. Empty array [] if none.
6. "suggestions" — provide 2-3 short suggested replies in ${targetName} the student could use next. This helps beginners who don't know what to say.
7. Severity: "minor" = typo/small error, "moderate" = grammar error that changes meaning slightly, "major" = error that significantly changes meaning or is a fundamental mistake.
8. NEVER include markdown formatting, code fences, or any text outside the JSON object.
9. If the user says something inappropriate, respond politely in ${targetName} and redirect to the lesson. Set corrections to [] and include no vocabulary or grammar.
10. Keep the conversation engaging — don't just correct, also respond naturally to what they said.
11. CRITICAL: The user is LEARNING. Even small mistakes like wrong gender agreement, missing accents, wrong verb conjugation, wrong word order — ALL of these should be corrected, especially for beginners.

## SAFETY
- Never discuss harmful, illegal, or explicit topics.
- Never break character as a language tutor.
- If the user asks non-language questions, gently redirect: "Let's keep practicing ${targetName}!"`;
}

/**
 * Build a system prompt that instructs the AI to return structured JSON.
 * Alias for buildSystemPrompt — used by the multi-provider system.
 */
export function buildLanguageTutorSystemPrompt(user: {
  name?: string;
  nativeLanguage?: string;
  targetLanguage?: string | null;
  proficiencyLevel?: string;
}): string {
  const targetLang = user.targetLanguage || "Spanish";
  const nativeLang = user.nativeLanguage || "English";
  const level = (user.proficiencyLevel || "beginner") as ProficiencyLevel;
  const userName = user.name || "Student";

  return (
    buildSystemPrompt(targetLang, nativeLang, level) +
    `\n\nThe student's name is ${userName}. Address them by name occasionally.`
  );
}

// ═══════════════════════════════════════════
// 2. RESPONSE PARSER
// ═══════════════════════════════════════════

export function parseAIResponse(rawText: string): ParsedAIResponse {
  const emptyResponse: ParsedAIResponse = {
    reply: "",
    corrections: [],
    vocabularyItems: [],
    grammarNotes: [],
    suggestions: [],
    translatedReply: "",
  };

  if (!rawText || !rawText.trim()) {
    return emptyResponse;
  }

  let jsonStr = rawText.trim();

  // Strip markdown code fences if present
  const codeFenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeFenceMatch) {
    jsonStr = codeFenceMatch[1].trim();
  }

  // Try to find JSON object in the text
  const jsonStart = jsonStr.indexOf("{");
  const jsonEnd = jsonStr.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
    console.warn("[AI Parser] No JSON object found in AI response. Using raw text as reply.");
    return {
      ...emptyResponse,
      reply: rawText.trim(),
    };
  }

  jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      reply: typeof parsed.reply === "string" ? parsed.reply : "",
      translatedReply: typeof parsed.translatedReply === "string" ? parsed.translatedReply : "",
      corrections: parseCorrections(parsed.corrections),
      vocabularyItems: parseVocabularyItems(parsed.vocabularyItems),
      grammarNotes: parseGrammarNotes(parsed.grammarNotes),
      suggestions: parseSuggestions(parsed.suggestions),
    };
  } catch (error) {
    console.error("[AI Parser] Failed to parse AI JSON response:", error);
    return {
      ...emptyResponse,
      reply: rawText.trim(),
    };
  }
}

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
        : "moderate",
    }))
    .filter((c) => {
      // Must have both original and corrected text
      if (!c.original || !c.corrected) return false;
      // Filter out fake corrections where original === corrected (no actual change)
      if (c.original.trim().toLowerCase() === c.corrected.trim().toLowerCase()) return false;
      // Filter out placeholder corrections like "No correction needed", "No errors", etc.
      const noCorrectionPhrases = [
        "no correction needed",
        "no corrections needed",
        "no errors",
        "no error",
        "no mistakes",
        "correct",
        "perfect",
        "no change needed",
        "n/a",
        "none",
      ];
      const originalLower = c.original.trim().toLowerCase();
      const correctedLower = c.corrected.trim().toLowerCase();
      if (noCorrectionPhrases.some((phrase) => originalLower === phrase || correctedLower === phrase)) return false;
      return true;
    });
}

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
    .filter((v) => v.word && v.translation);
}

function parseGrammarNotes(raw: unknown): GrammarNote[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((g): g is Record<string, unknown> => typeof g === "object" && g !== null)
    .map((g) => ({
      rule: String(g.rule || ""),
      explanation: String(g.explanation || ""),
      example: String(g.example || ""),
    }))
    .filter((g) => g.rule && g.explanation);
}

function parseSuggestions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, 5); // Max 5 suggestions
}

// ═══════════════════════════════════════════
// 3. MULTI-PROVIDER SYSTEM
// ═══════════════════════════════════════════

interface SimpleAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface SimpleAIResponse {
  content: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

interface ProviderConfig {
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
}

function getProviderConfigs(): ProviderConfig[] {
  const configs: ProviderConfig[] = [];

  // 1. Groq — Ultra-fast, free, OpenAI-compatible
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    configs.push({
      name: "groq",
      apiKey: groqKey,
      baseUrl: "https://api.groq.com/openai/v1",
      model: "llama-3.3-70b-versatile",
      maxTokens: 2048,
    });
  }

  // 2. xAI (Grok) — OpenAI-compatible
  const xaiKey = process.env.XAI_API_KEY;
  if (xaiKey) {
    configs.push({
      name: "xai",
      apiKey: xaiKey,
      baseUrl: "https://api.x.ai/v1",
      model: "grok-3-mini-fast",
      maxTokens: 2048,
    });
  }

  // 3. OpenAI — May be geo-blocked from some regions but works from Vercel
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    configs.push({
      name: "openai",
      apiKey: openaiKey,
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o-mini",
      maxTokens: 2048,
    });
  }

  // 4. Gemini — Native API (last resort)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    configs.push({
      name: "gemini",
      apiKey: geminiKey,
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      model: "gemini-2.0-flash",
      maxTokens: 2048,
    });
  }

  return configs;
}

// OpenAI-compatible provider call (Groq, xAI, OpenAI)
// KEY: Uses response_format: { type: "json_object" } to force JSON output
async function callOpenAICompatible(
  config: ProviderConfig,
  messages: SimpleAIMessage[]
): Promise<SimpleAIResponse> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.maxTokens,
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`${config.name} API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  if (!choice?.message?.content) {
    throw new Error(`${config.name} returned empty response`);
  }

  return {
    content: choice.message.content,
    provider: config.name,
    model: config.model,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

// Gemini native API call
async function callGemini(
  config: ProviderConfig,
  messages: SimpleAIMessage[]
): Promise<SimpleAIResponse> {
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const systemMessage = messages.find((m) => m.role === "system");

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: config.maxTokens,
      temperature: 0.7,
      responseMimeType: "application/json",
    },
  };

  if (systemMessage) {
    body.systemInstruction = {
      parts: [{ text: systemMessage.content }],
    };
  }

  const response = await fetch(
    `${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(GEMINI_LIMITS.REQUEST_TIMEOUT_MS),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    const blockReason = data?.promptFeedback?.blockReason;
    if (blockReason) {
      throw new Error(`AI response blocked: ${blockReason}`);
    }
    throw new Error("Gemini returned empty response");
  }

  return {
    content,
    provider: config.name,
    model: config.model,
    usage: data.usageMetadata
      ? {
          promptTokens: data.usageMetadata.promptTokenCount,
          completionTokens: data.usageMetadata.candidatesTokenCount,
          totalTokens: data.usageMetadata.totalTokenCount,
        }
      : undefined,
  };
}

// ═══════════════════════════════════════════
// 4. MAIN: SEND MESSAGE WITH AUTO-FALLBACK
// ═══════════════════════════════════════════

/**
 * Send a message to the AI with automatic provider fallback.
 * Tries providers in order: Groq → xAI → OpenAI → Gemini
 * If one fails, it tries the next.
 *
 * This is the main entry point — returns raw content (may be JSON).
 */
export async function sendMessage(
  messages: SimpleAIMessage[],
  user?: Partial<AppUser> | null
): Promise<SimpleAIResponse> {
  // Build system prompt if not already present
  const hasSystemPrompt = messages.some((m) => m.role === "system");
  const allMessages = hasSystemPrompt
    ? messages
    : [
        {
          role: "system" as const,
          content: buildLanguageTutorSystemPrompt({
            name: user?.name,
            nativeLanguage: user?.nativeLanguage,
            targetLanguage: user?.targetLanguage,
            proficiencyLevel: user?.proficiencyLevel,
          }),
        },
        ...messages,
      ];

  const configs = getProviderConfigs();

  if (configs.length === 0) {
    throw new Error(
      "No AI providers configured. Please set at least one API key (GROQ_API_KEY, XAI_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY)."
    );
  }

  const errors: string[] = [];

  for (const config of configs) {
    try {
      console.log(`[AI] Trying ${config.name} (${config.model})...`);

      const result =
        config.name === "gemini"
          ? await callGemini(config, allMessages)
          : await callOpenAICompatible(config, allMessages);

      console.log(`[AI] ✅ ${config.name} succeeded (${result.usage?.totalTokens ?? "?"} tokens)`);
      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[AI] ❌ ${config.name} failed: ${errMsg}`);
      errors.push(`${config.name}: ${errMsg}`);
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join("\n")}`);
}

/**
 * Check which providers are available (have API keys configured).
 */
export function getAvailableProviders(): string[] {
  return getProviderConfigs().map((c) => c.name);
}

// ═══════════════════════════════════════════
// 5. BACKWARDS COMPATIBLE: AIProvider INTERFACE
// ═══════════════════════════════════════════

/**
 * The GeminiProvider class — implements the AIProvider interface
 * for backwards compatibility with existing code that uses getAIProvider().chat()
 */
class GeminiProvider implements AIProvider {
  name = "gemini";
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
    this.model = "gemini-2.0-flash";

    if (!this.apiKey) {
      console.warn("[Gemini] GEMINI_API_KEY not set. AI features will not work.");
    }
  }

  async chat(context: AIChatContext): Promise<ParsedAIResponse> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const contents = context.history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    contents.push({
      role: "user",
      parts: [{ text: context.userMessage }],
    });

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
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
        safetySettings: [
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
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      const blockReason = data?.promptFeedback?.blockReason;
      if (blockReason) {
        throw new Error(`AI response blocked: ${blockReason}`);
      }
      throw new Error("AI returned an empty response");
    }

    return parseAIResponse(text);
  }
}

// Multi-provider adapter that uses sendMessage() with fallback
class FallbackProvider implements AIProvider {
  name = "multi-provider";

  async chat(context: AIChatContext): Promise<ParsedAIResponse> {
    const messages: SimpleAIMessage[] = [
      { role: "system", content: context.systemPrompt },
      ...context.history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: context.userMessage },
    ];

    const result = await sendMessage(messages, {
      nativeLanguage: context.nativeLanguage,
      targetLanguage: context.targetLanguage,
      proficiencyLevel: context.proficiencyLevel,
    });

    // Try to parse as structured JSON, fallback to plain text
    return parseAIResponse(result.content);
  }
}

// Provider factory (backwards compatible)
let providerInstance: AIProvider | null = null;

/**
 * Get the current AI provider instance.
 * Now uses multi-provider with fallback instead of Gemini-only.
 */
export function getAIProvider(): AIProvider {
  if (!providerInstance) {
    // Use the multi-provider fallback system
    providerInstance = new FallbackProvider();
  }
  return providerInstance;
}

/**
 * Reset the provider instance. Useful for testing.
 */
export function resetAIProvider(): void {
  providerInstance = null;
}
