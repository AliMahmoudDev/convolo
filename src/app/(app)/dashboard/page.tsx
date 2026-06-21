/**
 * Dashboard — Main hub for the app.
 *
 * Features:
 * - Personalized greeting with user's name
 * - Language Card (prominent, like Duolingo) — change BOTH languages here
 * - Live stats from user profile
 * - Quick actions
 * - Recent conversations
 *
 * Language switching pattern (like Duolingo/Babbel):
 * - ALL language changes happen HERE on the Dashboard (Language Card)
 * - Learn page: Display-only, "Change" link goes to Dashboard
 * - Chat: Display-only, no switching mid-conversation
 * - Interface language: Settings only (future feature)
 */

"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MessageSquare,
  BookOpen,
  Flame,
  Zap,
  ArrowRight,
  Globe,
  ChevronDown,
  Check,
  Crown,
  Play,
  Trophy,
  Loader2,
  Lock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORTED_LANGUAGES, type ProficiencyLevel } from "@/lib/constants";
import { useProfileStore, useTargetLanguage, useNativeLanguage } from "@/stores/profile-store";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface Conversation {
  id: string;
  languagePair: string;
  status: string;
  messageCount: number;
  startedAt: string;
  scenario: { title: string } | null;
}

interface UserStats {
  conversations: number;
  wordsLearned: number;
  dayStreak: number;
  xpPoints: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

// ═══════════════════════════════════════════
// Helper
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
// Component
// ═══════════════════════════════════════════

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUpgraded = searchParams.get("upgraded") === "true";

  // Profile from shared store
  const profile = useProfileStore((s) => s.profile);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const isProfileInitialized = useProfileStore((s) => s.isInitialized);
  const targetLang = useTargetLanguage();
  const nativeLang = useNativeLanguage();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<UserStats>({
    conversations: 0,
    wordsLearned: 0,
    dayStreak: 0,
    xpPoints: 0,
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [activePicker, setActivePicker] = useState<"native" | "target" | null>(null);
  const [isUpdatingLang, setIsUpdatingLang] = useState<string | null>(null);

  // Ref for the picker container — used for click-outside detection
  const pickerRef = useRef<HTMLDivElement>(null);

  // ─── Close picker when clicking outside ───
  useEffect(() => {
    if (!activePicker) return;

    function handleClickOutside(e: MouseEvent) {
      // If the click is inside the picker container, don't close
      if (pickerRef.current && pickerRef.current.contains(e.target as Node)) {
        return;
      }
      setActivePicker(null);
    }

    // Use setTimeout to avoid the same click that opened the picker from closing it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activePicker]);

  // ─── Fetch profile + conversations + stats on mount ───
  useEffect(() => {
    async function fetchData() {
      try {
        const [_, convRes, statsRes, achRes] = await Promise.all([
          fetchProfile(),
          fetch("/api/conversations"),
          fetch("/api/user/stats"),
          fetch("/api/achievements"),
        ]);

        const convData = await convRes.json();
        if (convData.success && convData.data) {
          setConversations((convData.data.conversations || []).slice(0, 3));
        }

        const statsData = await statsRes.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }

        const achData = await achRes.json();
        if (achData.success && achData.data?.achievements) {
          setAchievements(achData.data.achievements);
        }
      } catch {
        // Silently fail
      } finally {
        setIsPageLoading(false);
      }
    }
    fetchData();
  }, [fetchProfile]);

  // ─── Change target language ───
  const handleTargetLangChange = useCallback(
    async (newLang: string) => {
      if (isUpdatingLang) return;
      setIsUpdatingLang(newLang);
      setActivePicker(null);

      const result = await updateProfile({ targetLanguage: newLang });
      if (!result) {
        console.error("[Dashboard] Failed to update target language");
      }
      setIsUpdatingLang(null);
    },
    [isUpdatingLang, updateProfile]
  );

  // ─── Change native language ───
  const handleNativeLangChange = useCallback(
    async (newLang: string) => {
      if (isUpdatingLang) return;
      setIsUpdatingLang(newLang);
      setActivePicker(null);

      const result = await updateProfile({ nativeLanguage: newLang });
      if (!result) {
        console.error("[Dashboard] Failed to update native language");
      }
      setIsUpdatingLang(null);
    },
    [isUpdatingLang, updateProfile]
  );

  // ─── Loading state ───
  if (!isProfileInitialized || isPageLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  const level = profile?.proficiencyLevel || "beginner";
  const firstName = profile?.name?.split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1
          className="mb-1 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-[var(--text-secondary)]">Ready to practice {targetLang.name} today?</p>
      </div>

      {/* ═══ Language Card (Duolingo-style) ═══ */}
      <div className="mb-8">
        <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-gradient-to-br from-[var(--bg-surface)] to-[var(--accent-light)]/30">
          {/* Main language display — stacks on mobile, row on desktop */}
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-4 sm:p-6">
            {/* Top row on mobile: flag + info */}
            <div className="flex items-center gap-4">
              {/* Big flag emoji — like Duolingo's course icon */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-light)] text-3xl shadow-sm sm:h-24 sm:w-24 sm:text-5xl">
                {targetLang.flagEmoji}
              </div>

              {/* Language info + pickers (wrapped in ref for click-outside) */}
              <div className="min-w-0 flex-1" ref={pickerRef}>
                <p className="text-xs font-medium tracking-wider text-[var(--text-muted)] uppercase">
                  I&apos;m learning
                </p>
                <h2
                  className="text-xl font-bold text-[var(--text-primary)] sm:text-3xl"
                  style={{ fontFamily: "var(--font-heading-cfg)" }}
                >
                  {targetLang.name}
                </h2>
                <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{targetLang.nativeName}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {/* Native language — clickable to change */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePicker(activePicker === "native" ? null : "native");
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--accent-light)] hover:text-[var(--accent-primary)] sm:px-2.5 sm:py-1"
                  >
                    {nativeLang.flagEmoji} {nativeLang.name}
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${activePicker === "native" ? "rotate-180" : ""}`}
                    />
                  </button>
                  <span className="text-[var(--text-muted)]">→</span>
                  {/* Target language — clickable to change */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePicker(activePicker === "target" ? null : "target");
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-light)] px-2 py-1 text-xs font-medium text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)] hover:text-white sm:px-2.5 sm:py-1"
                  >
                    {targetLang.flagEmoji} {targetLang.name}
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${activePicker === "target" ? "rotate-180" : ""}`}
                    />
                  </button>
                  <span className="inline-flex items-center rounded-full bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--text-secondary)] capitalize sm:px-2.5 sm:py-1">
                    {level}
                  </span>
                  {profile?.isPro && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-gold-light)] px-2 py-1 text-xs font-medium text-[var(--color-gold)] sm:px-2.5 sm:py-1">
                      <Crown className="h-3 w-3" /> Pro
                    </span>
                  )}
                </div>

                {/* ═══ Native language picker ═══ */}
                {activePicker === "native" && (
                  <div className="relative z-50 mt-3 w-full max-w-72 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 shadow-[var(--shadow-lg)]">
                    <p className="mb-2 px-3 text-[10px] font-medium tracking-wider text-[var(--text-muted)] uppercase">
                      I speak (native language)
                    </p>
                    <div className="max-h-64 overflow-y-auto">
                      {SUPPORTED_LANGUAGES.filter(
                        (l) => l.code !== (profile?.targetLanguage || "ar")
                      ).map((lang) => (
                        <button
                          key={lang.code}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNativeLangChange(lang.code);
                          }}
                          disabled={!!isUpdatingLang}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-[var(--bg-elevated)] disabled:opacity-50 ${
                            lang.code === profile?.nativeLanguage
                              ? "bg-[var(--accent-light)] text-[var(--accent-primary)]"
                              : "text-[var(--text-primary)]"
                          }`}
                        >
                          <span className="text-xl">{lang.flagEmoji}</span>
                          <div className="min-w-0 flex-1 text-left">
                            <span className="font-medium">{lang.name}</span>
                            <span className="ml-1.5 text-xs text-[var(--text-muted)]">
                              {lang.nativeName}
                            </span>
                          </div>
                          {isUpdatingLang === lang.code && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          {lang.code === profile?.nativeLanguage && isUpdatingLang !== lang.code && (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ═══ Target language picker ═══ */}
                {activePicker === "target" && (
                  <div className="relative z-50 mt-3 w-full max-w-72 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 shadow-[var(--shadow-lg)]">
                    <p className="mb-2 px-3 text-[10px] font-medium tracking-wider text-[var(--text-muted)] uppercase">
                      I want to learn (target language)
                    </p>
                    <div className="max-h-64 overflow-y-auto">
                      {SUPPORTED_LANGUAGES.filter(
                        (l) => l.code !== (profile?.nativeLanguage || "en")
                      ).map((lang) => (
                        <button
                          key={lang.code}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTargetLangChange(lang.code);
                          }}
                          disabled={!!isUpdatingLang}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-[var(--bg-elevated)] disabled:opacity-50 ${
                            lang.code === profile?.targetLanguage
                              ? "bg-[var(--accent-light)] text-[var(--accent-primary)]"
                              : "text-[var(--text-primary)]"
                          }`}
                        >
                          <span className="text-xl">{lang.flagEmoji}</span>
                          <div className="min-w-0 flex-1 text-left">
                            <span className="font-medium">{lang.name}</span>
                            <span className="ml-1.5 text-xs text-[var(--text-muted)]">
                              {lang.nativeName}
                            </span>
                          </div>
                          {isUpdatingLang === lang.code && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          {lang.code === profile?.targetLanguage && isUpdatingLang !== lang.code && (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Change language button — full width on mobile, inline on desktop */}
            <div className="sm:shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePicker(activePicker === "target" ? null : "target");
                }}
                disabled={!!isUpdatingLang}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] hover:shadow-md disabled:opacity-50 sm:w-auto"
              >
                {isUpdatingLang ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                Change
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${activePicker === "target" ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Quick start bar */}
          <div className="border-t border-[var(--border-default)]/50 bg-[var(--bg-surface)]/50 px-5 py-3 sm:px-6">
            <Link
              href="/learn"
              className="flex items-center justify-between rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--accent-hover)] hover:shadow-md"
            >
              <span className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Start {targetLang.name} Practice
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ Upgrade Success Banner ═══ */}
      {isUpgraded && (
        <div className="mb-8 rounded-2xl border border-[var(--state-success)]/20 bg-[var(--state-success-light)] p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-[var(--state-success)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--state-success)]">
                Welcome to Pro! 🎉
              </p>
              <p className="text-xs text-[var(--state-success)]/80">
                Your subscription is now active. Enjoy unlimited conversations and all premium features!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Upgrade CTA Banner (Free users) ═══ */}
      {!profile?.isPro && (
        <div className="mb-8">
          <Link
            href="/pricing"
            className="gradient-conbolo group flex items-center justify-between rounded-2xl p-5 text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h3
                  className="font-semibold"
                  style={{ fontFamily: "var(--font-heading-cfg)" }}
                >
                  Upgrade to Pro
                </h3>
                <p className="text-sm text-white/80">
                  Unlimited conversations, premium scenarios & more
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/30">
              <Sparkles className="h-4 w-4" />
              Upgrade Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      )}

      {/* ═══ Stats Grid ═══ */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Conversations",
            value: String(stats.conversations),
            icon: MessageSquare,
            color: "text-[var(--accent-primary)]",
            bg: "bg-[var(--accent-light)]",
          },
          {
            label: "Words Learned",
            value: String(stats.wordsLearned),
            icon: BookOpen,
            color: "text-[var(--state-success)]",
            bg: "bg-green-50 dark:bg-green-900/20",
          },
          {
            label: "Day Streak",
            value: String(stats.dayStreak),
            icon: Flame,
            color: "text-[var(--color-gold)]",
            bg: "bg-[var(--color-gold-light)]",
          },
          {
            label: "XP Points",
            value: String(stats.xpPoints),
            icon: Zap,
            color: "text-purple-500",
            bg: "bg-purple-50 dark:bg-purple-900/20",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
              </div>
            </div>
            <p
              className="mb-0.5 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              {stat.value}
            </p>
            <p className="text-xs text-[var(--text-muted)] sm:text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ═══ Quick Actions ═══ */}
      <div className="mb-8">
        <h2
          className="mb-4 text-lg font-semibold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Quick Start
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/learn"
            className="gradient-conbolo group relative rounded-2xl border-0 p-5 text-white transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="mb-1 font-semibold" style={{ fontFamily: "var(--font-heading-cfg)" }}>
              Free Chat
            </h3>
            <p className="text-sm text-white/70">Practice casual conversation on any topic</p>
            <ArrowRight className="absolute top-5 right-5 h-4 w-4 text-white/60 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/learn"
            className="group rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/30"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-light)]">
              <Globe className="h-5 w-5 text-[var(--accent-primary)]" />
            </div>
            <h3
              className="mb-1 font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              {targetLang.name} Practice
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Start a lesson in {targetLang.name}
            </p>
            <ArrowRight className="absolute top-5 right-5 h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/vocabulary"
            className="group rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/30"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20">
              <BookOpen className="h-5 w-5 text-[var(--state-success)]" />
            </div>
            <h3
              className="mb-1 font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              Review Words
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Practice vocabulary with spaced repetition
            </p>
            <ArrowRight className="absolute top-5 right-5 h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* ═══ Recent Conversations ═══ */}
      {conversations.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="text-lg font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              Recent Conversations
            </h2>
            <Link
              href="/learn"
              className="text-sm font-medium text-[var(--accent-primary)] hover:text-[var(--accent-hover)]"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {conversations.map((conv) => {
              const [, tCode] = conv.languagePair.split("-");
              const tLang = getLangInfo(tCode);
              return (
                <Link
                  key={conv.id}
                  href={`/learn/${conv.id}`}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 transition-colors hover:border-[var(--accent-primary)]/30"
                >
                  <span className="text-xl">{tLang.flagEmoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {conv.scenario?.title || `${tLang.name} Conversation`}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {conv.messageCount} messages · {new Date(conv.startedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Achievements ═══ */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-lg font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Achievements
          </h2>
          <Link
            href="/progress"
            className="text-sm font-medium text-[var(--accent-primary)] hover:text-[var(--accent-hover)]"
          >
            View all
          </Link>
        </div>

        {achievements.length === 0 ? (
          /* Empty state — still loading or no data */
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" />
            <h3
              className="mb-1 text-sm font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              No achievements yet
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Start your first conversation to unlock your first achievement!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`group rounded-2xl border p-4 text-center transition-all duration-300 hover:-translate-y-0.5 ${
                  ach.unlocked
                    ? "border-[var(--color-gold)]/30 bg-gradient-to-br from-[var(--color-gold-light)]/50 to-[var(--bg-surface)] hover:border-[var(--color-gold)]/50 hover:shadow-[var(--shadow-md)]"
                    : "border-[var(--border-default)] bg-[var(--bg-surface)] opacity-60 hover:opacity-80"
                }`}
              >
                <div className="mb-2 text-3xl">
                  {ach.unlocked ? (
                    ach.icon
                  ) : (
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-elevated)]">
                      <Lock className="h-4 w-4 text-[var(--text-muted)]" />
                    </div>
                  )}
                </div>
                <h3
                  className={`mb-0.5 text-xs font-semibold leading-tight ${
                    ach.unlocked ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                  }`}
                  style={{ fontFamily: "var(--font-heading-cfg)" }}
                >
                  {ach.title}
                </h3>
                <p className="text-[10px] leading-snug text-[var(--text-secondary)]">
                  {ach.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams() compatibility
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
