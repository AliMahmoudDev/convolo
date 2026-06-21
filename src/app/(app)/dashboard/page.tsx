/**
 * Dashboard — Main hub for the app.
 *
 * Features:
 * - Personalized greeting with user's name
 * - Language Card (prominent, like Duolingo) — change target language here
 * - Live stats from user profile
 * - Quick actions
 * - Recent conversations
 *
 * Language switching pattern (like Duolingo/Babbel):
 * - Target language: Changed HERE on the Dashboard (Language Card)
 * - Interface language: Changed in Settings only
 * - Chat: Display-only, no switching mid-conversation
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORTED_LANGUAGES, type ProficiencyLevel } from "@/lib/constants";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface UserProfile {
  id: string;
  name: string;
  email: string;
  nativeLanguage: string;
  targetLanguage: string | null;
  proficiencyLevel: ProficiencyLevel;
  isPro: boolean;
}

interface Conversation {
  id: string;
  languagePair: string;
  status: string;
  messageCount: number;
  startedAt: string;
  scenario: { title: string } | null;
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

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [isUpdatingLang, setIsUpdatingLang] = useState(false);

  // ─── Fetch profile + conversations ───
  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, convRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/conversations"),
        ]);

        const profileData = await profileRes.json();
        if (profileData.success && profileData.data) {
          setProfile(profileData.data);
        }

        const convData = await convRes.json();
        if (convData.success && convData.data) {
          setConversations((convData.data.conversations || []).slice(0, 3));
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // ─── Change target language ───
  const handleLanguageChange = async (newLang: string) => {
    if (!profile || isUpdatingLang) return;
    setIsUpdatingLang(true);
    setShowLangPicker(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLanguage: newLang }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setProfile(data.data);
      }
    } catch {
      // Silently fail
    } finally {
      setIsUpdatingLang(false);
    }
  };

  // ─── Loading state ───
  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  const nativeLang = getLangInfo(profile?.nativeLanguage || "en");
  const targetLang = getLangInfo(profile?.targetLanguage || "es");
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

      {/* ═══ Language Card (like Duolingo's flag) ═══ */}
      <div className="mb-8">
        <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-4 p-5 sm:p-6">
            {/* Big flag emoji */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-light)] text-3xl">
              {targetLang.flagEmoji}
            </div>

            {/* Language info */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium tracking-wider text-[var(--text-muted)] uppercase">
                I&apos;m learning
              </p>
              <h2
                className="text-xl font-bold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                {targetLang.name}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <span>
                  {nativeLang.flagEmoji} {nativeLang.name}
                </span>
                <span className="text-[var(--text-muted)]">→</span>
                <span>
                  {targetLang.flagEmoji} {targetLang.name}
                </span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="capitalize">{level}</span>
                {profile?.isPro && (
                  <>
                    <span className="text-[var(--text-muted)]">·</span>
                    <span className="inline-flex items-center gap-0.5 font-medium text-[var(--color-gold)]">
                      <Crown className="h-3 w-3" /> Pro
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Change language button */}
            <div className="relative">
              <button
                onClick={() => setShowLangPicker(!showLangPicker)}
                disabled={isUpdatingLang}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--accent-light)] px-4 py-2.5 text-sm font-medium text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)] hover:text-white disabled:opacity-50"
              >
                {isUpdatingLang ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                Change
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {/* Language dropdown */}
              {showLangPicker && (
                <div className="absolute top-full right-0 z-50 mt-2 w-64 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 shadow-[var(--shadow-lg)]">
                  <p className="mb-2 px-3 text-[10px] font-medium tracking-wider text-[var(--text-muted)] uppercase">
                    Switch target language
                  </p>
                  {SUPPORTED_LANGUAGES.filter(
                    (l) => l.code !== (profile?.nativeLanguage || "en")
                  ).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-[var(--bg-elevated)] ${
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
                      {lang.code === profile?.targetLanguage && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Stats Grid ═══ */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Conversations",
            value: "0",
            icon: MessageSquare,
            color: "text-[var(--accent-primary)]",
            bg: "bg-[var(--accent-light)]",
          },
          {
            label: "Words Learned",
            value: "0",
            icon: BookOpen,
            color: "text-[var(--state-success)]",
            bg: "bg-green-50 dark:bg-green-900/20",
          },
          {
            label: "Day Streak",
            value: "0",
            icon: Flame,
            color: "text-[var(--color-gold)]",
            bg: "bg-[var(--color-gold-light)]",
          },
          {
            label: "XP Points",
            value: "0",
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
      </div>

      {/* Click outside to close lang picker */}
      {showLangPicker && (
        <div className="fixed inset-0 z-40" onClick={() => setShowLangPicker(false)} />
      )}
    </div>
  );
}
