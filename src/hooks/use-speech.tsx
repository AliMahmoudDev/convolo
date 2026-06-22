/**
 * useSpeech — Production-grade TTS for React
 *
 * Architecture (simple & reliable):
 * ──────────────────────────────────
 * 1. PRIMARY: Server-side TTS via /api/tts (z-ai-web-dev-sdk)
 *    - Works for ALL languages (French, Arabic, Spanish, etc.)
 *    - Consistent quality across browsers
 *    - Server-side caching for repeated words
 *
 * 2. FALLBACK: Web Speech API (browser built-in)
 *    - Used only if server TTS fails
 *    - Works reliably for English (local voices)
 *    - Unreliable for other languages (network voices fail silently)
 *
 * Why this approach:
 * - Duolingo, Babbel, and all production language apps use server-side TTS
 * - Web Speech API is only reliable for English local voices
 * - Server TTS adds ~200ms latency but guarantees all languages work
 */

"use client";

import { useState, useCallback, useRef, useEffect, useContext, createContext } from "react";
import type { ReactNode } from "react";

// ═══════════════════════════════════════════
// Context — tracks if voices are loaded (for Web Speech fallback)
// ═══════════════════════════════════════════

interface SpeechContextValue {
  voicesReady: boolean;
}

const SpeechContext = createContext<SpeechContextValue>({ voicesReady: false });

export function SpeechProvider({ children }: { children: ReactNode }) {
  const [voicesReady, setVoicesReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const check = () => {
      if (window.speechSynthesis.getVoices().length > 0) setVoicesReady(true);
    };
    check();
    window.speechSynthesis.addEventListener("voiceschanged", check);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", check);
  }, []);

  return <SpeechContext.Provider value={{ voicesReady }}>{children}</SpeechContext.Provider>;
}

// ═══════════════════════════════════════════
// Language tag mapping (for Web Speech fallback)
// ═══════════════════════════════════════════

const LANG_TAGS: Record<string, string> = {
  en: "en-US",
  ar: "ar-SA",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  pt: "pt-BR",
  it: "it-IT",
  ru: "ru-RU",
  hi: "hi-IN",
  tr: "tr-TR",
};

// ═══════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════

export function useSpeech() {
  const { voicesReady } = useContext(SpeechContext);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isActiveRef = useRef(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopAll = useCallback(() => {
    // Stop HTML5 Audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    // Stop Web Speech
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isActiveRef.current = false;
    setIsSpeaking(false);
  }, []);

  /**
   * Web Speech API fallback — used only when server TTS fails.
   * Only reliable for English (local voices).
   */
  const speakWithWebSpeech = useCallback((text: string, langCode: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_TAGS[langCode] || `${langCode}-${langCode.toUpperCase()}`;
    utterance.rate = 0.85;
    utterance.volume = 1;

    // Try to find a local voice
    const voices = window.speechSynthesis.getVoices();
    const localVoice = voices.find(
      (v) => v.localService && (v.lang === utterance.lang || v.lang.startsWith(langCode + "-"))
    );
    if (localVoice) utterance.voice = localVoice;

    utterance.onend = () => {
      isActiveRef.current = false;
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      isActiveRef.current = false;
      setIsSpeaking(false);
    };

    requestAnimationFrame(() => {
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const speak = useCallback(
    (text: string, langCode: string = "en") => {
      // Stop any current playback
      stopAll();

      // Optimistic UI
      setIsSpeaking(true);
      isActiveRef.current = true;

      // ─── PRIMARY: Server-side TTS ───
      const audio = new Audio();
      audioRef.current = audio;

      const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(langCode)}`;

      audio.onended = () => {
        isActiveRef.current = false;
        setIsSpeaking(false);
      };

      audio.onerror = () => {
        // Server TTS failed — fall back to Web Speech API
        console.warn("[useSpeech] Server TTS failed, falling back to Web Speech API");
        if (audioRef.current === audio) audioRef.current = null;
        speakWithWebSpeech(text, langCode);
      };

      audio.src = url;

      audio.play().catch(() => {
        // play() failed — fall back to Web Speech API
        console.warn("[useSpeech] Audio play() failed, falling back to Web Speech API");
        if (audioRef.current === audio) audioRef.current = null;
        speakWithWebSpeech(text, langCode);
      });
    },
    [stopAll, speakWithWebSpeech]
  );

  const stop = useCallback(() => {
    stopAll();
  }, [stopAll]);

  return { speak, stop, isSpeaking, voicesReady };
}
