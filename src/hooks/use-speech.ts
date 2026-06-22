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
 * Chrome Bug Workarounds:
 * ───────────────────────
 * - Chrome pauses speechSynthesis after cancel() → call resume() after cancel
 * - Chrome loses utterance events after rapid cancel/speak → add micro-delay
 * - Chrome stops speaking after ~15s → resume() timer workaround
 * - getVoices() returns [] on first call → global cache with voiceschanged listener
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ═══════════════════════════════════════════
// Global Voice Cache (singleton — shared across all hook instances)
// ═══════════════════════════════════════════

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;
let voicesLoadInitiated = false;

function initVoiceLoading() {
  if (typeof window === "undefined" || !window.speechSynthesis || voicesLoadInitiated) return;
  voicesLoadInitiated = true;

  // Try synchronous (some browsers have voices immediately)
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    cachedVoices = voices;
    voicesLoaded = true;
    return;
  }

  // Wait for async load
  const handleVoicesChanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
    if (cachedVoices.length > 0) {
      voicesLoaded = true;
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    }
  };

  window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
}

// Auto-init on module load (non-blocking)
if (typeof window !== "undefined") {
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

  if (voiceLang === targetTag) return 100;
  if (voiceLang.startsWith(langCode + "-")) return 80;
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
      if (!voice.localService && bestVoice.localService) {
        bestVoice = voice;
      }
    }
  }

  return bestVoice;
}

/**
 * Cancel speech and fix Chrome's paused state.
 * Chrome bug: after cancel(), the synth engine stays paused.
 * Calling resume() unblocks it for the next speak() call.
 */
function cancelAndResume() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  // Chrome fix: cancel() pauses the engine — resume() unblocks it
  window.speechSynthesis.resume();
}

// ═══════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const resumeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        cancelAndResume();
        setIsSpeaking(false);
      }
      // Clear Chrome long-speech timer
      if (resumeTimerRef.current) {
        clearInterval(resumeTimerRef.current);
      }
    };
  }, []);

  const speak = useCallback((text: string, langCode: string = "en") => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel any ongoing speech + fix Chrome paused state
    cancelAndResume();

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

    // Set voice from cache
    const voice = findBestVoice(langCode);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      // Chrome bug workaround: speech pauses after ~15 seconds
      // Periodically call resume() to keep it going
      if (resumeTimerRef.current) clearInterval(resumeTimerRef.current);
      resumeTimerRef.current = setInterval(() => {
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
          window.speechSynthesis.resume();
        } else {
          if (resumeTimerRef.current) clearInterval(resumeTimerRef.current);
        }
      }, 10000); // Every 10 seconds
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (resumeTimerRef.current) clearInterval(resumeTimerRef.current);
    };

    utterance.onerror = (event) => {
      // Don't log "canceled" errors — that's intentional
      if (event.error !== "canceled") {
        console.warn("[useSpeech] Speech error:", event.error);
      }
      setIsSpeaking(false);
      if (resumeTimerRef.current) clearInterval(resumeTimerRef.current);
    };

    // Chrome bug workaround: small delay after cancel() before speak()
    // Without this, Chrome sometimes silently drops the utterance
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      cancelAndResume();
      setIsSpeaking(false);
      if (resumeTimerRef.current) clearInterval(resumeTimerRef.current);
    }
  }, []);

  return { speak, stop, isSpeaking };
}
