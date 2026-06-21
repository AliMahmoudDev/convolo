/**
 * /learn — Practice Page (Scenario Selection + Start Conversation)
 *
 * Language switching pattern:
 * - Reads target language from shared profile store
 * - When user changes language here, it updates the profile immediately
 * - Native language and difficulty also sync with profile
 * - A subtle link directs users to the Dashboard for the main language selector
 *
 * Features:
 * 1. Language pair display (reads from shared store, changes update profile)
 * 2. Difficulty selector (syncs with profile)
 * 3. Free Chat + Scenario cards
 * 4. Start conversation → POST /api/conversations → redirect to /learn/[id]
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORTED_LANGUAGES, PROFICIENCY_LEVELS, type ProficiencyLevel } from "@/lib/constants";
import { useProfileStore, useTargetLanguage, useNativeLanguage } from "@/stores/profile-store";

// ═══════════════════════════════════════════
// Hardcoded scenarios
// ═══════════════════════════════════════════

const scenarios = [
  {
    id: "1",
    title: "Ordering at a Restaurant",
    description:
      "Practice ordering food and drinks at a restaurant, asking about menu items, and handling the bill.",
    category: "daily",
    difficulty: "beginner" as const,
    targetLanguage: "ar" as const,
    openingLine: "أهلاً وسهلاً! تفضل بالجلوس. ماذا تريد أن تطلب؟",
    premium: false,
  },
  {
    id: "2",
    title: "At the Airport",
    description: "Navigate check-in, security, and boarding at an airport in your target language.",
    category: "travel",
    difficulty: "beginner" as const,
    targetLanguage: "ar" as const,
    openingLine: "مرحباً! يمكنني مساعدتك؟ هل أنت جاهز لتسجيل الدخول؟",
    premium: false,
  },
  {
    id: "3",
    title: "Coffee Shop Chat",
    description:
      "Casual conversation at a coffee shop with a friend. Practice everyday small talk.",
    category: "social",
    difficulty: "beginner" as const,
    targetLanguage: "es" as const,
    openingLine: "¡Hola! ¿Qué tal? ¿Qué te pido?",
    premium: false,
  },
  {
    id: "4",
    title: "Hotel Check-in",
    description:
      "Check into a hotel, ask about amenities, and resolve a minor issue with your room.",
    category: "travel",
    difficulty: "beginner" as const,
    targetLanguage: "fr" as const,
    openingLine: "Bonsoir! Bienvenue à notre hôtel.",
    premium: false,
  },
  {
    id: "5",
    title: "Business Meeting",
    description: "Introduce yourself and your company in a professional business meeting.",
    category: "business",
    difficulty: "intermediate" as const,
    targetLanguage: "ar" as const,
    openingLine: "السلام عليكم، تشرفنا بمعرفتك.",
    premium: true,
  },
  {
    id: "6",
    title: "Doctor Visit",
    description: "Describe your symptoms to a doctor and understand medical instructions.",
    category: "medical",
    difficulty: "intermediate" as const,
    targetLanguage: "ar" as const,
    openingLine: "مرحباً، ما الذي يجلبك اليوم؟",
    premium: true,
  },
];

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

export default function LearnPage() {
  const router = useRouter();

  // Profile from shared store
  const profile = useProfileStore((s) => s.profile);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const isProfileInitialized = useProfileStore((s) => s.isInitialized);
  const targetLang = useTargetLanguage();
  const nativeLang = useNativeLanguage();

  // Local state for the currently selected values (synced from profile)
  const [nativeLangCode, setNativeLangCode] = useState<string>("en");
  const [targetLangCode, setTargetLangCode] = useState<string>("ar");
  const [difficulty, setDifficulty] = useState<ProficiencyLevel>("beginner");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

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

  // ─── Sync local state from profile store ───
  useEffect(() => {
    if (profile) {
      setNativeLangCode(profile.nativeLanguage || "en");
      if (profile.targetLanguage) setTargetLangCode(profile.targetLanguage);
      setDifficulty(profile.proficiencyLevel || "beginner");
    }
  }, [profile]);

  // ─── Handle target language change → update profile immediately ───
  const handleTargetLangChange = useCallback(
    async (newLang: string) => {
      if (isUpdating) return;
      setTargetLangCode(newLang);
      setIsUpdating("targetLanguage");
      await updateProfile({ targetLanguage: newLang });
      setIsUpdating(null);
    },
    [isUpdating, updateProfile]
  );

  // ─── Handle native language change → update profile immediately ───
  const handleNativeLangChange = useCallback(
    async (newLang: string) => {
      if (isUpdating) return;
      setNativeLangCode(newLang);
      setIsUpdating("nativeLanguage");
      await updateProfile({ nativeLanguage: newLang });
      setIsUpdating(null);
    },
    [isUpdating, updateProfile]
  );

  // ─── Handle difficulty change → update profile immediately ───
  const handleDifficultyChange = useCallback(
    async (newDifficulty: ProficiencyLevel) => {
      if (isUpdating) return;
      setDifficulty(newDifficulty);
      setIsUpdating("proficiencyLevel");
      await updateProfile({ proficiencyLevel: newDifficulty });
      setIsUpdating(null);
    },
    [isUpdating, updateProfile]
  );

  // ─── Start a conversation ───
  const startConversation = async (
    scenarioTargetLang?: string,
    scenarioDifficulty?: ProficiencyLevel
  ) => {
    setIsStarting(true);
    setError(null);
    setStartingScenarioId(scenarioTargetLang || "free");

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

  // ─── Get language display info ───
  const getLang = (code: string) =>
    SUPPORTED_LANGUAGES.find((l) => l.code === code) || { code, name: code, flagEmoji: "🌐" };

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

      {/* ═══ Language & Difficulty bar ═══ */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        {/* Language pair bar — changes update profile immediately */}
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Language & Level</h3>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] hover:text-[var(--accent-hover)]"
            >
              Manage in Dashboard
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            {/* Native language */}
            <div className="min-w-[140px] flex-1">
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                I speak
              </label>
              <select
                value={nativeLangCode}
                onChange={(e) => handleNativeLangChange(e.target.value)}
                disabled={!!isUpdating}
                className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] focus:outline-none disabled:opacity-60"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flagEmoji} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Arrow */}
            <div className="pb-2 text-[var(--text-muted)]">&rarr;</div>

            {/* Target language */}
            <div className="min-w-[140px] flex-1">
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                I want to learn
                {isUpdating === "targetLanguage" && (
                  <Loader2 className="ml-1 inline h-3 w-3 animate-spin text-[var(--accent-primary)]" />
                )}
              </label>
              <select
                value={targetLangCode}
                onChange={(e) => handleTargetLangChange(e.target.value)}
                disabled={!!isUpdating}
                className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] focus:outline-none disabled:opacity-60"
              >
                {SUPPORTED_LANGUAGES.filter((l) => l.code !== nativeLangCode).map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flagEmoji} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div className="min-w-[140px] flex-1">
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Level
                {isUpdating === "proficiencyLevel" && (
                  <Loader2 className="ml-1 inline h-3 w-3 animate-spin text-[var(--accent-primary)]" />
                )}
              </label>
              <select
                value={difficulty}
                onChange={(e) => handleDifficultyChange(e.target.value as ProficiencyLevel)}
                disabled={!!isUpdating}
                className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] focus:outline-none disabled:opacity-60"
              >
                {PROFICIENCY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Current language summary */}
        <div className="border-t border-[var(--border-default)]/50 bg-[var(--bg-elevated)]/30 px-4 py-2.5">
          <p className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span className="text-base">{getLang(nativeLangCode).flagEmoji}</span>
            <span className="font-medium">{getLang(nativeLangCode).name}</span>
            <span className="text-[var(--text-muted)]">→</span>
            <span className="text-base">{getLang(targetLangCode).flagEmoji}</span>
            <span className="font-medium">{getLang(targetLangCode).name}</span>
            <span className="text-[var(--text-muted)]">·</span>
            <span className="capitalize">{difficulty}</span>
          </p>
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
              {getLang(nativeLangCode).name} &rarr; {getLang(targetLangCode).name} &middot;{" "}
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

      {/* Scenario Grid */}
      <h2
        className="mb-4 text-lg font-semibold text-[var(--text-primary)]"
        style={{ fontFamily: "var(--font-heading-cfg)" }}
      >
        Conversation Scenarios
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((scenario) => {
          const isPremium = scenario.premium && !profile?.isPro;
          const isStartingThis = isStarting && startingScenarioId === scenario.targetLanguage;

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
                  {scenario.difficulty.charAt(0).toUpperCase() + scenario.difficulty.slice(1)}
                </span>
                {scenario.premium && (
                  <span className="inline-flex items-center rounded-full bg-[var(--color-gold-light)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--color-gold)]">
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
              <div className="mb-3 text-xs text-[var(--text-muted)] italic">
                &ldquo;{scenario.openingLine}&rdquo;
              </div>
              <Button
                size="sm"
                onClick={() =>
                  isPremium
                    ? router.push("/pricing")
                    : startConversation(scenario.targetLanguage, scenario.difficulty)
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
    </div>
  );
}
