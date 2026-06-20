/**
 * /learn — Practice Page (Scenario Selection + Start Conversation)
 *
 * What changed from the static version:
 * 1. Now a client component (needs interactivity for language selection + API calls)
 * 2. Fetches user profile to pre-fill language pair
 * 3. Language pair selector (native → target)
 * 4. Difficulty selector
 * 5. "Start Conversation" buttons now call POST /api/conversations
 * 6. On success, redirect to /learn/[id] (the chat page)
 * 7. Loading states while creating a conversation
 * 8. Error handling (daily limit, premium scenarios, etc.)
 *
 * Why we kept scenarios hardcoded:
 * - The Scenario model in the DB isn't seeded yet
 * - Hardcoded scenarios give instant results without extra API calls
 * - We'll migrate to dynamic scenarios in a future sprint
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ArrowRight, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SUPPORTED_LANGUAGES,
  PROFICIENCY_LEVELS,
  type ProficiencyLevel,
  type LanguageCode,
} from "@/lib/constants";

// ═══════════════════════════════════════════
// Hardcoded scenarios (same as before)
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
// User profile type
// ═══════════════════════════════════════════

interface UserProfile {
  nativeLanguage: string;
  targetLanguage: string | null;
  proficiencyLevel: ProficiencyLevel;
  isPro: boolean;
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

export default function LearnPage() {
  const router = useRouter();

  // Language + difficulty state
  const [nativeLang, setNativeLang] = useState<string>("en");
  const [targetLang, setTargetLang] = useState<string>("ar");
  const [difficulty, setDifficulty] = useState<ProficiencyLevel>("beginner");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Loading + error states
  const [isStarting, setIsStarting] = useState(false);
  const [startingScenarioId, setStartingScenarioId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch user profile on mount ───
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json();
        if (data.success && data.data) {
          const p = data.data;
          setProfile(p);
          setNativeLang(p.nativeLanguage || "en");
          if (p.targetLanguage) setTargetLang(p.targetLanguage);
          setDifficulty(p.proficiencyLevel || "beginner");
        }
      } catch {
        // Silently fail — defaults are fine
      }
    }
    fetchProfile();
  }, []);

  // ─── Start a conversation ───
  const startConversation = async (
    scenarioTargetLang?: string,
    scenarioDifficulty?: ProficiencyLevel
  ) => {
    setIsStarting(true);
    setError(null);
    setStartingScenarioId(scenarioTargetLang || "free");

    const effectiveTarget = scenarioTargetLang || targetLang;
    const effectiveDifficulty = scenarioDifficulty || difficulty;
    const languagePair = `${nativeLang}-${effectiveTarget}`;

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

      // Redirect to the conversation page
      router.push(`/learn/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    } finally {
      setIsStarting(false);
      setStartingScenarioId(null);
    }
  };

  // ─── Get language display info ───
  const getLang = (code: string) =>
    SUPPORTED_LANGUAGES.find((l) => l.code === code) || { code, name: code, flagEmoji: "" };

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

      {/* Language & Difficulty selector */}
      <div className="mb-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Native language */}
          <div className="min-w-[140px] flex-1">
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              I speak
            </label>
            <select
              value={nativeLang}
              onChange={(e) => setNativeLang(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] focus:outline-none"
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
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] focus:outline-none"
            >
              {SUPPORTED_LANGUAGES.filter((l) => l.code !== nativeLang).map((lang) => (
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
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as ProficiencyLevel)}
              className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] focus:outline-none"
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
              {getLang(nativeLang).name} &rarr; {getLang(targetLang).name} &middot;{" "}
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
