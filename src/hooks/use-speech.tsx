/**
 * Speech Context — Production-grade TTS for React
 *
 * Architecture:
 * ────────────
 * - SpeechProvider: loads voices at app root, shares via context
 * - useSpeech(): consumes context, each instance has own isSpeaking state
 * - Optimistic UI: isSpeaking goes true immediately on click
 * - Fresh voice lookup: speak() calls getVoices() directly (not stale cache)
 * - Retry on silent failure: if onstart doesn't fire, retries once
 * - Double-RAF Chrome fix with cancel guard
 *
 * Chrome SpeechSynthesis Bugs Handled:
 * ────────────────────────────────────
 * 1. cancel() pauses engine → double-RAF + resume() before every speak()
 * 2. Long speech pauses after ~15s → resume timer for long text only
 * 3. getVoices() returns [] initially → context waits for voiceschanged
 * 4. Silent failure after cancel/language change → optimistic UI + retry
 * 5. voice/lang conflict → set ONLY voice (not lang) when voice is found
 * 6. Stale cached voice objects → fresh getVoices() inside speak()
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
 * Find the best voice for a language code from a list of voices.
 * Prefers local voices over network voices (more reliable, always available).
 */
function findBestVoice(
  voices: SpeechSynthesisVoice[],
  langCode: string
): SpeechSynthesisVoice | null {
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = 0;

  for (const voice of voices) {
    const score = scoreVoice(voice, langCode);
    if (score > bestScore) {
      bestScore = score;
      best = voice;
    } else if (score === bestScore && best && score > 0) {
      // Prefer LOCAL voices — they're always available, no network dependency
      // Google network voices can fail silently if not loaded yet
      if (voice.localService && !best.localService) best = voice;
    }
  }

  return best;
}

/**
 * Get fresh voices directly from the browser.
 * This is more reliable than using cached voices because:
 * - Chrome can invalidate voice objects after certain events
 * - Network voices may not be available when cached voices were stored
 * - Fresh voices are guaranteed to be valid and usable
 */
function getFreshVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

// ═══════════════════════════════════════════
// Context
// ═══════════════════════════════════════════

interface SpeechContextValue {
  voices: SpeechSynthesisVoice[];
  voicesReady: boolean;
}

const SpeechContext = createContext<SpeechContextValue>({
  voices: [],
  voicesReady: false,
});

// ═══════════════════════════════════════════
// Provider — mount ONCE at app root
// ═══════════════════════════════════════════

export function SpeechProvider({ children }: { children: ReactNode }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicesReady, setVoicesReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setVoices(v);
        setVoicesReady(true);
      }
    };

    // Try immediately (some browsers have voices ready)
    loadVoices();

    // Also listen for async load (Chrome, etc.)
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <SpeechContext.Provider value={{ voices, voicesReady }}>{children}</SpeechContext.Provider>
  );
}

// ═══════════════════════════════════════════
// Hook — use in any component
// ═══════════════════════════════════════════

/** Time to wait for onstart before retrying */
const FIRST_ATTEMPT_TIMEOUT_MS = 1500;
/** Time to wait for onstart on retry before giving up */
const RETRY_TIMEOUT_MS = 2500;
/** Chrome 15s pause bug threshold */
const LONG_TEXT_THRESHOLD = 100;

export function useSpeech() {
  const { voicesReady } = useContext(SpeechContext);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const resumeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Incremented every time speak() is called; RAF callbacks check this
  // to detect if the speech was cancelled while they were queued
  const speakGenerationRef = useRef(0);
  const startFiredRef = useRef(false);
  const retryCountRef = useRef(0);

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

  /**
   * Create a fully configured utterance.
   * KEY INSIGHT: When a voice is found, we set ONLY the voice — NOT utterance.lang.
   * Chrome has a bug where setting both voice AND lang can cause a conflict:
   * Chrome reads utterance.lang, overrides the voice selection, and falls back
   * to the default (English) voice. By setting only the voice object, Chrome
   * uses the correct language from the voice itself.
   *
   * When NO voice is found, we set ONLY utterance.lang (no voice) and let
   * Chrome try to find a matching voice by language tag.
   */
  const createUtterance = useCallback(
    (text: string, langCode: string): SpeechSynthesisUtterance => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Always get FRESH voices directly from the browser.
      // Cached voices from the Provider can be stale — Chrome may have
      // invalidated them, or network voices may not have been loaded yet.
      const freshVoices = getFreshVoices();
      const voice = findBestVoice(freshVoices, langCode);

      if (voice) {
        // Found a voice — set ONLY the voice, NOT the lang.
        // The voice object already knows its language.
        // Setting utterance.lang alongside voice causes Chrome to
        // sometimes ignore the voice and use the default (English).
        utterance.voice = voice;
      } else {
        // No voice found — set ONLY the lang.
        // Chrome will try to find a voice matching this language tag.
        // If no matching voice exists, Chrome uses the default voice
        // which is typically English — this is the best we can do.
        utterance.lang = getSpeechLang(langCode);

        console.info(
          `[useSpeech] No voice for "${langCode}" (${freshVoices.length} voices available). ` +
            `Using utterance.lang="${utterance.lang}" as fallback.`
        );
      }

      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;

      return utterance;
    },
    []
  );

  const speak = useCallback(
    (text: string, langCode: string = "en") => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      // ─── Reset any previous speech ───
      window.speechSynthesis.cancel();
      clearTimers();
      startFiredRef.current = false;
      retryCountRef.current = 0;

      // Bump generation — any queued callbacks from a previous
      // speak() call will see a stale generation and bail out
      const generation = ++speakGenerationRef.current;

      // ─── Optimistic UI: show speaking state immediately ───
      setIsSpeaking(true);

      // ─── Build utterance with fresh voice lookup ───
      const utterance = createUtterance(text, langCode);

      // ─── onstart: confirm speech actually started ───
      utterance.onstart = () => {
        startFiredRef.current = true;
        retryCountRef.current = 0;
        setIsSpeaking(true);

        // Clear safety timer — speech started successfully
        if (safetyTimerRef.current) {
          clearTimeout(safetyTimerRef.current);
          safetyTimerRef.current = null;
        }

        // Chrome 15s bug: only for long text (single words never hit this)
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

      // ─── onend: speech finished naturally ───
      utterance.onend = () => {
        startFiredRef.current = false;
        retryCountRef.current = 0;
        setIsSpeaking(false);
        clearTimers();
      };

      // ─── onerror: speech failed ───
      utterance.onerror = (e) => {
        startFiredRef.current = false;
        if (e.error !== "canceled") {
          console.warn(`[useSpeech] error: ${e.error}`, { langCode, text: text.slice(0, 50) });
        }
        setIsSpeaking(false);
        clearTimers();
      };

      // ─── Safety timeout: if onstart doesn't fire, retry or give up ───
      safetyTimerRef.current = setTimeout(() => {
        if (startFiredRef.current) return; // Already started, all good
        if (speakGenerationRef.current !== generation) return; // Cancelled

        if (retryCountRef.current < 1) {
          // First attempt failed — retry with a longer delay
          // This handles Chrome's case where the speech engine needs
          // more time to reset after cancel(), especially for
          // non-English languages that need network voices
          console.info(`[useSpeech] Retrying speech for lang="${langCode}"...`);
          retryCountRef.current++;

          // Cancel and try again with setTimeout instead of RAF
          window.speechSynthesis.cancel();

          // Rebuild utterance with fresh voices (voices might have loaded since first attempt)
          const retryUtterance = createUtterance(text, langCode);

          retryUtterance.onstart = utterance.onstart;
          retryUtterance.onend = utterance.onend;
          retryUtterance.onerror = (e) => {
            startFiredRef.current = false;
            if (e.error !== "canceled") {
              console.warn(`[useSpeech] retry error: ${e.error}`, { langCode });
            }
            setIsSpeaking(false);
            clearTimers();
          };

          // Use setTimeout(100ms) for retry — longer than double-RAF
          // to give Chrome's engine more time to fully reset
          setTimeout(() => {
            if (speakGenerationRef.current !== generation) return;
            window.speechSynthesis.resume();
            window.speechSynthesis.speak(retryUtterance);
          }, 100);

          // Set a longer timeout for the retry
          safetyTimerRef.current = setTimeout(() => {
            if (startFiredRef.current) return;
            if (speakGenerationRef.current !== generation) return;

            console.warn(
              `[useSpeech] Speech failed for lang="${langCode}" after retry. ` +
                `Voices available: ${getFreshVoices().length}. ` +
                `This language may not be supported by your browser.`
            );
            setIsSpeaking(false);
          }, RETRY_TIMEOUT_MS);
        } else {
          // Already retried — give up
          console.warn(
            `[useSpeech] Speech failed for lang="${langCode}" after retry. ` +
              `Voices available: ${getFreshVoices().length}. ` +
              `This language may not be supported by your browser.`
          );
          setIsSpeaking(false);
        }
      }, FIRST_ATTEMPT_TIMEOUT_MS);

      // ─── Chrome fix: double requestAnimationFrame with cancel guard ───
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (speakGenerationRef.current !== generation) return;
          if (typeof window === "undefined" || !window.speechSynthesis) return;

          window.speechSynthesis.resume();
          window.speechSynthesis.speak(utterance);
        });
      });
    },
    [createUtterance, clearTimers]
  );

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    speakGenerationRef.current++;
    window.speechSynthesis.cancel();
    startFiredRef.current = false;
    retryCountRef.current = 0;
    setIsSpeaking(false);
    clearTimers();
  }, [clearTimers]);

  return { speak, stop, isSpeaking, voicesReady };
}
