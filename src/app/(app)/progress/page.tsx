import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Progress — Convolo",
  description: "Track your language learning progress, streaks, and achievements.",
};

export default function ProgressPage() {
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

      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-12 text-center">
        <BarChart3 className="mx-auto mb-4 h-12 w-12 text-[var(--text-muted)]" />
        <h3
          className="mb-2 text-lg font-semibold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          No progress data yet
        </h3>
        <p className="mx-auto max-w-md text-sm text-[var(--text-secondary)]">
          Complete your first conversation to start tracking your learning progress. You will see
          detailed analytics including fluency score, streaks, and vocabulary growth over time.
        </p>
      </div>
    </div>
  );
}
