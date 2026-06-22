/**
 * Speech Context — Production-grade TTS for React
 *
 * Architecture:
 * ────────────
 * - SpeechProvider: loads voices ONCE at app root, shares via context
 * - useSpeech(): consumes context, each instance has own isSpeaking state
 * - No setTimeout hacks — Chrome bug handled with resume() before every speak()
 * - No arbitrary intervals — 15s timer only for long text (>100 chars)
 * - Proper cleanup on unmount
 *
 * Chrome SpeechSynthesis Bugs Handled:
 * ────────────────────────────────────
 * 1. cancel() pauses engine → resume() before every speak()
 * 2. Long speech pauses after ~15s → resume timer for long text only
 * 3. getVoices() returns [] initially → context waits for voiceschanged
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

export function useSpeech() {
  const { findVoice, voicesReady } = useContext(SpeechContext);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const resumeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      }
      if (resumeTimerRef.current) clearInterval(resumeTimerRef.current);
    };
  }, []);

  const speak = useCallback(
    (text: string, langCode: string = "en") => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      // ─── Reset speech engine ───
      // Chrome bug: after cancel(), the engine stays paused.
      // resume() alone isn't enough because speak() runs in the same tick.
      // The reliable fix: cancel → resume → brief yield → speak
      window.speechSynthesis.cancel();

      if (resumeTimerRef.current) {
        clearInterval(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getSpeechLang(langCode);
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Set voice from provider cache
      const voice = findVoice(langCode);
      if (voice) utterance.voice = voice;

      utterance.onstart = () => {
        setIsSpeaking(true);

        // Chrome 15s bug: only for long text (single words never hit this)
        if (text.length > 100) {
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
        setIsSpeaking(false);
        if (resumeTimerRef.current) {
          clearInterval(resumeTimerRef.current);
          resumeTimerRef.current = null;
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== "canceled") {
          console.warn("[useSpeech] error:", e.error);
        }
        setIsSpeaking(false);
        if (resumeTimerRef.current) {
          clearInterval(resumeTimerRef.current);
          resumeTimerRef.current = null;
        }
      };

      // Chrome fix: yield to the event loop after cancel()
      // This gives the engine time to fully reset before we speak again.
      // Without this, Chrome silently drops the utterance after cancel().
      // Using requestAnimationFrame is more reliable than setTimeout(fn, 0)
      // because it guarantees at least one paint cycle has passed.
      requestAnimationFrame(() => {
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      });
    },
    [findVoice]
  );

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume(); // Chrome fix
    setIsSpeaking(false);
    if (resumeTimerRef.current) {
      clearInterval(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  return { speak, stop, isSpeaking, voicesReady };
}
