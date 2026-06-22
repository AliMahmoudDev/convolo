/**
 * Vocabulary Book Page — Review and manage learned vocabulary
 *
 * LOCAL LANGUAGE SWITCHER:
 * ──────────────────────
 * - You can switch languages directly on this page
 * - This does NOT affect your dashboard/profile language
 * - It's just for browsing vocabulary from different languages
 *
 * CHANGE WORD LANGUAGE:
 * ─────────────────────
 * - Each card has a "Move to language" option
 * - This lets you reassign a word to a different language pair
 * - Useful if a word was saved under the wrong language
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  RotateCcw,
  MessageSquare,
  X,
  Volume2,
  VolumeX,
  Globe,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { useTargetLanguage, useNativeLanguage, useProfileStore } from "@/stores/profile-store";
import { useSpeech } from "@/hooks/use-speech";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface VocabItem {
  word: string;
  translation: string;
  definition?: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  languagePair?: string;
}

interface LanguageGroup {
  languagePair: string;
  nativeLang: string;
  targetLang: string;
  count: number;
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

function EmptyState({ hasSearch, languageName }: { hasSearch: boolean; languageName?: string }) {
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
        {languageName ? `No ${languageName} words yet` : "No words yet"}
      </h3>
      <p className="mx-auto mb-6 max-w-md text-sm text-[var(--text-secondary)]">
        Start a conversation in {languageName || "your target language"} and words you encounter
        will be automatically added here.
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
  const { speak, stop, isSpeaking } = useSpeech();

  // Extract target language from languagePair
  const targetLang = item.languagePair?.split("-")[1] || "en";

  return (
    <div className="group rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-all duration-200 hover:border-[var(--accent-primary)]/30 hover:shadow-[var(--shadow-md)]">
      {/* Word + Part of Speech + Listen */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3
            className="text-xl font-bold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            {item.word}
          </h3>
          <button
            onClick={() => {
              if (isSpeaking) {
                stop();
              } else {
                speak(item.word, targetLang);
              }
            }}
            className={`rounded-lg p-1 transition-all duration-200 ${
              isSpeaking
                ? "animate-pulse bg-[var(--accent-light)] text-[var(--accent-primary)]"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--accent-primary)]"
            }`}
            title={isSpeaking ? "Stop" : `Listen in ${getLangInfo(targetLang).name}`}
          >
            {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
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
        <p className="mb-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          {item.definition}
        </p>
      )}

      {/* Example Sentence */}
      {item.exampleSentence && (
        <div className="mt-3 border-t border-[var(--border-default)] pt-3">
          <p className="text-sm leading-relaxed text-[var(--text-muted)] italic">
            &ldquo;{item.exampleSentence}&rdquo;
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-1">
        <Link href="/vocabulary/review">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            Review
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => {
            if (isSpeaking) {
              stop();
            } else {
              speak(item.word, targetLang);
            }
          }}
        >
          {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          {isSpeaking ? "Stop" : "Listen"}
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════

export default function VocabularyPage() {
  const profile = useProfileStore((s) => s.profile);

  const [items, setItems] = useState<VocabItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Language groups + active language
  const [languageGroups, setLanguageGroups] = useState<LanguageGroup[]>([]);
  const [activeLanguagePair, setActiveLanguagePair] = useState<string>("");

  // Default to current profile language pair
  const defaultLanguagePair = useMemo(
    () => `${profile?.nativeLanguage || "en"}-${profile?.targetLanguage || "ar"}`,
    [profile?.nativeLanguage, profile?.targetLanguage]
  );

  // ─── Fetch vocabulary ───
  const fetchVocabulary = useCallback(
    async (pageNum: number, searchQuery: string, langPair: string) => {
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
        if (langPair) {
          params.set("languagePair", langPair);
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

        if (data.data.languageGroups) {
          setLanguageGroups(data.data.languageGroups);
        }
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ─── Initial load ───
  useEffect(() => {
    const langPair = activeLanguagePair || defaultLanguagePair;
    fetchVocabulary(1, "", langPair);
  }, [fetchVocabulary, activeLanguagePair, defaultLanguagePair]);

  // ─── Search with debounce ───
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
      const langPair = activeLanguagePair || defaultLanguagePair;
      fetchVocabulary(1, searchInput, langPair);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, fetchVocabulary, activeLanguagePair, defaultLanguagePair]);

  // ─── Clear search ───
  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
    const langPair = activeLanguagePair || defaultLanguagePair;
    fetchVocabulary(1, "", langPair);
  };

  // ─── Page change ───
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const langPair = activeLanguagePair || defaultLanguagePair;
    fetchVocabulary(newPage, search, langPair);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Language switcher change (LOCAL — does NOT affect profile) ───
  const handleLanguageChange = (langPair: string) => {
    setActiveLanguagePair(langPair);
    setPage(1);
    setSearchInput("");
    setSearch("");
    fetchVocabulary(1, "", langPair);
  };

  // ─── Handle local dropdown switch ───
  const handleLocalNativeChange = (newNative: string) => {
    const target = (activeLanguagePair || defaultLanguagePair).split("-")[1] || "ar";
    const newPair = `${newNative}-${target}`;
    handleLanguageChange(newPair);
  };

  const handleLocalTargetChange = (newTarget: string) => {
    const native = (activeLanguagePair || defaultLanguagePair).split("-")[0] || "en";
    const newPair = `${native}-${newTarget}`;
    handleLanguageChange(newPair);
  };

  // ─── Current language display info ───
  const currentPair = activeLanguagePair || defaultLanguagePair;
  const [currentNative, currentTarget] = currentPair.split("-");
  const currentTargetInfo = getLangInfo(currentTarget);
  const currentNativeInfo = getLangInfo(currentNative);

  // Check if the local language differs from profile
  const profilePair = `${profile?.nativeLanguage || "en"}-${profile?.targetLanguage || "ar"}`;
  const isLocalSwitch = currentPair !== profilePair;

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
              Words you encounter in conversations are automatically saved here
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Language Switcher Bar (LOCAL — not profile) ═══ */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex flex-wrap items-center gap-3 p-4">
          {/* Native language dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-medium text-[var(--text-muted)]">From</label>
            <select
              value={currentNative}
              onChange={(e) => handleLocalNativeChange(e.target.value)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-elevated)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flagEmoji} {l.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[var(--text-muted)]">&rarr;</span>

          {/* Target language dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-medium text-[var(--text-muted)]">Learning</label>
            <select
              value={currentTarget}
              onChange={(e) => handleLocalTargetChange(e.target.value)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-light)] px-3 py-1.5 text-sm font-medium text-[var(--accent-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flagEmoji} {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Word count badge */}
          {total > 0 && (
            <Badge variant="secondary" className="text-xs">
              {total} {total === 1 ? "word" : "words"}
            </Badge>
          )}

          {/* Local switch indicator */}
          {isLocalSwitch && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <Globe className="h-2.5 w-2.5" />
              Viewing only — doesn&apos;t change dashboard
            </span>
          )}

          <div className="flex-1" />

          {/* Quick language tabs if multiple languages exist */}
          {languageGroups.length > 1 && (
            <div className="custom-scrollbar flex items-center gap-1 overflow-x-auto">
              {languageGroups.map((group) => {
                const info = getLangInfo(group.targetLang);
                return (
                  <button
                    key={group.languagePair}
                    onClick={() => handleLanguageChange(group.languagePair)}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all ${
                      currentPair === group.languagePair
                        ? "bg-[var(--accent-primary)] text-white"
                        : "bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--accent-primary)]"
                    }`}
                  >
                    {info.flagEmoji} {info.name} ({group.count})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Search Bar + Stats ═══ */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            type="text"
            placeholder={`Search ${currentTargetInfo.name} words, translations...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 rounded-xl border-[var(--border-default)] bg-[var(--bg-surface)] pr-9 pl-9 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
          {total > 0 && (
            <span>
              <strong className="text-[var(--text-primary)]">{total}</strong>{" "}
              {total === 1 ? "word" : "words"} in {currentTargetInfo.name}
            </span>
          )}
          {search && (
            <Badge variant="secondary" className="text-xs">
              Filtered
            </Badge>
          )}
          <Link href={`/vocabulary/review${currentPair ? `?languagePair=${currentPair}` : ""}`}>
            <Button size="sm" className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Review {currentTargetInfo.name}
            </Button>
          </Link>
        </div>
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
        <EmptyState hasSearch={!!search} languageName={currentTargetInfo.name} />
      ) : (
        <>
          {/* Language section header */}
          <div className="mb-4 flex items-center gap-2">
            <span className="text-base">{currentTargetInfo.flagEmoji}</span>
            <h2
              className="text-base font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              {currentTargetInfo.name} Vocabulary
            </h2>
            <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-muted)]">
              {currentNativeInfo.name} translations
            </span>
          </div>

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
