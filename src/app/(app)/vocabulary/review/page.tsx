/**
 * SRS Review Page — Flashcard-style vocabulary review
 *
 * Features:
 * - Full-screen flashcard experience
 * - Card flip animation (CSS transform)
 * - 4 rating buttons: Again (red), Hard (orange), Good (green), Easy (blue)
 * - Progress bar at top
 * - Review Complete summary at end
 * - Empty state when no cards due
 * - Mobile-first, touch-friendly design
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  RotateCcw,
  MessageSquare,
  Trophy,
  Target,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTargetLanguage, useNativeLanguage } from "@/stores/profile-store";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface SrsMeta {
  key: string;
  mastery: number;
  lastReviewed: string | null;
  nextReview: string | null;
  reviewCount: number;
  correctCount: number;
}

interface ReviewItem {
  word: string;
  translation: string;
  definition?: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  itemId: string;
  srs: SrsMeta;
}

interface ReviewResult {
  itemId: string;
  quality: "again" | "hard" | "good" | "easy";
}

type ReviewPhase = "loading" | "empty" | "reviewing" | "complete";

// ═══════════════════════════════════════════
// Part-of-speech badge color map
// ═══════════════════════════════════════════

const POS_COLORS: Record<string, string> = {
  noun: "bg-[var(--accent-light)] text-[var(--accent-primary)]",
  verb: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  adjective: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  adverb: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  preposition: "bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400",
  conjunction: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400",
  pronoun: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  interjection: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  phrase: "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400",
};

function getPosBadgeClass(pos?: string): string {
  if (!pos) return "bg-[var(--bg-elevated)] text-[var(--text-muted)]";
  const normalized = pos.toLowerCase().trim();
  return POS_COLORS[normalized] || "bg-[var(--bg-elevated)] text-[var(--text-muted)]";
}

// ═══════════════════════════════════════════
// Rating button config
// ═══════════════════════════════════════════

const RATING_BUTTONS = [
  {
    quality: "again" as const,
    label: "Again",
    shortcut: "1",
    color: "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white",
    sublabel: "1 min",
  },
  {
    quality: "hard" as const,
    label: "Hard",
    shortcut: "2",
    color: "bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white",
    sublabel: "10 min",
  },
  {
    quality: "good" as const,
    label: "Good",
    shortcut: "3",
    color: "bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white",
    sublabel: "1 day",
  },
  {
    quality: "easy" as const,
    label: "Easy",
    shortcut: "4",
    color: "bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white",
    sublabel: "7 days",
  },
];

// ═══════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════

export default function VocabularyReviewPage() {
  const targetLang = useTargetLanguage();
  const nativeLang = useNativeLanguage();

  // ─── State ───
  const [phase, setPhase] = useState<ReviewPhase>("loading");
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Derived ───
  const currentItem = items[currentIndex] || null;
  const totalItems = items.length;
  const reviewedCount = results.length;
  const progressPercent = totalItems > 0 ? (reviewedCount / totalItems) * 100 : 0;

  // ─── Fetch review items ───
  const loadReviewItems = useCallback(async (resetState: boolean = true) => {
    if (resetState) {
      setPhase("loading");
      setError(null);
      setResults([]);
      setCurrentIndex(0);
      setIsFlipped(false);
    }

    try {
      const res = await fetch("/api/vocabulary/review");
      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message || "Failed to load review items");
        setPhase("empty");
        return;
      }

      const reviewItems: ReviewItem[] = data.data.items || [];

      if (reviewItems.length === 0) {
        setPhase("empty");
      } else {
        setItems(reviewItems);
        setPhase("reviewing");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setPhase("empty");
    }
  }, []);

  // ─── Initial load ───
  useEffect(() => {
    loadReviewItems(true);
  }, [loadReviewItems]);

  // ─── Handle card flip ───
  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  // ─── Handle rating ───
  const handleRate = useCallback(async (quality: "again" | "hard" | "good" | "easy") => {
    if (!currentItem || isSubmitting) return;

    setIsSubmitting(true);

    // Record result locally
    const result: ReviewResult = { itemId: currentItem.itemId, quality };
    setResults((prev) => [...prev, result]);

    // Submit to API (non-blocking, fire and forget for smooth UX)
    fetch("/api/vocabulary/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: currentItem.itemId, quality }),
    }).catch(() => {
      // Silently fail — client tracks progress
    });

    // Move to next card or complete
    if (currentIndex + 1 >= totalItems) {
      // Short delay for visual feedback
      setTimeout(() => {
        setPhase("complete");
        setIsSubmitting(false);
      }, 300);
    } else {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
        setIsSubmitting(false);
      }, 250);
    }
  }, [currentItem, isSubmitting, currentIndex, totalItems]);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    if (phase !== "reviewing") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
        return;
      }

      const qualityMap: Record<string, "again" | "hard" | "good" | "easy"> = {
        "1": "again",
        "2": "hard",
        "3": "good",
        "4": "easy",
      };

      const quality = qualityMap[e.key];
      if (quality && isFlipped && !isSubmitting) {
        handleRate(quality);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, isFlipped, isSubmitting, handleRate]);

  // ─── Calculate summary stats ───
  const correctCount = results.filter((r) => r.quality === "good" || r.quality === "easy").length;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  // ═══════════════════════════════════════════
  // Render: Loading State
  // ═══════════════════════════════════════════
  if (phase === "loading") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--border-default)] border-t-[var(--accent-primary)]" />
          <p className="text-sm text-[var(--text-secondary)]">Loading review cards...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // Render: Empty State
  // ═══════════════════════════════════════════
  if (phase === "empty") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--accent-light)]">
            <BookOpen className="h-10 w-10 text-[var(--accent-primary)]" />
          </div>
          <h1
            className="mb-3 text-2xl font-bold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            No cards to review
          </h1>
          <p className="mb-8 text-[var(--text-secondary)]">
            No cards to review right now. Start a conversation to learn new words!
          </p>

          {error && (
            <div className="mb-6 rounded-xl border border-[var(--state-error)]/20 bg-[var(--state-error-light)] p-3 text-sm text-[var(--state-error)]">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/learn">
              <Button className="w-full gap-2 sm:w-auto">
                <MessageSquare className="h-4 w-4" />
                Start a Conversation
              </Button>
            </Link>
            <Link href="/vocabulary">
              <Button variant="outline" className="w-full gap-2 sm:w-auto">
                <BookOpen className="h-4 w-4" />
                View Vocabulary
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // Render: Review Complete
  // ═══════════════════════════════════════════
  if (phase === "complete") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          {/* Trophy icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-100 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/20">
            <Trophy className="h-10 w-10 text-amber-500" />
          </div>

          <h1
            className="mb-2 text-2xl font-bold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Review Complete!
          </h1>
          <p className="mb-8 text-[var(--text-secondary)]">
            Great job reviewing your vocabulary. Keep it up!
          </p>

          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <div className="mb-1 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-[var(--accent-primary)]" />
              </div>
              <p
                className="text-2xl font-bold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                {results.length}
              </p>
              <p className="text-xs text-[var(--text-muted)]">Cards Reviewed</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <div className="mb-1 flex items-center justify-center">
                <Target className="h-5 w-5 text-emerald-500" />
              </div>
              <p
                className="text-2xl font-bold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                {accuracy}%
              </p>
              <p className="text-xs text-[var(--text-muted)]">Accuracy</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <div className="mb-1 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-sky-500" />
              </div>
              <p
                className="text-2xl font-bold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                {correctCount}
              </p>
              <p className="text-xs text-[var(--text-muted)]">Correct</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="mb-8 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
            <h3
              className="mb-3 text-sm font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              Rating Breakdown
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {(["again", "hard", "good", "easy"] as const).map((quality) => {
                const count = results.filter((r) => r.quality === quality).length;
                const config = RATING_BUTTONS.find((b) => b.quality === quality)!;
                return (
                  <div key={quality} className="text-center">
                    <div
                      className={`mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg ${quality === "again" ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" : quality === "hard" ? "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" : quality === "good" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-sky-100 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"}`}
                    >
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                    <p className="text-[10px] font-medium text-[var(--text-muted)]">{config.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={() => loadReviewItems(true)}
              className="w-full gap-2 sm:w-auto"
              variant="outline"
            >
              <RotateCcw className="h-4 w-4" />
              Review Again
            </Button>
            <Link href="/vocabulary">
              <Button className="w-full gap-2 sm:w-auto">
                <BookOpen className="h-4 w-4" />
                Back to Vocabulary
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // Render: Reviewing (Flashcard)
  // ═══════════════════════════════════════════
  return (
    <div className="flex min-h-[80vh] flex-col">
      {/* ─── Top Bar ─── */}
      <div className="sticky top-0 z-10 border-b border-[var(--border-default)] bg-[var(--bg-base)]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link
            href="/vocabulary"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {reviewedCount + 1} of {totalItems}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {targetLang.flagEmoji} {targetLang.name} → {nativeLang.flagEmoji} {nativeLang.name}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>
      </div>

      {/* ─── Card Area ─── */}
      <div className="flex flex-1 items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg">
          {/* Flip Card Container */}
          <div
            className="perspective-[1000px] cursor-pointer"
            onClick={handleFlip}
            role="button"
            tabIndex={0}
            aria-label={isFlipped ? "Hide answer" : "Show answer"}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleFlip();
              }
            }}
          >
            <div
              className={`relative w-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}
            >
              {/* ─── Front of Card ─── */}
              <div className="w-full [backface-visibility:hidden]">
                <div className="min-h-[320px] rounded-3xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 shadow-[var(--shadow-lg)] sm:min-h-[380px]">
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    {/* Part of speech badge */}
                    {currentItem?.partOfSpeech && (
                      <span
                        className={`mb-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getPosBadgeClass(currentItem.partOfSpeech)}`}
                      >
                        {currentItem.partOfSpeech}
                      </span>
                    )}

                    {/* Word */}
                    <h2
                      className="mb-2 text-4xl font-bold text-[var(--text-primary)] sm:text-5xl"
                      style={{ fontFamily: "var(--font-heading-cfg)" }}
                    >
                      {currentItem?.word}
                    </h2>

                    {/* Mastery indicator */}
                    {currentItem?.srs && (
                      <div className="mt-4 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 w-6 rounded-full transition-colors ${
                              i < currentItem.srs.mastery
                                ? "bg-[var(--accent-primary)]"
                                : "bg-[var(--border-default)]"
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Tap hint */}
                    <p className="mt-6 text-xs text-[var(--text-muted)]">
                      Tap to reveal answer
                    </p>
                  </div>
                </div>
              </div>

              {/* ─── Back of Card ─── */}
              <div className="absolute inset-0 w-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <div className="min-h-[320px] rounded-3xl border border-[var(--accent-primary)]/30 bg-[var(--bg-surface)] p-8 shadow-[var(--shadow-glow)] sm:min-h-[380px]">
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    {/* Word (smaller) + Part of speech */}
                    <div className="mb-2 flex items-center gap-2">
                      <h3
                        className="text-xl font-bold text-[var(--text-primary)]"
                        style={{ fontFamily: "var(--font-heading-cfg)" }}
                      >
                        {currentItem?.word}
                      </h3>
                      {currentItem?.partOfSpeech && (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getPosBadgeClass(currentItem.partOfSpeech)}`}
                        >
                          {currentItem.partOfSpeech}
                        </span>
                      )}
                    </div>

                    {/* Translation */}
                    <p className="mb-4 text-2xl font-semibold text-[var(--accent-primary)]">
                      {currentItem?.translation}
                    </p>

                    {/* Definition */}
                    {currentItem?.definition && (
                      <div className="mb-3 w-full rounded-xl bg-[var(--bg-elevated)] p-3">
                        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                          {currentItem.definition}
                        </p>
                      </div>
                    )}

                    {/* Example sentence */}
                    {currentItem?.exampleSentence && (
                      <div className="mt-2 w-full border-t border-[var(--border-default)] pt-3">
                        <div className="flex items-start gap-2">
                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-gold)]" />
                          <p className="text-sm italic leading-relaxed text-[var(--text-muted)]">
                            {currentItem.exampleSentence}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Rating Buttons ─── */}
          <div className="mt-6">
            {!isFlipped ? (
              /* Show flip prompt */
              <div className="text-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 rounded-2xl px-8"
                  onClick={handleFlip}
                >
                  Show Answer
                </Button>
                <p className="mt-2 text-xs text-[var(--text-muted)]">or press Space / Enter</p>
              </div>
            ) : (
              /* Rating buttons */
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {RATING_BUTTONS.map((btn) => (
                  <button
                    key={btn.quality}
                    onClick={() => handleRate(btn.quality)}
                    disabled={isSubmitting}
                    className={`flex flex-col items-center gap-0.5 rounded-2xl px-2 py-3 font-medium shadow-sm transition-all duration-150 sm:px-4 sm:py-4 ${btn.color} disabled:opacity-50`}
                  >
                    <span className="text-sm font-semibold sm:text-base">{btn.label}</span>
                    <span className="text-[10px] opacity-80">{btn.sublabel}</span>
                    <span className="mt-0.5 hidden text-[10px] opacity-60 sm:block">
                      {btn.shortcut}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
