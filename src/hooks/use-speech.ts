/**
 * useSpeech — Text-to-Speech hook using the Web Speech API
 *
 * Architecture:
 * ────────────
 * - Voices are loaded ONCE globally and cached (singleton pattern)
 * - No pending queues — speak() works immediately or falls back gracefully
 * - Each hook instance gets its own isSpeaking state
 * - Cancel on unmount to prevent ghost audio
 *
 * Voice Loading Strategy:
 * ──────────────────────
 * 1. On first import, trigger voice loading via getVoices()
 * 2. Listen for voiceschanged event to populate cache
 * 3. Once loaded, all subsequent speak() calls are instant
 * 4. If voices not loaded yet, speak with lang tag only (browser default)
 *
 * This is the production-safe approach — no queues, no race conditions,
 * no memory leaks from pending refs.
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ═══════════════════════════════════════════
// Global Voice Cache (singleton — shared across all hook instances)
// ═══════════════════════════════════════════

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;
let voicesLoadInitiated = false;

/**
 * Initialize voice loading. Call once on app mount.
 * This triggers the browser to start loading voices.
 */
function initVoiceLoading() {
  if (typeof window === "undefined" || !window.speechSynthesis || voicesLoadInitiated) return;
  voicesLoadInitiated = true;

  // Try to get voices synchronously (some browsers have them immediately)
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    cachedVoices = voices;
    voicesLoaded = true;
    return;
  }

  // Voices load async — wait for the event
  const handleVoicesChanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
    if (cachedVoices.length > 0) {
      voicesLoaded = true;
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    }
  };

  window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
}

// Auto-init on module load (runs once)
if (typeof window !== "undefined") {
  // Use requestIdleCallback for non-blocking init, fallback to setTimeout
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(() => initVoiceLoading());
  } else {
    setTimeout(initVoiceLoading, 100);
  }
}

// ═══════════════════════════════════════════
// Language Mapping
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

function getSpeechLang(code: string): string {
  return LANG_TAGS[code] || `${code}-${code.toUpperCase()}`;
}

// ═══════════════════════════════════════════
// Voice Selection (deterministic, no side effects)
// ═══════════════════════════════════════════

function scoreVoice(voice: SpeechSynthesisVoice, langCode: string): number {
  const targetTag = getSpeechLang(langCode);
  const voiceLang = voice.lang;

  // Exact BCP 47 match: "ar-SA" === "ar-SA"
  if (voiceLang === targetTag) return 100;

  // Same language, different region: "ar-EG" starts with "ar-"
  if (voiceLang.startsWith(langCode + "-")) return 80;

  // Loose partial match (rare but possible)
  if (voiceLang.startsWith(langCode)) return 60;

  return 0;
}

function findBestVoice(langCode: string): SpeechSynthesisVoice | null {
  if (cachedVoices.length === 0) return null;

  let bestVoice: SpeechSynthesisVoice | null = null;
  let bestScore = 0;

  for (const voice of cachedVoices) {
    const score = scoreVoice(voice, langCode);
    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    } else if (score === bestScore && bestVoice && score > 0) {
      // Prefer cloud/network voices — they sound much better
      if (!voice.localService && bestVoice.localService) {
        bestVoice = voice;
      }
    }
  }

  return bestVoice;
}

// ═══════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    };
  }, []);

  const speak = useCallback((text: string, langCode: string = "en") => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel any ongoing speech from this hook
    window.speechSynthesis.cancel();

    // Try to refresh voice cache if not loaded yet
    if (!voicesLoaded) {
      const freshVoices = window.speechSynthesis.getVoices();
      if (freshVoices.length > 0) {
        cachedVoices = freshVoices;
        voicesLoaded = true;
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getSpeechLang(langCode);
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Set voice from cache (instant — no async waiting)
    const voice = findBestVoice(langCode);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, stop, isSpeaking };
}
