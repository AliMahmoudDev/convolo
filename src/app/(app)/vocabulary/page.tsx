/**
 * Vocabulary Book Page — Review and manage learned vocabulary
 *
 * Features:
 * - Search bar to filter words
 * - Grid of vocabulary cards with word, translation, part of speech, definition, example
 * - Empty state when no words collected yet
 * - Loading skeleton while fetching
 * - Mobile-responsive grid layout
 * - "Review" button for future SRS integration
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  RotateCcw,
  MessageSquare,
  X,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { useTargetLanguage, useNativeLanguage } from "@/stores/profile-store";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface VocabItem {
  word: string;
  translation: string;
  definition?: string;
  partOfSpeech?: string;
  exampleSentence?: string;
}

interface VocabResponse {
  items: VocabItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ═══════════════════════════════════════════
// Part-of-speech badge color map
// ═══════════════════════════════════════════

const POS_COLORS: Record<string, string> = {
  noun: "bg-[var(--accent-light)] text-[var(--accent-primary)]",
  verb: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  adjective: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  adverb: "bg-[var(--color-gold-light)] text-[var(--color-gold)]",
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
// Helper — get language info
// ═══════════════════════════════════════════

function getLangInfo(code: string) {
  return (
    SUPPORTED_LANGUAGES.find((l) => l.code === code) || {
      code,
      name: code,
      flagEmoji: "🌐",
      nativeName: code,
    }
  );
}

// ═══════════════════════════════════════════
// Skeleton Loader
// ═══════════════════════════════════════════

function VocabularySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5"
        >
          <div className="mb-3 flex items-start justify-between">
            <Skeleton className="h-7 w-28 rounded-lg" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="mb-3 h-5 w-24 rounded-lg" />
          <Skeleton className="mb-2 h-4 w-full rounded-lg" />
          <Skeleton className="mb-4 h-4 w-3/4 rounded-lg" />
          <div className="border-t border-[var(--border-default)] pt-3">
            <Skeleton className="h-4 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// Empty State
// ═══════════════════════════════════════════

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  if (hasSearch) {
    return (
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-12 text-center">
        <Search className="mx-auto mb-4 h-12 w-12 text-[var(--text-muted)]" />
        <h3
          className="mb-2 text-lg font-semibold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          No words found
        </h3>
        <p className="mx-auto max-w-md text-sm text-[var(--text-secondary)]">
          No vocabulary items match your search. Try a different keyword or clear the search.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-light)]">
        <BookOpen className="h-8 w-8 text-[var(--accent-primary)]" />
      </div>
      <h3
        className="mb-2 text-lg font-semibold text-[var(--text-primary)]"
        style={{ fontFamily: "var(--font-heading-cfg)" }}
      >
        No words yet
      </h3>
      <p className="mx-auto mb-6 max-w-md text-sm text-[var(--text-secondary)]">
        Start a conversation and words you encounter will be automatically added to your vocabulary
        book. Practice them with spaced repetition to make them stick forever.
      </p>
      <Link href="/learn">
        <Button className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Start a Conversation
        </Button>
      </Link>
    </div>
  );
}

// ═══════════════════════════════════════════
// Vocabulary Card
// ═══════════════════════════════════════════

function VocabularyCard({ item }: { item: VocabItem }) {
  return (
    <div className="group rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-all duration-200 hover:border-[var(--accent-primary)]/30 hover:shadow-[var(--shadow-md)]">
      {/* Word + Part of Speech */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3
          className="text-xl font-bold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          {item.word}
        </h3>
        {item.partOfSpeech && (
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPosBadgeClass(item.partOfSpeech)}`}
          >
            {item.partOfSpeech}
          </span>
        )}
      </div>

      {/* Translation */}
      <p className="mb-3 text-base font-medium text-[var(--accent-primary)]">{item.translation}</p>

      {/* Definition */}
      {item.definition && (
        <p className="mb-2 text-sm leading-relaxed text-[var(--text-secondary)]">{item.definition}</p>
      )}

      {/* Example Sentence */}
      {item.exampleSentence && (
        <div className="mt-3 border-t border-[var(--border-default)] pt-3">
          <p className="text-sm italic leading-relaxed text-[var(--text-muted)]">
            &ldquo;{item.exampleSentence}&rdquo;
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <Link href="/vocabulary/review">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Review
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => {
            // Text-to-speech — future feature
          }}
        >
          <Volume2 className="h-3.5 w-3.5" />
          Listen
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════

export default function VocabularyPage() {
  const targetLang = useTargetLanguage();
  const nativeLang = useNativeLanguage();

  const [items, setItems] = useState<VocabItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch vocabulary ───
  const fetchVocabulary = useCallback(async (pageNum: number, searchQuery: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: "50",
      });
      if (searchQuery) {
        params.set("search", searchQuery);
      }

      const res = await fetch(`/api/vocabulary?${params.toString()}`);
      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message || "Failed to load vocabulary");
        return;
      }

      setItems(data.data.items || []);
      setTotal(data.data.total || 0);
      setPage(data.data.page || 1);
      setTotalPages(data.data.totalPages || 0);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Initial load ───
  useEffect(() => {
    fetchVocabulary(1, "");
  }, [fetchVocabulary]);

  // ─── Search with debounce ───
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
      fetchVocabulary(1, searchInput);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, fetchVocabulary]);

  // ─── Clear search ───
  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
    fetchVocabulary(1, "");
  };

  // ─── Page change ───
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchVocabulary(newPage, search);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* ═══ Header ═══ */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-light)]">
            <BookOpen className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h1
              className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              Vocabulary Book
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {targetLang.flagEmoji} {targetLang.name} → {nativeLang.flagEmoji} {nativeLang.name}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[var(--text-secondary)]">
          Words you encounter in conversations are automatically saved here for review
        </p>
      </div>

      {/* ═══ Search Bar + Stats ═══ */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            type="text"
            placeholder="Search words, translations, definitions..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-9 h-10 rounded-xl border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {total > 0 && (
          <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
            <span>
              <strong className="text-[var(--text-primary)]">{total}</strong>{" "}
              {total === 1 ? "word" : "words"}
            </span>
            {search && (
              <Badge variant="secondary" className="text-xs">
                Filtered
              </Badge>
            )}
            <Link href="/vocabulary/review">
              <Button size="sm" className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Start Review
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* ═══ Error State ═══ */}
      {error && (
        <div className="mb-6 rounded-xl border border-[var(--state-error)]/20 bg-[var(--state-error-light)] p-4 text-sm text-[var(--state-error)]">
          {error}
        </div>
      )}

      {/* ═══ Content ═══ */}
      {isLoading ? (
        <VocabularySkeleton />
      ) : items.length === 0 ? (
        <EmptyState hasSearch={!!search} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <VocabularyCard key={`${item.word}-${item.translation}`} item={item} />
            ))}
          </div>

          {/* ═══ Pagination ═══ */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="sm"
                      className="min-w-[36px]"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
