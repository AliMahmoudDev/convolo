/**
 * useSpeech — TTS using server-side audio
 *
 * DEBUG MODE: On — logs every step to help trace issues.
 * Remove the console.log lines after debugging is complete.
 */

"use client";

import { useState, useCallback, useRef, useEffect, useContext, createContext } from "react";
import type { ReactNode } from "react";

// ═══════════════════════════════════════════
// Context (minimal — kept for backwards compat)
// ═══════════════════════════════════════════

const SpeechContext = createContext({ voicesReady: true });

export function SpeechProvider({ children }: { children: ReactNode }) {
  return <SpeechContext.Provider value={{ voicesReady: true }}>{children}</SpeechContext.Provider>;
}

// ═══════════════════════════════════════════
// Debug logger — easy to find in console
// ═══════════════════════════════════════════

const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) console.log("%c[🔊 TTS]", "color: #6366f1; font-weight: bold", ...args);
}

function logError(...args: any[]) {
  if (DEBUG) console.error("%c[🔊 TTS ERROR]", "color: #ef4444; font-weight: bold", ...args);
}

// ═══════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════

const LOAD_TIMEOUT_MS = 8000;

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.oncanplay = null;
      audioRef.current.onplay = null;
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (text: string, langCode: string = "en") => {
      log("━━━ speak() called ━━━");
      log("  text:", text);
      log("  langCode:", langCode);

      // ─── STEP 1: Stop anything currently playing ───
      cleanup();
      log("  ✓ Step 1: Cleaned up previous audio");

      // ─── STEP 2: Set speaking state ───
      setIsSpeaking(true);
      log("  ✓ Step 2: isSpeaking → true");

      // ─── STEP 3: Build URL ───
      const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(langCode)}`;
      log("  ✓ Step 3: URL =", url);

      // ─── STEP 4: Safety timeout ───
      timeoutRef.current = setTimeout(() => {
        logError("  ⏰ TIMEOUT — audio didn't load within", LOAD_TIMEOUT_MS, "ms");
        logError("  → This means /api/tts is not responding or audio can't play");
        cleanup();
        setIsSpeaking(false);
      }, LOAD_TIMEOUT_MS);
      log("  ✓ Step 4: Safety timeout set");

      // ─── STEP 5: Create Audio element ───
      const audio = new Audio();
      audioRef.current = audio;
      log("  ✓ Step 5: Audio element created");

      // ─── STEP 6: Wire up event listeners ───
      audio.onplay = () => {
        log("  🎵 Step 6: onplay fired — AUDIO IS PLAYING!");
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      audio.oncanplay = () => {
        log("  ✓ Step 6: oncanplay fired — audio is ready to play");
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      audio.onended = () => {
        log("  ✓ onended — playback finished");
        setIsSpeaking(false);
      };

      audio.onerror = (e) => {
        logError("  ❌ onerror — audio element error!");
        logError("  → Error event:", e);
        logError("  → audio.src:", audio.src);
        logError("  → audio.error:", audio.error);
        if (audio.error) {
          logError("  → Error code:", audio.error.code, "Message:", audio.error.message);
          // Error codes: 1=MEDIA_ERR_ABORTED, 2=MEDIA_ERR_NETWORK, 3=MEDIA_ERR_DECODE, 4=MEDIA_ERR_SRC_NOT_SUPPORTED
          const codes: Record<number, string> = {
            1: "ABORTED — playback was aborted",
            2: "NETWORK — network error while downloading",
            3: "DECODE — audio format decode error",
            4: "SRC_NOT_SUPPORTED — audio format not supported",
          };
          logError("  → Meaning:", codes[audio.error.code] || "Unknown");
        }
        cleanup();
        setIsSpeaking(false);
      };

      log("  ✓ Step 6: Event listeners attached (onplay, oncanplay, onended, onerror)");

      // ─── STEP 7: Set source and play ───
      audio.src = url;
      log("  ✓ Step 7a: audio.src set");

      log("  ⏳ Step 7b: Calling audio.play()...");
      audio
        .play()
        .then(() => {
          log("  ✓ Step 7b: play() promise resolved — playback started!");
        })
        .catch((err) => {
          logError("  ❌ Step 7b: play() promise REJECTED!");
          logError("  → Error name:", err?.name);
          logError("  → Error message:", err?.message);
          // Common errors:
          // NotAllowedError → browser blocked autoplay (user must interact first)
          // NotSupportedError → audio format not supported
          // AbortError → play() was interrupted by stop()
          if (err?.name === "NotAllowedError") {
            logError("  → CAUSE: Browser blocked audio. User needs to interact with page first.");
          } else if (err?.name === "NotSupportedError") {
            logError("  → CAUSE: Audio format not supported by this browser.");
          }
          cleanup();
          setIsSpeaking(false);
        });

      log("━━━ speak() finished setting up ━━━");
    },
    [cleanup]
  );

  const stop = useCallback(() => {
    log("stop() called — stopping playback");
    cleanup();
    setIsSpeaking(false);
  }, [cleanup]);

  return { speak, stop, isSpeaking, voicesReady: true };
}
