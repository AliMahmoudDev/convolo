/**
 * useSpeech — TTS using server-side audio with Web Audio API playback
 *
 * Web Audio API decodeAudioData() supports MP3 on ALL browsers (including mobile).
 * Server returns MP3 audio from Google Translate TTS.
 *
 * Speed options:
 *   0.5 — Slow (good for learners)
 *   0.7 — Slightly slow
 *   1.0 — Normal (default)
 *   1.3 — Slightly fast
 *   1.5 — Fast
 */

"use client";

import { useState, useCallback, useRef, useEffect, useContext, createContext } from "react";
import type { ReactNode } from "react";

// ═══════════════════════════════════════════
// Context — shared speech speed setting
// ═══════════════════════════════════════════

export type SpeechSpeed = 0.5 | 0.7 | 1.0 | 1.3 | 1.5;

interface SpeechContextType {
  voicesReady: true;
  speed: SpeechSpeed;
  setSpeed: (speed: SpeechSpeed) => void;
}

const SpeechContext = createContext<SpeechContextType>({
  voicesReady: true,
  speed: 1.0,
  setSpeed: () => {},
});

export function SpeechProvider({ children }: { children: ReactNode }) {
  const [speed, setSpeed] = useState<SpeechSpeed>(1.0);
  return (
    <SpeechContext.Provider value={{ voicesReady: true, speed, setSpeed }}>
      {children}
    </SpeechContext.Provider>
  );
}

export function useSpeechSpeed() {
  // Read from context — but since we don't always have a provider,
  // fallback to localStorage
  const [speed, setSpeedState] = useState<SpeechSpeed>(() => {
    if (typeof window === "undefined") return 1.0;
    const saved = localStorage.getItem("tts-speed");
    if (saved) {
      const parsed = parseFloat(saved);
      if ([0.5, 0.7, 1.0, 1.3, 1.5].includes(parsed)) return parsed as SpeechSpeed;
    }
    return 1.0;
  });

  const setSpeed = useCallback((newSpeed: SpeechSpeed) => {
    setSpeedState(newSpeed);
    if (typeof window !== "undefined") {
      localStorage.setItem("tts-speed", String(newSpeed));
    }
  }, []);

  return { speed, setSpeed };
}

// ═══════════════════════════════════════════
// Speed labels for UI
// ═══════════════════════════════════════════

export const SPEED_OPTIONS: { value: SpeechSpeed; label: string; labelAr: string }[] = [
  { value: 0.5, label: "Slow", labelAr: "بطيء" },
  { value: 0.7, label: "Slightly slow", labelAr: "بطيء شوية" },
  { value: 1.0, label: "Normal", labelAr: "عادي" },
  { value: 1.3, label: "Slightly fast", labelAr: "سريع شوية" },
  { value: 1.5, label: "Fast", labelAr: "سريع" },
];

// ═══════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════

const LOAD_TIMEOUT_MS = 15000;

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { speed } = useSpeechSpeed();

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

      const params = new URLSearchParams({
        text: text,
        lang: langCode,
      });

      // Only add speed param if not default
      if (speed !== 1.0) {
        params.set("speed", String(speed));
      }

      const url = `/api/tts?${params.toString()}`;

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
    [cleanup, speed]
  );

  const stop = useCallback(() => {
    cleanup();
    setIsSpeaking(false);
  }, [cleanup]);

  return { speak, stop, isSpeaking, voicesReady: true };
}
