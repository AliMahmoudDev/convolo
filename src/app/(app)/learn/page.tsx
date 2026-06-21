/**
 * /learn — Practice Page (Scenario Selection + Start Conversation)
 *
 * LANGUAGE SWITCHING PATTERN (Duolingo-style):
 * ────────────────────────────────────────────
 * - This page is DISPLAY-ONLY for language settings
 * - To change languages → go to Dashboard (Language Card)
 * - To change level → go to Dashboard (Language Card)
 * - The language bar here just shows the current pair + a "Change" link
 *
 * WHY: No more scattered language switchers! One place = Dashboard.
 *
 * Features:
 * 1. Language pair display (read-only from profile store)
 * 2. Free Chat + Scenario cards (fetched from API)
 * 3. Category filter tabs
 * 4. Start conversation → POST /api/conversations → redirect to /learn/[id]
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  Settings2,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORTED_LANGUAGES, type ProficiencyLevel } from "@/lib/constants";
import { useProfileStore, useTargetLanguage, useNativeLanguage } from "@/stores/profile-store";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface Scenario {
  id: string;
  title: string;
  description: string;
  category: string;
  difficultyLevel: string;
  languagePair?: string;
  targetLanguage?: string;
  openingLine: string;
  isPremium: boolean;
  isLocked?: boolean;
}

// ═══════════════════════════════════════════
// Fallback hardcoded scenarios
// ═══════════════════════════════════════════

const FALLBACK_SCENARIOS: Scenario[] = [
  {
    id: "1",
    title: "Ordering at a Restaurant",
    description:
      "Practice ordering food and drinks at a restaurant, asking about menu items, and handling the bill.",
    category: "daily",
    difficultyLevel: "beginner",
    targetLanguage: "ar",
    openingLine: "أهلاً وسهلاً! تفضل بالجلوس. ماذا تريد أن تطلب؟",
    isPremium: false,
  },
  {
    id: "2",
    title: "At the Airport",
    description: "Navigate check-in, security, and boarding at an airport in your target language.",
    category: "travel",
    difficultyLevel: "beginner",
    targetLanguage: "ar",
    openingLine: "مرحباً! يمكنني مساعدتك؟ هل أنت جاهز لتسجيل الدخول؟",
    isPremium: false,
  },
  {
    id: "3",
    title: "Coffee Shop Chat",
    description:
      "Casual conversation at a coffee shop with a friend. Practice everyday small talk.",
    category: "social",
    difficultyLevel: "beginner",
    targetLanguage: "es",
    openingLine: "¡Hola! ¿Qué tal? ¿Qué te pido?",
    isPremium: false,
  },
  {
    id: "4",
    title: "Hotel Check-in",
    description:
      "Check into a hotel, ask about amenities, and resolve a minor issue with your room.",
    category: "travel",
    difficultyLevel: "beginner",
    targetLanguage: "fr",
    openingLine: "Bonsoir! Bienvenue à notre hôtel.",
    isPremium: false,
  },
  {
    id: "5",
    title: "Business Meeting",
    description: "Introduce yourself and your company in a professional business meeting.",
    category: "business",
    difficultyLevel: "intermediate",
    targetLanguage: "ar",
    openingLine: "السلام عليكم، تشرفنا بمعرفتك.",
    isPremium: true,
  },
  {
    id: "6",
    title: "Doctor Visit",
    description: "Describe your symptoms to a doctor and understand medical instructions.",
    category: "medical",
    difficultyLevel: "intermediate",
    targetLanguage: "ar",
    openingLine: "مرحباً، ما الذي يجلبك اليوم؟",
    isPremium: true,
  },
];

// ═══════════════════════════════════════════
// Category definitions
// ═══════════════════════════════════════════

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "daily", label: "Daily" },
  { id: "travel", label: "Travel" },
  { id: "social", label: "Social" },
  { id: "business", label: "Business" },
  { id: "medical", label: "Medical" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

export default function LearnPage() {
  const router = useRouter();

  // Profile from shared store — single source of truth
  const profile = useProfileStore((s) => s.profile);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const isProfileInitialized = useProfileStore((s) => s.isInitialized);
  const targetLang = useTargetLanguage();
  const nativeLang = useNativeLanguage();

  // Local state — derived from profile store (read-only here!)
  const nativeLangCode = profile?.nativeLanguage || "en";
  const targetLangCode = profile?.targetLanguage || "ar";
  const difficulty: ProficiencyLevel = profile?.proficiencyLevel || "beginner";

  // Scenario + filter state
  const [scenarios, setScenarios] = useState<Scenario[]>(FALLBACK_SCENARIOS);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(true);

  // Loading + error states
  const [isStarting, setIsStarting] = useState(false);
  const [startingScenarioId, setStartingScenarioId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch profile on mount ───
  useEffect(() => {
    if (!isProfileInitialized) {
      fetchProfile();
    }
  }, [isProfileInitialized, fetchProfile]);

  // ─── Fetch scenarios from API ───
  useEffect(() => {
    async function fetchScenarios() {
      setIsLoadingScenarios(true);
      try {
        const res = await fetch("/api/scenarios");
        const data = await res.json();

        if (data.success && data.data?.scenarios && data.data.scenarios.length > 0) {
          // Map API response fields to our Scenario interface
          const mapped: Scenario[] = data.data.scenarios.map(
            (s: {
              id: string;
              title: string;
              description: string;
              category: string;
              difficultyLevel: string;
              languagePair?: string;
              openingLine: string;
              isPremium: boolean;
              isLocked?: boolean;
            }) => ({
              id: s.id,
              title: s.title,
              description: s.description,
              category: s.category,
              difficultyLevel: s.difficultyLevel,
              languagePair: s.languagePair,
              targetLanguage: s.languagePair?.split("-")[1] || targetLangCode,
              openingLine: s.openingLine,
              isPremium: s.isPremium,
              isLocked: s.isLocked,
            })
          );
          setScenarios(mapped);
        }
        // If API returns empty or fails, keep FALLBACK_SCENARIOS (already set as initial state)
      } catch {
        // Keep fallback scenarios on error
      } finally {
        setIsLoadingScenarios(false);
      }
    }
    fetchScenarios();
  }, [targetLangCode]);

  // ─── Filtered scenarios by category ───
  const filteredScenarios = useMemo(() => {
    if (activeCategory === "all") return scenarios;
    return scenarios.filter((s) => s.category === activeCategory);
  }, [scenarios, activeCategory]);

  // ─── Start a conversation ───
  const startConversation = async (
    scenarioTargetLang?: string,
    scenarioDifficulty?: ProficiencyLevel,
    scenarioId?: string
  ) => {
    setIsStarting(true);
    setError(null);
    setStartingScenarioId(scenarioId || scenarioTargetLang || "free");

    const effectiveTarget = scenarioTargetLang || targetLangCode;
    const effectiveDifficulty = scenarioDifficulty || difficulty;
    const languagePair = `${nativeLangCode}-${effectiveTarget}`;

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          languagePair,
          difficultyLevel: effectiveDifficulty,
          scenarioId: scenarioId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to start conversation");
      }

      router.push(`/learn/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    } finally {
      setIsStarting(false);
      setStartingScenarioId(null);
    }
  };

  // ─── Loading state ───
  if (!isProfileInitialized) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="mb-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Practice Conversations
        </h1>
        <p className="text-[var(--text-secondary)]">
          Choose a scenario or start a free chat with your AI tutor
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-[var(--state-error-light)] px-4 py-3 text-sm text-[var(--state-error)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ═══ Language bar — DISPLAY ONLY ═══ */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex flex-wrap items-center gap-2 p-4 sm:gap-3">
          {/* Native language badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-elevated)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)]">
            <span className="text-base">{nativeLang.flagEmoji}</span>
            {nativeLang.name}
          </span>

          <span className="text-[var(--text-muted)]">&rarr;</span>

          {/* Target language badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-light)] px-3 py-1.5 text-sm font-medium text-[var(--accent-primary)]">
            <span className="text-base">{targetLang.flagEmoji}</span>
            {targetLang.name}
          </span>

          {/* Level badge */}
          <span className="inline-flex items-center rounded-full bg-[var(--bg-elevated)] px-3 py-1.5 text-sm text-[var(--text-secondary)] capitalize">
            {difficulty}
          </span>

          {/* Spacer to push Change button to end on wrapped rows */}
          <div className="flex-1" />

          {/* Change link → goes to Dashboard */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-light)] px-3 py-2 text-xs font-semibold text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)] hover:text-white"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Change
          </Link>
        </div>
      </div>

      {/* Free Chat CTA */}
      <div className="gradient-conbolo relative mb-8 overflow-hidden rounded-2xl p-6 text-white">
        <div className="dot-pattern absolute inset-0 opacity-10" />
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h2
                className="text-lg font-semibold"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                Free Chat
              </h2>
            </div>
            <p className="text-sm text-white/70">
              Talk about anything with your AI tutor. No script, just natural conversation.
            </p>
            <p className="mt-1 text-xs text-white/50">
              {nativeLang.name} &rarr; {targetLang.name} &middot;{" "}
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </p>
          </div>
          <Button
            onClick={() => startConversation()}
            disabled={isStarting}
            className="h-11 shrink-0 rounded-xl bg-white px-6 text-sm font-semibold text-[var(--accent-primary)] hover:bg-white/90 disabled:opacity-50"
          >
            {isStarting && startingScenarioId === "free" ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="mr-1.5 h-4 w-4" />
            )}
            Start Free Chat
          </Button>
        </div>
      </div>

      {/* ═══ Category Filter Tabs ═══ */}
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                activeCategory === cat.id
                  ? "bg-[var(--accent-primary)] text-white shadow-sm"
                  : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--accent-light)] hover:text-[var(--accent-primary)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Scenario Grid ═══ */}
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-lg font-semibold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Conversation Scenarios
        </h2>
        {!isLoadingScenarios && (
          <span className="text-xs text-[var(--text-muted)]">
            {filteredScenarios.length} {filteredScenarios.length === 1 ? "scenario" : "scenarios"}
          </span>
        )}
      </div>

      {isLoadingScenarios ? (
        /* Loading skeleton for scenario cards */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="h-5 w-14 rounded-full bg-[var(--bg-elevated)]" />
                <div className="h-5 w-20 rounded-full bg-[var(--bg-elevated)]" />
              </div>
              <div className="mb-2 h-4 w-3/4 rounded bg-[var(--bg-elevated)]" />
              <div className="mb-4 h-3 w-full rounded bg-[var(--bg-elevated)]" />
              <div className="h-8 w-full rounded-lg bg-[var(--bg-elevated)]" />
            </div>
          ))}
        </div>
      ) : filteredScenarios.length === 0 ? (
        /* Empty state for category filter */
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center">
          <MessageSquare className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" />
          <h3
            className="mb-1 text-sm font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            No scenarios in this category
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Try selecting a different category or start a free chat instead.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredScenarios.map((scenario) => {
            const isPremium = (scenario.isPremium || scenario.isLocked) && !profile?.isPro;
            const isStartingThis = isStarting && startingScenarioId === scenario.id;

            return (
              <div
                key={scenario.id}
                className="group rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/30 hover:shadow-[var(--shadow-md)]"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-[var(--accent-light)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--accent-primary)]">
                    {scenario.category.charAt(0).toUpperCase() + scenario.category.slice(1)}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-[var(--bg-elevated)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
                    {scenario.difficultyLevel.charAt(0).toUpperCase() + scenario.difficultyLevel.slice(1)}
                  </span>
                  {(scenario.isPremium || scenario.isLocked) && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-gold-light)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--color-gold)]">
                      <Crown className="h-2.5 w-2.5" />
                      Pro
                    </span>
                  )}
                </div>
                <h3
                  className="mb-2 text-base font-semibold text-[var(--text-primary)]"
                  style={{ fontFamily: "var(--font-heading-cfg)" }}
                >
                  {scenario.title}
                </h3>
                <p className="mb-4 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {scenario.description}
                </p>
                {scenario.openingLine && (
                  <div className="mb-3 text-xs text-[var(--text-muted)] italic">
                    &ldquo;{scenario.openingLine}&rdquo;
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={() =>
                    isPremium
                      ? router.push("/pricing")
                      : startConversation(
                          scenario.targetLanguage,
                          scenario.difficultyLevel as ProficiencyLevel,
                          scenario.id
                        )
                  }
                  disabled={isStartingThis}
                  className={`h-9 w-full rounded-lg text-xs ${
                    isPremium
                      ? "border border-[var(--accent-primary)]/30 bg-transparent text-[var(--accent-primary)] hover:bg-[var(--accent-light)]"
                      : "gradient-conbolo border-0 text-white hover:opacity-90"
                  }`}
                >
                  {isStartingThis ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  )}
                  {isPremium ? "Upgrade to Pro" : "Start Conversation"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
