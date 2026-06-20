import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Vocabulary — Convolo",
  description: "Review and manage your learned vocabulary with spaced repetition.",
};

export default function VocabularyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-8">
        <h1
          className="mb-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Vocabulary Book
        </h1>
        <p className="text-[var(--text-secondary)]">
          Words you encounter in conversations are automatically saved here for review
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-12 text-center">
        <BookOpen className="mx-auto mb-4 h-12 w-12 text-[var(--text-muted)]" />
        <h3
          className="mb-2 text-lg font-semibold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          No words yet
        </h3>
        <p className="mx-auto max-w-md text-sm text-[var(--text-secondary)]">
          Start a conversation and words you encounter will be automatically added to your
          vocabulary book. Practice them with spaced repetition to make them stick forever.
        </p>
      </div>
    </div>
  );
}
