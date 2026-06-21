"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  MessageSquare,
  BarChart3,
  DollarSign,
  TrendingUp,
  Clock,
  Crown,
  UserPlus,
  ArrowRight,
  Loader2,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsData {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
  activeUsersThisMonth: number;
  proUsers: number;
  freeUsers: number;
  activeProSubscriptions: number;
  recentSignups: {
    id: string;
    name: string;
    email: string;
    nativeLanguage: string;
    targetLanguage: string | null;
    proficiencyLevel: string;
    plan: string;
    status: string;
    createdAt: string;
  }[];
}

const statCards = [
  {
    key: "totalUsers" as const,
    label: "Total Users",
    icon: Users,
    color: "text-[var(--accent-primary)]",
    bgColor: "bg-[var(--accent-light)]",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "totalConversations" as const,
    label: "Conversations",
    icon: MessageSquare,
    color: "text-[var(--accent-secondary)]",
    bgColor: "bg-[var(--accent-secondary-light)]",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "totalMessages" as const,
    label: "Messages",
    icon: BarChart3,
    color: "text-[var(--color-gold)]",
    bgColor: "bg-[var(--color-gold-light)]",
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "activeProSubscriptions" as const,
    label: "Active Pro Subs",
    icon: Crown,
    color: "text-[var(--state-success)]",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    format: (v: number) => v.toLocaleString(),
  },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPlanBadge(plan: string) {
  if (plan === "free") {
    return (
      <span className="inline-flex items-center rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
        Free
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent-primary)]">
      <Crown className="h-3 w-3" />
      Pro
    </span>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.error?.message || "Failed to fetch stats");
        }
      } catch {
        setError("Network error — failed to fetch stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <AlertTriangle className="h-10 w-10 text-[var(--state-warning)]" />
        <p className="text-sm text-[var(--text-secondary)]">{error}</p>
        <p className="text-xs text-[var(--text-muted)]">
          Make sure you are logged in as an admin user.
        </p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Platform overview and key metrics
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-[var(--text-muted)]">{card.label}</p>
                <div className={cn("rounded-lg p-2", card.bgColor)}>
                  <Icon className={cn("h-4 w-4", card.color)} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">
                {card.format(stats[card.key])}
              </p>
            </div>
          );
        })}
      </div>

      {/* Active users + Plan breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Active Users */}
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[var(--accent-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Active Users</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-secondary)]">Today</span>
              </div>
              <span className="text-lg font-bold text-[var(--text-primary)]">
                {stats.activeUsersToday}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-secondary)]">This Week</span>
              </div>
              <span className="text-lg font-bold text-[var(--text-primary)]">
                {stats.activeUsersThisWeek}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-secondary)]">This Month</span>
              </div>
              <span className="text-lg font-bold text-[var(--text-primary)]">
                {stats.activeUsersThisMonth}
              </span>
            </div>
          </div>
        </div>

        {/* Plan Breakdown */}
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
          <div className="mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[var(--color-gold)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Plan Breakdown</h2>
          </div>
          <div className="space-y-4">
            {/* Free */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Free Users</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {stats.freeUsers}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                <div
                  className="h-full rounded-full bg-[var(--bg-elevated)] transition-all"
                  style={{
                    width: `${stats.totalUsers > 0 ? (stats.freeUsers / stats.totalUsers) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            {/* Pro */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Pro Users</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {stats.proUsers}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                <div
                  className="h-full rounded-full bg-[var(--accent-primary)] transition-all"
                  style={{
                    width: `${stats.totalUsers > 0 ? (stats.proUsers / stats.totalUsers) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Signups */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] px-5 py-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[var(--accent-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Signups</h2>
          </div>
          <Link
            href="/admin/users"
            className="flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] hover:underline"
          >
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {stats.recentSignups.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
            No users yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-default)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)]">
                    Name
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)]">
                    Email
                  </th>
                  <th className="hidden px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] sm:table-cell">
                    Languages
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)]">
                    Plan
                  </th>
                  <th className="hidden px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)] md:table-cell">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentSignups.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[var(--border-default)] last:border-0"
                  >
                    <td className="px-5 py-3 text-sm font-medium text-[var(--text-primary)]">
                      {user.name}
                    </td>
                    <td className="px-5 py-3 text-sm text-[var(--text-secondary)]">
                      {user.email}
                    </td>
                    <td className="hidden px-5 py-3 text-sm text-[var(--text-secondary)] sm:table-cell">
                      {user.nativeLanguage}
                      {user.targetLanguage ? ` → ${user.targetLanguage}` : ""}
                    </td>
                    <td className="px-5 py-3">{getPlanBadge(user.plan)}</td>
                    <td className="hidden px-5 py-3 text-sm text-[var(--text-muted)] md:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/users"
          className="group flex items-center gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-all hover:border-[var(--accent-primary)] hover:shadow-md"
        >
          <div className="rounded-lg bg-[var(--accent-light)] p-3">
            <Users className="h-6 w-6 text-[var(--accent-primary)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Manage Users</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Search, filter, and update user plans
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/admin/scenarios"
          className="group flex items-center gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-all hover:border-[var(--accent-primary)] hover:shadow-md"
        >
          <div className="rounded-lg bg-[var(--accent-secondary-light)] p-3">
            <BookOpen className="h-6 w-6 text-[var(--accent-secondary)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Manage Scenarios</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Create, edit, and publish conversation scenarios
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
