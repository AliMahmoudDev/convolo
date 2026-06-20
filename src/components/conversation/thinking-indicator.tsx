/**
 * ThinkingIndicator — Animated dots shown while the AI is processing.
 *
 * Simple and clean — three bouncing dots with a subtle animation.
 * Uses Tailwind's animate-bounce with staggered delays.
 */

"use client";

export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2.5">
      {/* Bot avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-light)] text-[var(--accent-primary)]">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M9 15v.01" />
          <path d="M15 15v.01" />
          <path d="M8 20h8" />
          <path d="M12 20v2" />
        </svg>
      </div>

      {/* Bouncing dots */}
      <div className="rounded-2xl rounded-tl-sm bg-[var(--chat-ai-bg)] px-4 py-3">
        <div className="flex items-center gap-1">
          <span
            className="h-2 w-2 rounded-full bg-[var(--text-muted)]"
            style={{ animation: "bounce 1.4s infinite ease-in-out" }}
          />
          <span
            className="h-2 w-2 rounded-full bg-[var(--text-muted)]"
            style={{ animation: "bounce 1.4s infinite ease-in-out 0.2s" }}
          />
          <span
            className="h-2 w-2 rounded-full bg-[var(--text-muted)]"
            style={{ animation: "bounce 1.4s infinite ease-in-out 0.4s" }}
          />
        </div>
      </div>
    </div>
  );
}
