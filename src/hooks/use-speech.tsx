/**
 * Speech Context — Production-grade TTS for React
 *
 * Architecture:
 * ────────────
 * - SpeechProvider: loads voices ONCE at app root, shares via context
 * - useSpeech(): consumes context, each instance has own isSpeaking state
 * - Optimistic UI: isSpeaking goes true immediately on click
 * - Safety timeout: resets isSpeaking if onstart never fires (silent failure)
 * - Double-RAF Chrome fix with cancel guard
 *
 * Chrome SpeechSynthesis Bugs Handled:
 * ────────────────────────────────────
 * 1. cancel() pauses engine → double-RAF + resume() before every speak()
 * 2. Long speech pauses after ~15s → resume timer for long text only
 * 3. getVoices() returns [] initially → context waits for voiceschanged
 * 4. Silent failure after cancel/language change → optimistic UI + safety timeout
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
      // Prefer cloud voices — better quality
      if (!voice.localService && best.localService) best = voice;
    }
  }

  return best;
}

// ═══════════════════════════════════════════
// Context
// ═══════════════════════════════════════════

interface SpeechContextValue {
  voices: SpeechSynthesisVoice[];
  voicesReady: boolean;
  findVoice: (langCode: string) => SpeechSynthesisVoice | null;
}

const SpeechContext = createContext<SpeechContextValue>({
  voices: [],
  voicesReady: false,
  findVoice: () => null,
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

  const findVoice = useCallback((langCode: string) => findBestVoice(voices, langCode), [voices]);

  return (
    <SpeechContext.Provider value={{ voices, voicesReady, findVoice }}>
      {children}
    </SpeechContext.Provider>
  );
}

// ═══════════════════════════════════════════
// Hook — use in any component
// ═══════════════════════════════════════════

/** Time to wait for onstart before assuming silent failure */
const SAFETY_TIMEOUT_MS = 2000;
/** Chrome 15s pause bug threshold */
const LONG_TEXT_THRESHOLD = 100;

export function useSpeech() {
  const { findVoice, voicesReady } = useContext(SpeechContext);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const resumeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Incremented every time speak() is called; RAF callbacks check this
  // to detect if the speech was cancelled while they were queued
  const speakGenerationRef = useRef(0);
  const startFiredRef = useRef(false);

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

      // ─── Reset any previous speech ───
      window.speechSynthesis.cancel();
      clearTimers();
      startFiredRef.current = false;

      // Bump generation — any queued RAF callbacks from a previous
      // speak() call will see a stale generation and bail out
      const generation = ++speakGenerationRef.current;

      // ─── Optimistic UI: show speaking state immediately ───
      // This ensures the button animates even if onstart takes time
      // or silently fails (Chrome bug after cancel/language change)
      setIsSpeaking(true);

      // ─── Safety timeout: if onstart never fires, reset UI ───
      // This prevents the button from being stuck in "speaking" forever
      safetyTimerRef.current = setTimeout(() => {
        if (!startFiredRef.current) {
          // onstart never fired — silent failure
          console.warn(
            `[useSpeech] onstart didn't fire within ${SAFETY_TIMEOUT_MS}ms for lang="${langCode}" text="${text.slice(0, 30)}". ` +
              `Voice found: ${findVoice(langCode) ? "yes" : "no"}. ` +
              `Speech synthesis may not support this language.`
          );
          setIsSpeaking(false);
        }
      }, SAFETY_TIMEOUT_MS);

      // ─── Build utterance ───
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getSpeechLang(langCode);
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Set voice from provider cache
      const voice = findVoice(langCode);
      if (voice) {
        utterance.voice = voice;
      } else {
        // No voice found — browser will try to use default voice for utterance.lang
        // This may or may not work depending on the browser/OS
        console.info(
          `[useSpeech] No voice found for lang="${langCode}". ` +
            `Relying on browser default for "${utterance.lang}". ` +
            `Available voices: ${window.speechSynthesis.getVoices().length}`
        );
      }

      // ─── onstart: confirm speech actually started ───
      utterance.onstart = () => {
        startFiredRef.current = true;
        // isSpeaking already true from optimistic set, but re-affirm it
        setIsSpeaking(true);

        // Clear the safety timer — speech started successfully
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

      // ─── Chrome fix: double requestAnimationFrame with cancel guard ───
      // After cancel(), Chrome's engine stays paused. A single RAF
      // isn't always enough — the engine needs at least one full
      // paint cycle to fully reset. Double-RAF ensures we yield
      // past the current frame AND the next one, giving Chrome
      // sufficient time to recover before we call speak().
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Guard: if stop() was called while the RAF was queued,
          // generation will have changed — bail out
          if (speakGenerationRef.current !== generation) return;
          if (typeof window === "undefined" || !window.speechSynthesis) return;

          // Resume the engine (in case it's paused from a previous cancel)
          window.speechSynthesis.resume();
          // Now speak
          window.speechSynthesis.speak(utterance);
        });
      });
    },
    [findVoice, clearTimers]
  );

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    // Bump generation so any queued RAF callbacks from speak() bail out
    speakGenerationRef.current++;
    window.speechSynthesis.cancel();
    startFiredRef.current = false;
    setIsSpeaking(false);
    clearTimers();
  }, [clearTimers]);

  return { speak, stop, isSpeaking, voicesReady };
}
