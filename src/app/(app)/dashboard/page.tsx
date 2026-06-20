import Link from "next/link";
import {
  MessageSquare,
  BookOpen,
  Flame,
  Crown,
  ArrowRight,
  Zap,
  Target,
  Trophy,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  {
    label: "Conversations",
    value: "0",
    icon: MessageSquare,
    color: "text-[var(--accent-primary)]",
    bgColor: "bg-[var(--accent-light)]",
  },
  {
    label: "Words Learned",
    value: "0",
    icon: BookOpen,
    color: "text-[var(--accent-secondary)]",
    bgColor: "bg-[var(--accent-secondary-light)]",
  },
  {
    label: "Day Streak",
    value: "0",
    icon: Flame,
    color: "text-[var(--color-gold)]",
    bgColor: "bg-[var(--color-gold-light)]",
  },
  {
    label: "XP Points",
    value: "0",
    icon: Zap,
    color: "text-[var(--state-success)]",
    bgColor: "bg-[var(--bg-elevated)]",
  },
];

const quickActions = [
  {
    label: "Free Chat",
    description: "Practice casual conversation on any topic",
    icon: MessageSquare,
    href: "/learn",
    gradient: true,
  },
  {
    label: "Daily Challenge",
    description: "Complete today's conversation challenge",
    icon: Target,
    href: "/learn",
    gradient: false,
  },
  {
    label: "Review Words",
    description: "Practice vocabulary with spaced repetition",
    icon: BookOpen,
    href: "/vocabulary",
    gradient: false,
  },
];

const scenarios = [
  {
    title: "Ordering at a Restaurant",
    category: "Daily",
    difficulty: "Beginner",
    language: "Arabic",
    premium: false,
  },
  {
    title: "At the Airport",
    category: "Travel",
    difficulty: "Beginner",
    language: "Arabic",
    premium: false,
  },
  {
    title: "Coffee Shop Chat",
    category: "Social",
    difficulty: "Beginner",
    language: "Spanish",
    premium: false,
  },
  {
    title: "Business Meeting",
    category: "Business",
    difficulty: "Intermediate",
    language: "Arabic",
    premium: true,
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1
          className="mb-1 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Welcome to Convolo 👋
        </h1>
        <p className="text-[var(--text-secondary)]">
          Start a conversation to begin your daily practice
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5"
          >
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-lg ${stat.bgColor} flex items-center justify-center`}
              >
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

      {/* Quick Actions */}
      <div className="mb-8">
        <h2
          className="mb-4 text-lg font-semibold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Quick Start
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`group relative rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 ${
                action.gradient
                  ? "gradient-conbolo border-0 text-white"
                  : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]/30"
              }`}
            >
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
                  action.gradient ? "bg-white/20" : "bg-[var(--accent-light)]"
                }`}
              >
                <action.icon
                  className={`h-5 w-5 ${
                    action.gradient ? "text-white" : "text-[var(--accent-primary)]"
                  }`}
                />
              </div>
              <h3
                className={`mb-1 font-semibold ${
                  action.gradient ? "text-white" : "text-[var(--text-primary)]"
                }`}
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                {action.label}
              </h3>
              <p
                className={`text-sm ${
                  action.gradient ? "text-white/70" : "text-[var(--text-secondary)]"
                }`}
              >
                {action.description}
              </p>
              <ArrowRight
                className={`absolute top-5 right-5 h-4 w-4 transition-transform group-hover:translate-x-1 ${
                  action.gradient ? "text-white/60" : "text-[var(--text-muted)]"
                }`}
              />
            </Link>
          ))}
        </div>
      </div>

      {/* Scenarios */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-lg font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Conversation Scenarios
          </h2>
          <Link
            href="/learn"
            className="text-sm font-medium text-[var(--accent-primary)] transition-colors hover:text-[var(--accent-hover)]"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {scenarios.map((scenario) => (
            <div
              key={scenario.title}
              className="group relative rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-all duration-300 hover:border-[var(--accent-primary)]/30 hover:shadow-[var(--shadow-md)]"
            >
              {scenario.premium && (
                <span className="gradient-conbolo absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white">
                  <Crown className="h-3 w-3" />
                  Pro
                </span>
              )}
              <span className="mb-3 inline-flex items-center rounded-full bg-[var(--accent-light)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--accent-primary)]">
                {scenario.category}
              </span>
              <h3
                className="mb-1.5 pr-8 text-sm font-semibold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                {scenario.title}
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                <span>{scenario.language}</span>
                <span>·</span>
                <span>{scenario.difficulty}</span>
              </div>
              <Button
                size="sm"
                variant={scenario.premium ? "outline" : "default"}
                className={`mt-4 h-8 w-full rounded-lg text-xs ${
                  scenario.premium
                    ? "border-[var(--accent-primary)]/30 text-[var(--accent-primary)]"
                    : "gradient-conbolo border-0 text-white"
                }`}
              >
                <Play className="mr-1 h-3 w-3" />
                {scenario.premium ? "Upgrade" : "Start"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements preview */}
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
            className="text-sm font-medium text-[var(--accent-primary)] transition-colors hover:text-[var(--accent-hover)]"
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
    </div>
  );
}
