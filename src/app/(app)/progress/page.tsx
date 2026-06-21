/**
 * Progress Page — Detailed learning analytics dashboard.
 *
 * Features:
 * - Overview cards (conversations, messages, minutes, XP)
 * - Streak display with flame icon
 * - Weekly activity chart (CSS bars)
 * - Language progress cards
 * - Average score display
 * - Loading skeleton & empty state
 */

"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Clock,
  Zap,
  Flame,
  Trophy,
  TrendingUp,
  BookOpen,
  AlertCircle,
  Loader2,
  BarChart3,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface WeeklyActivityItem {
  date: string;
  conversations: number;
  messages: number;
  minutes: number;
}

interface LanguageProgressItem {
  languagePair: string;
  totalConversations: number;
  avgScore: number;
  wordsLearned: number;
}

interface ProgressData {
  totalConversations: number;
  totalMessages: number;
  totalMinutes: number;
  totalWordsLearned: number;
  totalCorrections: number;
  currentStreak: number;
  longestStreak: number;
  xpPoints: number;
  avgScore: number;
  levelProgress: number;
  lastPracticeAt: string | null;
  weeklyActivity: WeeklyActivityItem[];
  languageProgress: LanguageProgressItem[];
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().split("T")[0]) return "Today";
  if (dateStr === yesterday.toISOString().split("T")[0]) return "Yesterday";

  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-[var(--state-success)]";
  if (score >= 70) return "text-[var(--accent-primary)]";
  if (score >= 50) return "text-[var(--color-gold)]";
  return "text-[var(--state-error)]";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Improving";
  return "Beginner";
}

function parseLanguagePair(pair: string): { source: string; target: string } {
  const parts = pair.split("-");
  return { source: parts[0] || "?", target: parts[1] || "?" };
}

// ═══════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════

function StatCard({
  icon: Icon,
  label,
  value,
  iconColor,
  iconBg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
        </div>
      </div>
      <p
        className="mb-0.5 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
        style={{ fontFamily: "var(--font-heading-cfg)" }}
      >
        {value}
      </p>
      <p className="text-xs text-[var(--text-muted)] sm:text-sm">{label}</p>
    </div>
  );
}

function CircularProgress({ value, size = 120, strokeWidth = 8 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-elevated)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-2xl font-bold ${getScoreColor(value)}`}
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          {value}
        </span>
        <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase">
          Score
        </span>
      </div>
    </div>
  );
}

function WeeklyChart({ data }: { data: WeeklyActivityItem[] }) {
  const maxConversations = Math.max(...data.map((d) => d.conversations), 1);

  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3
          className="text-base font-semibold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Weekly Activity
        </h3>
        <span className="text-xs text-[var(--text-muted)]">Last 7 days</span>
      </div>

      <div className="flex items-end justify-between gap-2 sm:gap-3" style={{ height: 160 }}>
        {data.map((day) => {
          const heightPercent = day.conversations > 0
            ? Math.max(12, (day.conversations / maxConversations) * 100)
            : 4;
          const isToday = day.date === new Date().toISOString().split("T")[0];

          return (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
              {/* Bar */}
              <div className="relative w-full flex justify-center" style={{ height: 120 }}>
                <div
                  className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ease-out ${
                    day.conversations > 0
                      ? isToday
                        ? "bg-[var(--accent-primary)]"
                        : "bg-[var(--accent-primary)]/60"
                      : "bg-[var(--bg-elevated)]"
                  }`}
                  style={{ height: `${heightPercent}%`, marginTop: "auto" }}
                />
              </div>

              {/* Day label */}
              <span className={`text-[10px] font-medium sm:text-xs ${
                isToday ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"
              }`}>
                {getDayLabel(day.date)}
              </span>

              {/* Count */}
              <span className={`text-[10px] font-bold ${
                day.conversations > 0 ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
              }`}>
                {day.conversations}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LanguageCard({ lang }: { lang: LanguageProgressItem }) {
  const { source, target } = parseLanguagePair(lang.languagePair);

  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5 transition-colors hover:border-[var(--accent-primary)]/30">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-light)]">
          <span className="text-sm font-bold text-[var(--accent-primary)] uppercase">{target}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {source.toUpperCase()} → {target.toUpperCase()}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">{lang.totalConversations} conversations</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading-cfg)" }}>
            {lang.totalConversations}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Sessions</p>
        </div>
        <div>
          <p className={`text-lg font-bold ${getScoreColor(lang.avgScore)}`} style={{ fontFamily: "var(--font-heading-cfg)" }}>
            {lang.avgScore}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Avg Score</p>
        </div>
        <div>
          <p className="text-lg font-bold text-[var(--state-success)]" style={{ fontFamily: "var(--font-heading-cfg)" }}>
            {lang.wordsLearned}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Words</p>
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
        <div
          className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-700 ease-out"
          style={{ width: `${lang.avgScore}%` }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Loading Skeleton
// ═══════════════════════════════════════════

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5">
            <Skeleton className="mb-3 h-9 w-9 rounded-lg" />
            <Skeleton className="mb-1 h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Streak + Score row */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
          <Skeleton className="mb-4 h-5 w-32" />
          <div className="flex items-center gap-6">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <div>
              <Skeleton className="mb-2 h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
          <Skeleton className="mb-4 h-5 w-28" />
          <div className="flex items-center justify-center">
            <Skeleton className="h-[120px] w-[120px] rounded-full" />
          </div>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="mb-8 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
        <Skeleton className="mb-6 h-5 w-36" />
        <div className="flex items-end justify-between gap-3" style={{ height: 160 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <Skeleton className="w-full max-w-[40px] rounded-t-lg" style={{ height: `${30 + Math.random() * 70}%` }} />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Language progress */}
      <div className="mb-8">
        <Skeleton className="mb-4 h-5 w-36" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
              <Skeleton className="mb-3 h-8 w-8 rounded-lg" />
              <Skeleton className="mb-2 h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Empty State
// ═══════════════════════════════════════════

function EmptyState() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-8">
        <h1
          className="mb-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Your Progress
        </h1>
        <p className="text-[var(--text-secondary)]">
          Track your fluency journey with detailed analytics and achievements
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center sm:p-12">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-light)]">
          <BarChart3 className="h-8 w-8 text-[var(--accent-primary)]" />
        </div>
        <h3
          className="mb-2 text-lg font-semibold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          No progress data yet
        </h3>
        <p className="mx-auto mb-6 max-w-md text-sm text-[var(--text-secondary)]">
          Complete your first conversation to start tracking your learning progress. You will see
          detailed analytics including fluency score, streaks, and vocabulary growth over time.
        </p>
        <Link href="/learn">
          <Button className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Start Your First Conversation
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch("/api/user/progress");
        const json = await res.json();

        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.error?.message || "Failed to load progress");
        }
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProgress();
  }, []);

  // ─── Loading state ───
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // ─── Error state ───
  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-8">
          <h1
            className="mb-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Your Progress
          </h1>
          <p className="text-[var(--text-secondary)]">
            Track your fluency journey with detailed analytics and achievements
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--state-error)]/20 bg-[var(--state-error-light)] p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-[var(--state-error)]" />
          <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
            Failed to load progress
          </h3>
          <p className="mb-4 text-sm text-[var(--text-secondary)]">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ─── Empty state (no conversations at all) ───
  if (!data || (data.totalConversations === 0 && data.totalMessages === 0)) {
    return <EmptyState />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="mb-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Your Progress
        </h1>
        <p className="text-[var(--text-secondary)]">
          Track your fluency journey with detailed analytics and achievements
        </p>
      </div>

      {/* ═══ Overview Stats Grid ═══ */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={MessageSquare}
          label="Conversations"
          value={String(data.totalConversations)}
          iconColor="text-[var(--accent-primary)]"
          iconBg="bg-[var(--accent-light)]"
        />
        <StatCard
          icon={MessageSquare}
          label="Messages"
          value={String(data.totalMessages)}
          iconColor="text-[var(--accent-secondary)]"
          iconBg="bg-[var(--accent-secondary-light)]"
        />
        <StatCard
          icon={Clock}
          label="Practice Time"
          value={formatMinutes(data.totalMinutes)}
          iconColor="text-[var(--state-success)]"
          iconBg="bg-green-50 dark:bg-green-900/20"
        />
        <StatCard
          icon={Zap}
          label="XP Points"
          value={String(data.xpPoints)}
          iconColor="text-[var(--color-gold)]"
          iconBg="bg-[var(--color-gold-light)]"
        />
      </div>

      {/* ═══ Streak + Score Row ═══ */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Streak Card */}
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 sm:p-6">
          <h3
            className="mb-4 text-base font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Learning Streak
          </h3>
          <div className="flex items-center gap-5">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                data.currentStreak > 0
                  ? "bg-[var(--color-gold-light)]"
                  : "bg-[var(--bg-elevated)]"
              }`}
            >
              <Flame
                className={`h-8 w-8 ${
                  data.currentStreak > 0
                    ? "text-[var(--color-gold)]"
                    : "text-[var(--text-muted)]"
                }`}
              />
            </div>
            <div>
              <p
                className="text-3xl font-bold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                {data.currentStreak}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {data.currentStreak === 1 ? "day streak" : "day streak"}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                <span className="text-xs text-[var(--text-muted)]">
                  Best: {data.longestStreak} days
                </span>
              </div>
            </div>
          </div>

          {/* Streak encouragement */}
          {data.currentStreak > 0 && (
            <div className="mt-4 rounded-lg bg-[var(--color-gold-light)] px-3 py-2">
              <p className="text-xs font-medium text-[var(--color-gold)]">
                {data.currentStreak >= 7
                  ? "Amazing! Keep the momentum going! 🔥"
                  : data.currentStreak >= 3
                    ? "Great streak! Don't break it!"
                    : "Nice start! Practice daily to build your streak!"}
              </p>
            </div>
          )}
        </div>

        {/* Average Score Card */}
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3
              className="text-base font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              Average Score
            </h3>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              data.avgScore >= 70
                ? "bg-[var(--accent-light)] text-[var(--accent-primary)]"
                : "bg-[var(--color-gold-light)] text-[var(--color-gold)]"
            }`}>
              <TrendingUp className="h-3 w-3" />
              {getScoreLabel(data.avgScore)}
            </span>
          </div>
          <div className="flex items-center justify-center">
            <CircularProgress value={data.avgScore} />
          </div>

          {/* Additional stats */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[var(--bg-elevated)] p-2.5 text-center">
              <p className="text-sm font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading-cfg)" }}>
                {data.totalWordsLearned}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Words Learned</p>
            </div>
            <div className="rounded-lg bg-[var(--bg-elevated)] p-2.5 text-center">
              <p className="text-sm font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading-cfg)" }}>
                {data.totalCorrections}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Corrections</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Weekly Activity Chart ═══ */}
      <div className="mb-8">
        <WeeklyChart data={data.weeklyActivity} />
      </div>

      {/* ═══ Language Progress ═══ */}
      {data.languageProgress.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="text-base font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              Language Progress
            </h2>
            <span className="text-xs text-[var(--text-muted)]">
              {data.languageProgress.length} {data.languageProgress.length === 1 ? "language" : "languages"}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.languageProgress.map((lang) => (
              <LanguageCard key={lang.languagePair} lang={lang} />
            ))}
          </div>
        </div>
      )}

      {/* ═══ Level Progress ═══ */}
      <div className="mb-8">
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[var(--accent-primary)]" />
              <h3
                className="text-base font-semibold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                Level Progress
              </h3>
            </div>
            <span className="text-sm font-medium text-[var(--accent-primary)]">
              {data.levelProgress}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-700 ease-out"
              style={{ width: `${data.levelProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {data.levelProgress >= 80
              ? "Almost there! Keep pushing to the next level!"
              : data.levelProgress >= 50
                ? "Halfway there! Keep up the great work!"
                : data.levelProgress >= 25
                  ? "Good progress! Practice more to level up faster."
                  : "Just getting started! Every conversation counts."}
          </p>
        </div>
      </div>

      {/* ═══ Last Practice Info ═══ */}
      {data.lastPracticeAt && (
        <div className="mb-8">
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-secondary)]">
                Last practice:{" "}
                <span className="font-medium text-[var(--text-primary)]">
                  {new Date(data.lastPracticeAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Quick CTA ═══ */}
      <div className="mb-4">
        <div className="overflow-hidden rounded-2xl border-0 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] p-5 sm:p-6 text-white">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3
                className="mb-1 text-lg font-bold"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                Keep the momentum going!
              </h3>
              <p className="text-sm text-white/80">
                Practice daily to build your streak and improve your fluency score.
              </p>
            </div>
            <Link href="/learn">
              <Button className="gap-2 bg-white/20 text-white hover:bg-white/30 border-0 shrink-0">
                <MessageSquare className="h-4 w-4" />
                Start Practice
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
