/**
 * ChatInput — The message input area at the bottom of the conversation.
 *
 * Design decisions:
 * - Auto-resizing textarea (grows with content, up to a max height)
 * - Send on Enter (Shift+Enter for new line)
 * - Character counter (max 2000)
 * - Disabled state when AI is thinking or conversation ended
 * - Clear input after sending
 * - Focus input after AI responds so user can keep typing
 */

"use client";

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  /** Whether the AI is currently processing a message */
  isSending: boolean;
  /** Whether the conversation has ended */
  isEnded: boolean;
  /** Callback when user sends a message */
  onSend: (content: string) => Promise<void>;
}

const MAX_CHARS = 2000;

export function ChatInput({ isSending, isEnded, onSend }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDisabled = isSending || isEnded;
  const charCount = input.length;
  const isOverLimit = charCount > MAX_CHARS;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [input]);

  // Focus input after AI responds
  useEffect(() => {
    if (!isSending && !isEnded) {
      textareaRef.current?.focus();
    }
  }, [isSending, isEnded]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isDisabled || isOverLimit) return;

    setInput("");
    await onSend(trimmed);
  }, [input, isDisabled, isOverLimit, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  if (isEnded) {
    return (
      <div className="border-t border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3">
        <p className="text-center text-sm text-[var(--text-muted)]">
          This conversation has ended. Start a new one from the Practice page.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3">
      <div className="flex items-end gap-2">
        {/* Textarea */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isSending ? "AI is thinking..." : "Type your message..."}
            disabled={isDisabled}
            rows={1}
            className="w-full resize-none rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          {/* Character counter */}
          {charCount > MAX_CHARS * 0.8 && (
            <span
              className={`absolute right-3 bottom-1 text-[10px] ${
                isOverLimit ? "text-[var(--state-error)]" : "text-[var(--text-muted)]"
              }`}
            >
              {charCount}/{MAX_CHARS}
            </span>
          )}
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isDisabled || isOverLimit}
          className="h-10 w-10 shrink-0 rounded-xl bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
