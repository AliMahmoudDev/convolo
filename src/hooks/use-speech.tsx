/**
 * useSpeech — Dead simple TTS using server-side audio
 *
 * No Web Speech API. No browser voice detection. No Chrome bugs.
 * Just: click → fetch audio from server → play it.
 *
 * Same approach as Duolingo, Babbel, Google Translate.
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
// Hook
// ═══════════════════════════════════════════

/** Max time to wait for audio before giving up */
const LOAD_TIMEOUT_MS = 8000;

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
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
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load(); // release resource
      audioRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (text: string, langCode: string = "en") => {
      // Stop anything currently playing
      cleanup();

      // Optimistic UI
      setIsSpeaking(true);

      // Safety timeout — if audio doesn't start within N seconds, reset
      timeoutRef.current = setTimeout(() => {
        console.warn("[useSpeech] Timeout — audio didn't load");
        cleanup();
        setIsSpeaking(false);
      }, LOAD_TIMEOUT_MS);

      // Create fresh audio element
      const audio = new Audio();
      audioRef.current = audio;

      const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(langCode)}`;

      audio.onended = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setIsSpeaking(false);
      };

      audio.onerror = () => {
        console.warn("[useSpeech] Audio error");
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setIsSpeaking(false);
      };

      // When audio starts playing, clear the safety timeout
      audio.oncanplay = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      audio.src = url;
      audio.play().catch((err) => {
        console.warn("[useSpeech] play() failed:", err?.message || err);
        cleanup();
        setIsSpeaking(false);
      });
    },
    [cleanup]
  );

  const stop = useCallback(() => {
    cleanup();
    setIsSpeaking(false);
  }, [cleanup]);

  return { speak, stop, isSpeaking, voicesReady: true };
}
