/**
 * CorrectionsPanel — Sidebar showing all corrections, vocabulary, and grammar notes.
 *
 * Design decisions:
 * - Three tabs: Corrections, Vocabulary, Grammar
 * - Each tab shows items from ALL messages in the conversation (aggregated)
 * - On desktop: fixed sidebar on the right
 * - On mobile: accessible via a floating button that opens a Sheet (bottom drawer)
 * - Empty states for each tab when no items exist
 * - Severity color coding for corrections
 * - Vocabulary items show word + translation + part of speech
 */

"use client";

import { useState } from "react";
import { AlertCircle, BookOpen, ScrollText, X, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import type { Correction, VocabularyExtraction, GrammarNote } from "@/types/conversation";

// ═══════════════════════════════════════════
// Tab content components
// ═══════════════════════════════════════════

function CorrectionsList({ corrections }: { corrections: Correction[] }) {
  if (corrections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="mb-2 h-8 w-8 text-[var(--text-muted)]" />
        <p className="text-sm text-[var(--text-muted)]">No corrections yet</p>
        <p className="text-xs text-[var(--text-muted)]">
          Keep practicing — the AI will correct your mistakes here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {corrections.map((c, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] p-3"
        >
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                c.severity === "minor"
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : c.severity === "moderate"
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {c.severity}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-[var(--chat-correction)] line-through">{c.original}</span>
            <ChevronRight className="h-3 w-3 text-[var(--text-muted)]" />
            <span className="font-semibold text-[var(--state-success)]">{c.corrected}</span>
          </div>
          {c.explanation && (
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              {c.explanation}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function VocabularyList({ vocabulary }: { vocabulary: VocabularyExtraction[] }) {
  if (vocabulary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <BookOpen className="mb-2 h-8 w-8 text-[var(--text-muted)]" />
        <p className="text-sm text-[var(--text-muted)]">No vocabulary yet</p>
        <p className="text-xs text-[var(--text-muted)]">New words you encounter will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vocabulary.map((v, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] p-3"
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--accent-primary)]">{v.word}</span>
            {v.partOfSpeech && (
              <span className="rounded-full bg-[var(--accent-light)] px-2 py-0.5 text-[10px] text-[var(--accent-primary)]">
                {v.partOfSpeech}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{v.translation}</p>
          {v.definition && (
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{v.definition}</p>
          )}
          {v.exampleSentence && (
            <p className="mt-1.5 text-xs text-[var(--text-muted)] italic">
              &ldquo;{v.exampleSentence}&rdquo;
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function GrammarList({ notes }: { notes: GrammarNote[] }) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ScrollText className="mb-2 h-8 w-8 text-[var(--text-muted)]" />
        <p className="text-sm text-[var(--text-muted)]">No grammar notes yet</p>
        <p className="text-xs text-[var(--text-muted)]">Grammar explanations will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((g, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] p-3"
        >
          <p className="mb-1 text-sm font-semibold text-[var(--accent-primary)]">{g.rule}</p>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{g.explanation}</p>
          {g.example && (
            <p className="mt-1.5 text-xs text-[var(--text-muted)] italic">
              &ldquo;{g.example}&rdquo;
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// Tab type
// ═══════════════════════════════════════════

type Tab = "corrections" | "vocabulary" | "grammar";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "corrections", label: "Corrections", icon: AlertCircle },
  { id: "vocabulary", label: "Vocabulary", icon: BookOpen },
  { id: "grammar", label: "Grammar", icon: ScrollText },
];

// ═══════════════════════════════════════════
// Panel content (shared between desktop and mobile)
// ═══════════════════════════════════════════

interface PanelContentProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  corrections: Correction[];
  vocabulary: VocabularyExtraction[];
  grammarNotes: GrammarNote[];
  showClose?: boolean;
  onClose?: () => void;
}

function PanelContent({
  activeTab,
  setActiveTab,
  corrections,
  vocabulary,
  grammarNotes,
  showClose,
  onClose,
}: PanelContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
        <h3
          className="text-sm font-semibold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Session Review
        </h3>
        {showClose && onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-default)]">
        {tabs.map((tab) => {
          const count =
            tab.id === "corrections"
              ? corrections.length
              : tab.id === "vocabulary"
                ? vocabulary.length
                : grammarNotes.length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-[var(--accent-primary)] text-[var(--accent-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    activeTab === tab.id
                      ? "bg-[var(--accent-light)] text-[var(--accent-primary)]"
                      : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
        {activeTab === "corrections" && <CorrectionsList corrections={corrections} />}
        {activeTab === "vocabulary" && <VocabularyList vocabulary={vocabulary} />}
        {activeTab === "grammar" && <GrammarList notes={grammarNotes} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Desktop Panel
// ═══════════════════════════════════════════

interface CorrectionsPanelProps {
  corrections: Correction[];
  vocabulary: VocabularyExtraction[];
  grammarNotes: GrammarNote[];
}

export function CorrectionsPanel({ corrections, vocabulary, grammarNotes }: CorrectionsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("corrections");

  return (
    <div className="hidden h-full w-80 shrink-0 border-l border-[var(--border-default)] bg-[var(--bg-surface)] lg:block">
      <PanelContent
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        corrections={corrections}
        vocabulary={vocabulary}
        grammarNotes={grammarNotes}
      />
    </div>
  );
}

// ═══════════════════════════════════════════
// Mobile Panel (Sheet / Bottom drawer)
// ═══════════════════════════════════════════

export function MobileCorrectionsPanel({
  corrections,
  vocabulary,
  grammarNotes,
}: CorrectionsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("corrections");
  const [open, setOpen] = useState(false);

  const totalItems = corrections.length + vocabulary.length + grammarNotes.length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="fixed right-4 bottom-24 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-primary)] text-white shadow-[var(--shadow-lg)] transition-transform hover:scale-105 lg:hidden"
          aria-label="Open corrections panel"
        >
          <BookOpen className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--state-error)] text-[10px] font-bold text-white">
              {totalItems > 9 ? "9+" : totalItems}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl p-0">
        <SheetTitle className="sr-only">Session Review</SheetTitle>
        <PanelContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          corrections={corrections}
          vocabulary={vocabulary}
          grammarNotes={grammarNotes}
          showClose
          onClose={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
