/**
 * Shared TypeScript types for the Conversation system.
 *
 * These types are the single source of truth for:
 * - API route request/response shapes
 * - UI component props
 * - Test fixtures
 *
 * Rule: If a shape is used in more than one file, it lives here.
 */

import type { ProficiencyLevel } from "@/lib/constants";

// ═══════════════════════════════════════════
// AI Response Types (parsed from Gemini)
// ═══════════════════════════════════════════

/** A single grammar/vocabulary correction from the AI */
export interface Correction {
  /** The incorrect text the user wrote */
  original: string;
  /** The corrected version */
  corrected: string;
  /** Why it was wrong — explained in the user's native language */
  explanation: string;
  /** How severe: "minor" (typo) | "moderate" (grammar) | "major" (meaning change) */
  severity: "minor" | "moderate" | "major";
}

/** A vocabulary item extracted from the conversation */
export interface VocabularyExtraction {
  /** The word/phrase in the target language */
  word: string;
  /** Translation in the user's native language */
  translation: string;
  /** Definition in the target language */
  definition: string;
  /** Part of speech: noun, verb, adjective, etc. */
  partOfSpeech: string;
  /** Example sentence using the word in context */
  exampleSentence: string;
}

/** A grammar note explaining a language rule */
export interface GrammarNote {
  /** The rule or pattern being explained */
  rule: string;
  /** Explanation in the user's native language */
  explanation: string;
  /** Example showing correct usage */
  example: string;
}

/** The parsed AI response — extracted from Gemini's raw text output */
export interface ParsedAIResponse {
  /** The conversational reply text (what the AI "says") */
  reply: string;
  /** Corrections for the user's last message */
  corrections: Correction[];
  /** Vocabulary items worth learning from this exchange */
  vocabularyItems: VocabularyExtraction[];
  /** Grammar notes relevant to this exchange */
  grammarNotes: GrammarNote[];
  /** A translation of the AI reply into the user's native language */
  translatedReply: string;
}

// ═══════════════════════════════════════════
// Conversation API Types
// ═══════════════════════════════════════════

/** Request body for starting a new conversation */
export interface StartConversationRequest {
  languagePair: string;
  scenarioId?: string;
  difficultyLevel?: ProficiencyLevel;
}

/** Response data for starting a new conversation */
export interface StartConversationResponse {
  id: string;
  status: "active";
  languagePair: string;
  difficultyLevel: ProficiencyLevel;
  openingMessage: string;
}

/** Request body for sending a message */
export interface SendMessageRequest {
  content: string;
}

/** Response data for sending a message */
export interface SendMessageResponse {
  userMessage: {
    id: string;
    content: string;
    role: "user";
    createdAt: string;
  };
  aiMessage: {
    id: string;
    content: string;
    translatedContent: string;
    role: "assistant";
    corrections: Correction[];
    vocabularyItems: VocabularyExtraction[];
    grammarNotes: GrammarNote[];
    createdAt: string;
  };
}

/** Response data for ending a conversation */
export interface EndConversationResponse {
  overallScore: number;
  scoreRating: string;
  totalMessages: number;
  correctionsCount: number;
  newVocabularyCount: number;
  durationMinutes: number;
}

// ═══════════════════════════════════════════
// AI Adapter Interface
// ═══════════════════════════════════════════

/**
 * The interface that ALL AI providers must implement.
 *
 * This is the "Adapter Pattern" — we define an interface,
 * and each provider (Gemini, OpenAI, Claude) implements it.
 * The rest of the app only knows about this interface,
 * never about specific provider APIs.
 */
export interface AIProvider {
  /** The name of the provider (e.g., "gemini", "openai") */
  name: string;

  /**
   * Send a message to the AI and get a structured response.
   *
   * @param context - The conversation context (history, scenario, user level)
   * @returns ParsedAIResponse - The structured response
   */
  chat(context: AIChatContext): Promise<ParsedAIResponse>;
}

/** Context passed to the AI provider for generating a response */
export interface AIChatContext {
  /** The system prompt (defines the AI's role, language, rules) */
  systemPrompt: string;
  /** The user's target language (e.g., "en") */
  targetLanguage: string;
  /** The user's native language (e.g., "ar") */
  nativeLanguage: string;
  /** The user's proficiency level */
  proficiencyLevel: ProficiencyLevel;
  /** The conversation history (previous messages) */
  history: AIChatMessage[];
  /** The new user message to respond to */
  userMessage: string;
}

/** A single message in the conversation history sent to the AI */
export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}
