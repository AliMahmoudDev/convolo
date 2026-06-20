/**
 * ConversationSummary — Dialog shown when a conversation ends.
 *
 * Design decisions:
 * - Full-screen modal (Dialog) with celebration-style scoring
 * - Score displayed as a large number with color-coded rating
 * - Stats in a grid: messages, corrections, vocabulary, duration
 * - "Start New Conversation" button that goes back to /learn
 * - Star animation for excellent scores
 * - Uses shadcn Dialog component for accessibility
 */

"use client";

import { useRouter } from "next/navigation";
import { Trophy, MessageSquare, AlertCircle, BookOpen, Clock, Star, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { EndConversationResponse } from "@/types/conversation";

interface ConversationSummaryProps {
  /** Whether the summary dialog is open */
  open: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** The summary data from the API */
  summary: EndConversationResponse | null;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-[var(--color-gold)]";
  if (score >= 70) return "text-[var(--state-success)]";
  if (score >= 50) return "text-[var(--state-warning)]";
  return "text-[var(--state-error)]";
}

function getScoreLabel(rating: string): string {
  switch (rating) {
    case "excellent":
      return "Excellent!";
    case "good":
      return "Good job!";
    case "needs_improvement":
      return "Keep practicing!";
    case "poor":
      return "Don't give up!";
    default:
      return "Session complete";
  }
}

export function ConversationSummary({ open, onClose, summary }: ConversationSummaryProps) {
  const router = useRouter();

  if (!summary) return null;

  const scoreColor = getScoreColor(summary.overallScore);
  const isExcellent = summary.overallScore >= 90;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl border-[var(--border-default)] bg-[var(--bg-surface)] p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Conversation Summary</DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {/* Score display */}
          <div className="mb-6 text-center">
            <div className="relative mb-3 inline-block">
              {isExcellent && (
                <Star className="absolute -top-3 -right-3 h-8 w-8 fill-[var(--color-gold)] text-[var(--color-gold)]" />
              )}
              <Trophy className={`mx-auto h-16 w-16 ${scoreColor}`} />
            </div>
            <div
              className={`text-5xl font-bold ${scoreColor}`}
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              {summary.overallScore}
            </div>
            <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
              {getScoreLabel(summary.scoreRating)}
            </p>
          </div>

          {/* Stats grid */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] p-3 text-center">
              <MessageSquare className="mx-auto mb-1 h-5 w-5 text-[var(--accent-primary)]" />
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {summary.totalMessages}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Messages</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] p-3 text-center">
              <AlertCircle className="mx-auto mb-1 h-5 w-5 text-[var(--state-warning)]" />
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {summary.correctionsCount}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Corrections</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] p-3 text-center">
              <BookOpen className="mx-auto mb-1 h-5 w-5 text-[var(--state-success)]" />
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {summary.newVocabularyCount}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">New Words</p>
            </div>
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] p-3 text-center">
              <Clock className="mx-auto mb-1 h-5 w-5 text-[var(--accent-secondary)]" />
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {summary.durationMinutes}m
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Duration</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              onClick={() => {
                onClose();
                router.push("/learn");
              }}
              className="gradient-conbolo h-11 w-full rounded-xl border-0 text-sm font-semibold text-white hover:opacity-90"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Start New Conversation
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="h-10 w-full rounded-xl border-[var(--border-default)] text-sm text-[var(--text-secondary)]"
            >
              Review Conversation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
