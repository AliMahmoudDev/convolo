/**
 * useSpeech — TTS using server-side audio with Web Audio API playback
 *
 * Web Audio API decodeAudioData() supports MP3 on ALL browsers (including mobile).
 * Server returns MP3 audio from Google Translate TTS.
 */

"use client";

import { useState, useCallback, useRef, useEffect, useContext, createContext } from "react";
import type { ReactNode } from "react";

// ═══════════════════════════════════════════
// Context
// ═══════════════════════════════════════════

const SpeechContext = createContext({ voicesReady: true });

export function SpeechProvider({ children }: { children: ReactNode }) {
  return <SpeechContext.Provider value={{ voicesReady: true }}>{children}</SpeechContext.Provider>;
}

// ═══════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════

const LOAD_TIMEOUT_MS = 10000;

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
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
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {}
      try {
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (text: string, langCode: string = "en") => {
      cleanup();
      setIsSpeaking(true);

      // Safety timeout
      timeoutRef.current = setTimeout(() => {
        cleanup();
        setIsSpeaking(false);
      }, LOAD_TIMEOUT_MS);

      const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(langCode)}`;

      fetch(url)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.arrayBuffer();
        })
        .then((arrayBuffer) => {
          // Create AudioContext if needed
          if (!audioContextRef.current) {
            audioContextRef.current = new (
              window.AudioContext || (window as any).webkitAudioContext
            )();
          }
          const ctx = audioContextRef.current;

          // Resume if suspended (mobile browsers require user interaction)
          if (ctx.state === "suspended") {
            ctx.resume();
          }

          // Decode the audio data — works with MP3 on ALL browsers
          return ctx.decodeAudioData(arrayBuffer);
        })
        .then((audioBuffer) => {
          // Clear timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          const ctx = audioContextRef.current!;

          // Create and play source
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          sourceRef.current = source;

          source.onended = () => {
            setIsSpeaking(false);
          };

          source.start(0);
        })
        .catch(() => {
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
