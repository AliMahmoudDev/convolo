/**
 * useConversation — React hook that manages a single conversation's state.
 *
 * What it does:
 * 1. Fetches conversation data from the API on mount
 * 2. Manages the messages array (local state synced with server)
 * 3. Provides sendMessage() — optimistic user message + AI response
 * 4. Provides endConversation() — ends the session and returns summary
 * 5. Tracks loading states (initial load, sending message, ending)
 * 6. Tracks all corrections and vocabulary across messages for the sidebar
 *
 * Why a hook?
 * - Separates business logic from UI (page component stays clean)
 * - Reusable if we need conversation UI elsewhere
 * - Easy to test the logic independently
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  Correction,
  VocabularyExtraction,
  GrammarNote,
  EndConversationResponse,
} from "@/types/conversation";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

/** A single message in the chat — unified shape for user + AI messages */
export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Translation of AI reply into user's native language */
  translatedContent?: string | null;
  /** Corrections for the user's previous message (AI messages only) */
  corrections?: Correction[];
  /** Vocabulary items extracted from this exchange (AI messages only) */
  vocabularyItems?: VocabularyExtraction[];
  /** Grammar notes for this exchange (AI messages only) */
  grammarNotes?: GrammarNote[];
  createdAt: string;
}

/** Conversation metadata returned from the API */
export interface ConversationData {
  id: string;
  languagePair: string;
  difficultyLevel: string;
  status: "active" | "completed" | "abandoned";
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  messageCount: number;
  overallScore: number | null;
  scenario: { title: string; description: string } | null;
  totalCorrections: number;
  totalVocabulary: number;
}

/** The shape of the hook's return value */
export interface UseConversationReturn {
  /** Conversation metadata (null while loading) */
  conversation: ConversationData | null;
  /** All messages in the conversation, ordered by time */
  messages: ChatMessageData[];
  /** Whether we're fetching the initial conversation data */
  isLoading: boolean;
  /** Whether we're waiting for the AI to respond */
  isSending: boolean;
  /** Whether we're ending the conversation */
  isEnding: boolean;
  /** Whether the conversation has ended */
  isEnded: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** All corrections across all messages (for sidebar) */
  allCorrections: Correction[];
  /** All vocabulary items across all messages (for sidebar) */
  allVocabulary: VocabularyExtraction[];
  /** All grammar notes across all messages (for sidebar) */
  allGrammarNotes: GrammarNote[];
  /** Send a message and get the AI response */
  sendMessage: (content: string) => Promise<void>;
  /** End the conversation and get the summary */
  endConversation: () => Promise<EndConversationResponse | null>;
}

// ═══════════════════════════════════════════
// Hook Implementation
// ═══════════════════════════════════════════

export function useConversation(conversationId: string): UseConversationReturn {
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if the initial fetch already happened
  const hasFetched = useRef(false);

  // ─── Fetch conversation data on mount ───
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchConversation() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`/api/conversations/${conversationId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || "Failed to load conversation");
        }

        const { messages: apiMessages, ...convData } = data.data;
        setConversation(convData);
        setMessages(apiMessages);

        // If conversation already ended, mark it
        if (convData.status !== "active") {
          // Conversation already ended — that's fine, just show it
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchConversation();
  }, [conversationId]);

  // ─── Derived state: aggregate corrections/vocabulary from all messages ───
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

  // ─── Send a message ───
  const sendMessage = useCallback(
    async (content: string) => {
      if (isSending || !conversation || conversation.status !== "active") return;

      setIsSending(true);
      setError(null);

      // Optimistic: add user message immediately for instant feedback
      const optimisticUserMsg: ChatMessageData = {
        id: `temp-${Date.now()}`,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUserMsg]);

      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || "Failed to send message");
        }

        // Replace optimistic user message with server version + add AI message
        const { userMessage, aiMessage } = data.data;
        setMessages((prev) => [
          // Remove the optimistic message
          ...prev.filter((m) => m.id !== optimisticUserMsg.id),
          // Add the real user message from the server
          {
            id: userMessage.id,
            role: "user",
            content: userMessage.content,
            createdAt: userMessage.createdAt,
          },
          // Add the AI message
          {
            id: aiMessage.id,
            role: "assistant",
            content: aiMessage.content,
            translatedContent: aiMessage.translatedContent,
            corrections: aiMessage.corrections || [],
            vocabularyItems: aiMessage.vocabularyItems || [],
            grammarNotes: aiMessage.grammarNotes || [],
            createdAt: aiMessage.createdAt,
          },
        ]);
      } catch (err) {
        // On error, remove the optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id));
        setError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, isSending, conversation]
  );

  // ─── End conversation ───
  const endConversation = useCallback(async (): Promise<EndConversationResponse | null> => {
    if (isEnding || !conversation || conversation.status !== "active") return null;

    setIsEnding(true);
    setError(null);

    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to end conversation");
      }

      // Update local conversation state
      setConversation((prev) => (prev ? { ...prev, status: "completed" as const } : null));

      return data.data as EndConversationResponse;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end conversation");
      return null;
    } finally {
      setIsEnding(false);
    }
  }, [conversationId, isEnding, conversation]);

  return {
    conversation,
    messages,
    isLoading,
    isSending,
    isEnding,
    isEnded: conversation?.status !== "active",
    error,
    allCorrections,
    allVocabulary,
    allGrammarNotes,
    sendMessage,
    endConversation,
  };
}
