/**
 * Speech Context — Production-grade TTS for React
 *
 * ROOT CAUSE OF "ENGLISH ONLY" BUG:
 * ──────────────────────────────────
 * Chrome has two types of voices:
 *   1. LOCAL voices — built into OS, always available (e.g. Microsoft David for English)
 *   2. NETWORK voices — Google voices loaded from servers (e.g. Google Français)
 *
 * Setting utterance.voice to a network voice WITHOUT utterance.lang causes
 * Chrome to fail silently — onstart never fires, no sound plays.
 * This only affected non-English languages because English always has local voices.
 *
 * THE FIX:
 * ────────
 * 1. ALWAYS set utterance.lang — this is Chrome's primary voice selection mechanism
 * 2. Set utterance.voice ONLY for local voices (they're always ready)
 * 3. For network voices, let Chrome auto-select them based on utterance.lang
 * 4. Don't call cancel() for the first speak — only when switching speeches
 * 5. Keep optimistic UI + safety timeout for edge cases
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";

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
// Voice Selection
// ═══════════════════════════════════════════

function scoreVoice(voice: SpeechSynthesisVoice, langCode: string): number {
  const targetTag = getSpeechLang(langCode);
  const voiceLang = voice.lang;
  if (voiceLang === targetTag) return 100;
  if (voiceLang.startsWith(langCode + "-")) return 80;
  if (voiceLang.startsWith(langCode)) return 60;
  return 0;
}

/**
 * Find the best LOCAL voice for a language.
 * We only use local voices with utterance.voice because:
 * - Local voices are always loaded and ready to use
 * - Network voices (Google) can fail if assigned via utterance.voice
 * - For network voices, we let Chrome auto-select via utterance.lang
 */
function findLocalVoice(
  voices: SpeechSynthesisVoice[],
  langCode: string
): SpeechSynthesisVoice | null {
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = 0;

  for (const voice of voices) {
    if (!voice.localService) continue; // Only consider local voices
    const score = scoreVoice(voice, langCode);
    if (score > bestScore) {
      bestScore = score;
      best = voice;
    }
  }

  return best;
}

/**
 * Check if ANY voice exists for a language (local or network).
 * Used for logging/diagnostic purposes.
 */
function hasAnyVoice(voices: SpeechSynthesisVoice[], langCode: string): boolean {
  return voices.some((v) => scoreVoice(v, langCode) > 0);
}

// ═══════════════════════════════════════════
// Context
// ═══════════════════════════════════════════

interface SpeechContextValue {
  voicesReady: boolean;
}

const SpeechContext = createContext<SpeechContextValue>({
  voicesReady: false,
});

// ═══════════════════════════════════════════
// Provider — mount ONCE at app root
// ═══════════════════════════════════════════

export function SpeechProvider({ children }: { children: ReactNode }) {
  const [voicesReady, setVoicesReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setVoicesReady(true);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  return <SpeechContext.Provider value={{ voicesReady }}>{children}</SpeechContext.Provider>;
}

// ═══════════════════════════════════════════
// Hook — use in any component
// ═══════════════════════════════════════════

/** Safety timeout — if onstart doesn't fire, reset UI */
const SAFETY_TIMEOUT_MS = 3000;
/** Chrome 15s pause bug threshold */
const LONG_TEXT_THRESHOLD = 100;

export function useSpeech() {
  const { voicesReady } = useContext(SpeechContext);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const resumeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track if we're currently speaking to know whether to cancel first
  const isActiveRef = useRef(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (resumeTimerRef.current) clearInterval(resumeTimerRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, []);

  const clearTimers = useCallback(() => {
    if (resumeTimerRef.current) {
      clearInterval(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (text: string, langCode: string = "en") => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      clearTimers();

      // ─── Optimistic UI: show speaking state immediately ───
      setIsSpeaking(true);

      // ─── Only cancel if something is currently speaking ───
      // Calling cancel() when nothing is playing can put Chrome's engine
      // in a "paused" state that breaks the NEXT speak() call.
      // This is the #1 cause of "works for English, breaks for other languages"
      // because cancel() + immediate speak() works for local voices (English)
      // but fails for network voices (French, Arabic, etc.)
      const needsCancel = isActiveRef.current || window.speechSynthesis.speaking;
      if (needsCancel) {
        window.speechSynthesis.cancel();
      }

      // ─── Build utterance ───
      const utterance = new SpeechSynthesisUtterance(text);

      // CRITICAL: Always set utterance.lang — this is Chrome's primary
      // mechanism for selecting a voice. Without it, Chrome defaults to
      // the system language (usually English).
      utterance.lang = getSpeechLang(langCode);
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Get fresh voices for this call
      const freshVoices = window.speechSynthesis.getVoices();

      // Only set utterance.voice for LOCAL voices.
      // Network voices (Google) should NOT be assigned via utterance.voice
      // because Chrome fails silently when a network voice isn't fully loaded.
      // Instead, Chrome auto-selects network voices based on utterance.lang.
      const localVoice = findLocalVoice(freshVoices, langCode);
      if (localVoice) {
        utterance.voice = localVoice;
        // utterance.lang is also set — having both is fine for local voices
      } else {
        // No local voice — Chrome will use utterance.lang to auto-select
        // a network voice. This is how Chrome is designed to work.
        const anyVoiceExists = hasAnyVoice(freshVoices, langCode);
        if (!anyVoiceExists) {
          console.info(
            `[useSpeech] No voice (local or network) for "${langCode}". ` +
              `Chrome will try default voice. Available: ${freshVoices.length} voices.`
          );
        }
      }

      // ─── Callbacks ───
      utterance.onstart = () => {
        isActiveRef.current = true;

        // Clear safety timer — speech started successfully
        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current);
          safetyTimerRef.current = null;
        }

        // Chrome 15s bug: only for long text
        if (text.length > LONG_TEXT_THRESHOLD) {
          resumeTimerRef.current = setInterval(() => {
            if (window.speechSynthesis?.speaking) {
              window.speechSynthesis.resume();
            } else if (resumeTimerRef.current) {
              clearInterval(resumeTimerRef.current);
              resumeTimerRef.current = null;
            }
          }, 10000);
        }
      };

      utterance.onend = () => {
        isActiveRef.current = false;
        setIsSpeaking(false);
        clearTimers();
      };

      utterance.onerror = (e) => {
        isActiveRef.current = false;
        if (e.error !== "canceled") {
          console.warn(`[useSpeech] error: ${e.error}`, { langCode, text: text.slice(0, 50) });
        }
        setIsSpeaking(false);
        clearTimers();
      };

      // ─── Safety timeout ───
      safetyTimerRef.current = setTimeout(() => {
        if (isActiveRef.current) return; // Speech started, all good
        console.warn(
          `[useSpeech] onstart didn't fire for lang="${langCode}" within ${SAFETY_TIMEOUT_MS}ms. ` +
            `Local voice: ${localVoice ? localVoice.name : "none"}. ` +
            `Total voices: ${freshVoices.length}. ` +
            `Speech may not be supported for this language.`
        );
        setIsSpeaking(false);
      }, SAFETY_TIMEOUT_MS);

      // ─── Speak ───
      // If we cancelled previous speech, wait one frame for Chrome to reset.
      // If this is a fresh speak (no cancel), call directly — no delay needed.
      if (needsCancel) {
        // After cancel(), Chrome's engine needs one frame to reset
        requestAnimationFrame(() => {
          window.speechSynthesis.speak(utterance);
        });
      } else {
        // Fresh speak — call directly, no delay
        window.speechSynthesis.speak(utterance);
      }
    },
    [clearTimers]
  );

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    isActiveRef.current = false;
    setIsSpeaking(false);
    clearTimers();
  }, [clearTimers]);

  return { speak, stop, isSpeaking, voicesReady };
}
