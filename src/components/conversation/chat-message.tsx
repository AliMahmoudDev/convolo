/**
 * ChatMessage — Renders a single message bubble in the conversation.
 *
 * RTL/LTR Fix: Uses `dir="auto"` on text elements so the browser
 * automatically detects text direction (Arabic = RTL, English = LTR).
 * This prevents mixed Arabic+English text from getting jumbled.
 *
 * Features:
 * - Corrections shown inline with strikethrough + green corrected text
 * - Translation toggle (separate block with proper dir)
 * - Vocabulary pills
 * - Grammar notes (expandable)
 * - Suggestion chips for quick replies
 */

"use client";

import { useState } from "react";
import {
  Bot,
  User,
  Languages,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Lightbulb,
  MessageCircle,
} from "lucide-react";
import type { Correction, Hint, VocabularyExtraction, GrammarNote } from "@/types/conversation";
import type { ChatMessageData } from "@/hooks/use-conversation";

// ═══════════════════════════════════════════
// Helper: detect if text is primarily RTL
// ═══════════════════════════════════════════

function isRTLLanguage(code: string): boolean {
  return ["ar", "he", "fa", "ur"].includes(code);
}

/**
 * Detect if a string contains RTL characters (Arabic, Hebrew, etc.)
 * Used to set direction on individual text blocks.
 */
function hasRTLText(text: string): boolean {
  // Arabic range: U+0600-U+06FF, U+0750-U+077F, U+FB50-U+FDFF, U+FE70-U+FEFF
  const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return rtlRegex.test(text);
}

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

/** Inline hint display — blue/neutral, NOT an error */
function HintInline({ hint }: { hint: Hint }) {
  const originalRTL = hasRTLText(hint.original);
  const suggestedRTL = hasRTLText(hint.suggested);
  const explanationRTL = hasRTLText(hint.explanation);

  return (
    <div
      className="mt-1.5 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs dark:bg-blue-900/20"
      dir="auto"
    >
      <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-800/40 dark:text-blue-300">
        tip
      </span>
      <div className="min-w-0 flex-1">
        <span
          className="text-[var(--text-secondary)]"
          dir={originalRTL ? "rtl" : "ltr"}
        >
          {hint.original}
        </span>
        <span className="mx-1 text-[var(--text-muted)]">&rarr;</span>
        <span
          className="font-semibold text-blue-600 dark:text-blue-400"
          dir={suggestedRTL ? "rtl" : "ltr"}
        >
          {hint.suggested}
        </span>
        {hint.explanation && (
          <p className="mt-1 text-[var(--text-muted)]" dir={explanationRTL ? "rtl" : "ltr"}>
            {hint.explanation}
          </p>
        )}
      </div>
    </div>
  );
}

/** Inline correction display — with RTL support */
function CorrectionInline({ correction }: { correction: Correction }) {
  const originalRTL = hasRTLText(correction.original);
  const correctedRTL = hasRTLText(correction.corrected);
  const explanationRTL = hasRTLText(correction.explanation);

  return (
    <div
      className="mt-1.5 flex items-start gap-2 rounded-lg bg-[var(--chat-correction-bg)] px-3 py-2 text-xs"
      dir="auto"
    >
      <span
        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${severityColor(correction.severity)}`}
      >
        {correction.severity}
      </span>
      <div className="min-w-0 flex-1">
        <span
          className="text-[var(--chat-correction)] line-through"
          dir={originalRTL ? "rtl" : "ltr"}
        >
          {correction.original}
        </span>
        <span className="mx-1 text-[var(--text-muted)]">&rarr;</span>
        <span
          className="font-semibold text-[var(--state-success)]"
          dir={correctedRTL ? "rtl" : "ltr"}
        >
          {correction.corrected}
        </span>
        {correction.explanation && (
          <p className="mt-1 text-[var(--text-secondary)]" dir={explanationRTL ? "rtl" : "ltr"}>
            {correction.explanation}
          </p>
        )}
      </div>
    </div>
  );
}

/** Vocabulary pill display — with RTL support */
function VocabularyPill({ item }: { item: VocabularyExtraction }) {
  const wordRTL = hasRTLText(item.word);
  const translationRTL = hasRTLText(item.translation);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-light)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent-primary)]">
      <BookOpen className="h-3 w-3 shrink-0" />
      <span dir={wordRTL ? "rtl" : "ltr"}>{item.word}</span>
      <span className="text-[var(--text-muted)]">—</span>
      <span dir={translationRTL ? "rtl" : "ltr"}>{item.translation}</span>
    </span>
  );
}

/** Grammar note display — with RTL support */
function GrammarNoteCard({ note }: { note: GrammarNote }) {
  const [expanded, setExpanded] = useState(false);
  const ruleRTL = hasRTLText(note.rule);
  const explanationRTL = hasRTLText(note.explanation);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="flex w-full items-start gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-left text-xs transition-colors hover:border-[var(--accent-primary)]/30"
    >
      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
      <div className="min-w-0 flex-1">
        <span className="font-semibold text-[var(--text-primary)]" dir={ruleRTL ? "rtl" : "ltr"}>
          {note.rule}
        </span>
        {expanded ? (
          <>
            <p className="mt-1 text-[var(--text-secondary)]" dir={explanationRTL ? "rtl" : "ltr"}>
              {note.explanation}
            </p>
            {note.example && (
              <p className="mt-1 text-[var(--text-muted)] italic" dir="auto">
                {note.example}
              </p>
            )}
          </>
        ) : (
          <span className="ml-1 text-[var(--text-muted)]">Tap to expand</span>
        )}
      </div>
      <ChevronDown
        className={`h-3 w-3 shrink-0 text-[var(--text-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}
      />
    </button>
  );
}

/** Suggestion chip — clickable quick reply */
function SuggestionChip({ text, onClick }: { text: string; onClick: (text: string) => void }) {
  const textRTL = hasRTLText(text);

  return (
    <button
      onClick={() => onClick(text)}
      className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-primary)]/20 bg-[var(--accent-light)]/50 px-3 py-1.5 text-xs font-medium text-[var(--accent-primary)] transition-all hover:border-[var(--accent-primary)]/40 hover:bg-[var(--accent-light)] hover:shadow-sm active:scale-95"
      dir={textRTL ? "rtl" : "ltr"}
    >
      <MessageCircle className="h-3 w-3 shrink-0" />
      {text}
    </button>
  );
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

interface ChatMessageProps {
  message: ChatMessageData;
  /** Callback when a suggestion chip is clicked */
  onSuggestionClick?: (text: string) => void;
  /** The target language code (for direction detection) */
  targetLanguage?: string;
}

export function ChatMessage({ message, onSuggestionClick, targetLanguage }: ChatMessageProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [showGrammar, setShowGrammar] = useState(false);
  const isUser = message.role === "user";

  const corrections = (message.corrections || []) as Correction[];
  const hints = (message.hints || []) as Hint[];
  const vocabulary = (message.vocabularyItems || []) as VocabularyExtraction[];
  const grammarNotes = (message.grammarNotes || []) as GrammarNote[];
  const suggestions = message.suggestions || [];
  const hasCorrections = corrections.length > 0;
  const hasHints = hints.length > 0;
  const hasVocabulary = vocabulary.length > 0;
  const hasGrammarNotes = grammarNotes.length > 0;
  const hasTranslation = !!message.translatedContent;
  const hasSuggestions = suggestions.length > 0;

  // Determine text direction for the main reply
  // The AI reply is in the target language — use dir="auto" to let the browser decide
  const replyRTL = hasRTLText(message.content);
  const translationRTL = hasRTLText(message.translatedContent || "");

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
        {/* Main content bubble — dir="auto" for proper bidi handling */}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-sm bg-[var(--chat-user-bg)] text-[var(--chat-user-text)]"
              : "rounded-tl-sm bg-[var(--chat-ai-bg)] text-[var(--chat-ai-text)]"
          }`}
          dir="auto"
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Translation toggle (AI messages only) — separate block with its own direction */}
        {hasTranslation && !isUser && (
          <div className={`${replyRTL ? "text-right" : "text-left"}`}>
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
              dir="ltr"
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
              <div
                className="mt-1 rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)] italic"
                dir={translationRTL ? "rtl" : "ltr"}
              >
                {message.translatedContent}
              </div>
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

        {/* Hints (AI messages only) — shown AFTER corrections */}
        {hasHints && !isUser && (
          <div className="space-y-1.5">
            {hints.map((h, i) => (
              <HintInline key={i} hint={h} />
            ))}
          </div>
        )}

        {/* Grammar notes toggle (AI messages only) */}
        {hasGrammarNotes && !isUser && (
          <div className={`${replyRTL ? "text-right" : "text-left"}`}>
            <button
              onClick={() => setShowGrammar(!showGrammar)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-amber-600 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
              dir="ltr"
            >
              <Lightbulb className="h-3 w-3" />
              {showGrammar
                ? "Hide grammar"
                : `${grammarNotes.length} grammar note${grammarNotes.length > 1 ? "s" : ""}`}
              {showGrammar ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            {showGrammar && (
              <div className="mt-1 space-y-1.5">
                {grammarNotes.map((g, i) => (
                  <GrammarNoteCard key={i} note={g} />
                ))}
              </div>
            )}
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

        {/* Suggestion chips (AI messages only) */}
        {hasSuggestions && !isUser && onSuggestionClick && (
          <div className="space-y-1">
            <p
              className="text-[10px] font-medium tracking-wider text-[var(--text-muted)] uppercase"
              dir="ltr"
            >
              Try saying
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((suggestion, i) => (
                <SuggestionChip key={i} text={suggestion} onClick={onSuggestionClick} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
