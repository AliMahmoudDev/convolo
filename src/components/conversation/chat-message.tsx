/**
 * ChatMessage — Renders a single message bubble in the conversation.
 *
 * Design decisions:
 * - User messages: right-aligned, purple background (brand color), white text
 * - AI messages: left-aligned, elevated background, with a small bot avatar
 * - Corrections shown inline with strikethrough on the original + green corrected text
 * - Translation toggle for AI messages (shows native language translation)
 * - Vocabulary pills below AI messages
 *
 * Why separate corrections display?
 * - Users need to see their mistakes IN CONTEXT, not in a separate panel
 * - The inline strikethrough + correction is the most intuitive pattern
 * - The sidebar panel provides the FULL list for review
 */

"use client";

import { useState } from "react";
import { Bot, User, Languages, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import type { Correction, VocabularyExtraction, GrammarNote } from "@/types/conversation";
import type { ChatMessageData } from "@/hooks/use-conversation";

// ═══════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════

/** Severity badge color mapping */
function severityColor(severity: Correction["severity"]) {
  switch (severity) {
    case "minor":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "moderate":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    case "major":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  }
}

/** Inline correction display */
function CorrectionInline({ correction }: { correction: Correction }) {
  return (
    <div className="mt-1.5 flex items-start gap-2 rounded-lg bg-[var(--chat-correction-bg)] px-3 py-2 text-xs">
      <span
        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${severityColor(correction.severity)}`}
      >
        {correction.severity}
      </span>
      <div className="min-w-0 flex-1">
        <span className="text-[var(--chat-correction)] line-through">{correction.original}</span>
        <span className="mx-1 text-[var(--text-muted)]">&rarr;</span>
        <span className="font-semibold text-[var(--state-success)]">{correction.corrected}</span>
        {correction.explanation && (
          <p className="mt-1 text-[var(--text-secondary)]">{correction.explanation}</p>
        )}
      </div>
    </div>
  );
}

/** Vocabulary pill display */
function VocabularyPill({ item }: { item: VocabularyExtraction }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-light)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent-primary)]">
      <BookOpen className="h-3 w-3" />
      {item.word} — {item.translation}
    </span>
  );
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

interface ChatMessageProps {
  message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const isUser = message.role === "user";

  const corrections = (message.corrections || []) as Correction[];
  const vocabulary = (message.vocabularyItems || []) as VocabularyExtraction[];
  const hasCorrections = corrections.length > 0;
  const hasVocabulary = vocabulary.length > 0;
  const hasTranslation = !!message.translatedContent;

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-[var(--accent-primary)] text-white"
            : "bg-[var(--accent-light)] text-[var(--accent-primary)]"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[75%] space-y-1.5 ${isUser ? "items-end" : "items-start"}`}>
        {/* Main content bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-sm bg-[var(--chat-user-bg)] text-[var(--chat-user-text)]"
              : "rounded-tl-sm bg-[var(--chat-ai-bg)] text-[var(--chat-ai-text)]"
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Translation toggle (AI messages only) */}
        {hasTranslation && !isUser && (
          <div>
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
            >
              <Languages className="h-3 w-3" />
              {showTranslation ? "Hide translation" : "Show translation"}
              {showTranslation ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            {showTranslation && (
              <p className="mt-1 rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)] italic">
                {message.translatedContent}
              </p>
            )}
          </div>
        )}

        {/* Corrections (AI messages only) */}
        {hasCorrections && !isUser && (
          <div className="space-y-1.5">
            {corrections.map((c, i) => (
              <CorrectionInline key={i} correction={c} />
            ))}
          </div>
        )}

        {/* Vocabulary pills (AI messages only) */}
        {hasVocabulary && !isUser && (
          <div className="flex flex-wrap gap-1.5">
            {vocabulary.map((v, i) => (
              <VocabularyPill key={i} item={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
