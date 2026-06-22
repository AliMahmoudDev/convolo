/**
 * /learn/[id] — Conversation Chat Page
 *
 * This is the core experience of Convolo — the actual conversation with the AI tutor.
 *
 * Layout structure:
 * ┌──────────────────────────────────────────────────────┐
 * │ Header: Language pair | Difficulty | Timer | End Btn │
 * ├────────────────────────────────────┬─────────────────┤
 * │                                    │ Corrections     │
 * │  Chat Messages (scrollable)        │ & Vocabulary    │
 * │  + ThinkingIndicator               │ (sidebar)       │
 * │                                    │                 │
 * ├────────────────────────────────────┤                 │
 * │  ChatInput                         │                 │
 * └────────────────────────────────────┴─────────────────┘
 *
 * On mobile:
 * - Sidebar becomes a floating button that opens a Sheet
 * - Header is more compact
 * - Messages take full width
 *
 * Why this page uses the (app) layout:
 * - Sidebar nav is accessible (users can navigate away)
 * - Consistent auth protection
 * - Mobile nav bar at bottom
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Square, Clock, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConversation } from "@/hooks/use-conversation";
import { ChatMessage } from "@/components/conversation/chat-message";
import { ChatInput } from "@/components/conversation/chat-input";
import { ThinkingIndicator } from "@/components/conversation/thinking-indicator";
import {
  CorrectionsPanel,
  MobileCorrectionsPanel,
} from "@/components/conversation/corrections-panel";
import { ConversationSummary } from "@/components/conversation/conversation-summary";
import type { EndConversationResponse } from "@/types/conversation";
import { SUPPORTED_LANGUAGES, PROFICIENCY_LEVELS } from "@/lib/constants";

// ═══════════════════════════════════════════
// Helper: get language display info
// ═══════════════════════════════════════════

function getLangInfo(code: string) {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || { code, name: code, flagEmoji: "" };
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const {
    conversation,
    messages,
    isLoading,
    isSending,
    isEnding,
    isEnded,
    error,
    allCorrections,
    allVocabulary,
    allGrammarNotes,
    sendMessage,
    endConversation,
  } = useConversation(conversationId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [summary, setSummary] = useState<EndConversationResponse | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // ─── Auto-scroll to bottom on new messages ───
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // ─── Timer: update elapsed time every minute ───
  useEffect(() => {
    if (!conversation || conversation.status !== "active") return;

    const startTime = new Date(conversation.startedAt).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      const minutes = Math.floor((now - startTime) / 60000);
      setElapsed(minutes);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 60000);
    return () => clearInterval(interval);
  }, [conversation]);

  // ─── End conversation handler ───
  const handleEndConversation = async () => {
    const result = await endConversation();
    if (result) {
      setSummary(result);
      setShowSummary(true);
    }
  };

  // ─── Suggestion click handler ───
  const handleSuggestionClick = async (text: string) => {
    if (isSending || isEnded) return;
    await sendMessage(text);
  };

  // ─── Loading state ───
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[var(--accent-primary)] border-t-transparent" />
          <p className="text-sm text-[var(--text-muted)]">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // ─── Error state ───
  if (error && !conversation) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-[var(--state-error)]" />
          <p className="mb-2 text-base font-semibold text-[var(--text-primary)]">
            Failed to load conversation
          </p>
          <p className="mb-4 text-sm text-[var(--text-muted)]">{error}</p>
          <Button onClick={() => router.push("/learn")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Practice
          </Button>
        </div>
      </div>
    );
  }

  if (!conversation) return null;

  // ─── Parse language pair for display ───
  const [sourceCode, targetCode] = conversation.languagePair.split("-");
  const sourceLang = getLangInfo(sourceCode);
  const targetLang = getLangInfo(targetCode);
  const difficultyLabel = PROFICIENCY_LEVELS.includes(
    conversation.difficultyLevel as (typeof PROFICIENCY_LEVELS)[number]
  )
    ? conversation.difficultyLevel.charAt(0).toUpperCase() + conversation.difficultyLevel.slice(1)
    : conversation.difficultyLevel;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[var(--bg-base)] md:relative md:z-auto">
      {/* ═══ Header ═══ */}
      <div
        className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2.5"
        style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top, 0.625rem))" }}
      >
        <div className="flex items-center gap-3">
          {/* Back button (mobile) */}
          <button
            onClick={() => router.push("/learn")}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Language pair display */}
          <div className="flex items-center gap-2">
            <span className="text-base">{sourceLang.flagEmoji}</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {sourceLang.name}
            </span>
            <span className="text-xs text-[var(--text-muted)]">&rarr;</span>
            <span className="text-base">{targetLang.flagEmoji}</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {targetLang.name}
            </span>
          </div>

          {/* Difficulty badge */}
          <Badge
            variant="secondary"
            className="bg-[var(--accent-light)] text-[10px] text-[var(--accent-primary)]"
          >
            {difficultyLabel}
          </Badge>

          {/* Timer */}
          <div className="hidden items-center gap-1 text-xs text-[var(--text-muted)] sm:flex">
            <Clock className="h-3 w-3" />
            {elapsed}m
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Message count */}
          <div className="hidden items-center gap-1 text-xs text-[var(--text-muted)] sm:flex">
            <MessageSquare className="h-3 w-3" />
            {messages.length}
          </div>

          {/* End conversation button */}
          {!isEnded && (
            <Button
              onClick={handleEndConversation}
              disabled={isEnding}
              size="sm"
              variant="outline"
              className="h-8 rounded-lg border-[var(--state-error)]/30 text-xs text-[var(--state-error)] hover:bg-[var(--state-error-light)] hover:text-[var(--state-error)]"
            >
              <Square className="mr-1.5 h-3 w-3 fill-current" />
              End
            </Button>
          )}

          {/* Completed badge */}
          {isEnded && (
            <Badge className="bg-[var(--state-success)]/10 text-xs text-[var(--state-success)]">
              Completed
            </Badge>
          )}
        </div>
      </div>

      {/* ═══ Main area: Chat + Sidebar ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          {/* Messages */}
          <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4">
            <div className="mx-auto max-w-2xl space-y-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onSuggestionClick={handleSuggestionClick}
                  targetLanguage={conversation?.languagePair?.split("-")[1]}
                  nativeLanguage={conversation?.languagePair?.split("-")[0]}
                />
              ))}

              {/* Thinking indicator */}
              {isSending && <ThinkingIndicator />}

              {/* Error message */}
              {error && (
                <div className="mx-auto max-w-md rounded-xl bg-[var(--state-error-light)] px-4 py-3 text-center text-xs text-[var(--state-error)]">
                  {error}
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area */}
          <ChatInput isSending={isSending} isEnded={isEnded} onSend={sendMessage} />
        </div>

        {/* Desktop sidebar */}
        <CorrectionsPanel
          corrections={allCorrections}
          vocabulary={allVocabulary}
          grammarNotes={allGrammarNotes}
        />
      </div>

      {/* Mobile floating button + Sheet */}
      <MobileCorrectionsPanel
        corrections={allCorrections}
        vocabulary={allVocabulary}
        grammarNotes={allGrammarNotes}
      />

      {/* Summary dialog */}
      <ConversationSummary
        open={showSummary}
        onClose={() => setShowSummary(false)}
        summary={summary}
      />
    </div>
  );
}
