/**
 * useSpeech — Text-to-Speech hook using the Web Speech API
 *
 * Uses the browser's built-in SpeechSynthesis API.
 * No API keys needed — works offline on all modern browsers.
 *
 * Key fixes:
 * - Waits for voices to load (voiceschanged event) before speaking
 * - Picks the best voice with a smart scoring system
 * - Falls back to lang tag only (no voice) if no matching voice found
 * - Cancel on unmount to prevent ghost audio
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// Language code → BCP 47 lang tag for SpeechSynthesis
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

/**
 * Score a voice for how well it matches the desired language.
 * Higher score = better match.
 */
function scoreVoice(voice: SpeechSynthesisVoice, langCode: string): number {
  const targetTag = getSpeechLang(langCode);
  const voiceLang = voice.lang;

  // Perfect match: "ar-SA" === "ar-SA"
  if (voiceLang === targetTag) return 100;

  // Same language, different region: "ar-EG" starts with "ar-"
  if (voiceLang.startsWith(langCode + "-")) return 80;

  // Voice lang starts with our code (loose match)
  if (voiceLang.startsWith(langCode)) return 60;

  // No match
  return 0;
}

/**
 * Find the best voice for a language code.
 * Prefers: exact match > same language different region > any partial match
 * Also prefers non-local (cloud) voices over local ones for better quality.
 */
function findBestVoice(
  voices: SpeechSynthesisVoice[],
  langCode: string
): SpeechSynthesisVoice | null {
  let bestVoice: SpeechSynthesisVoice | null = null;
  let bestScore = 0;

  for (const voice of voices) {
    const score = scoreVoice(voice, langCode);
    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    } else if (score === bestScore && bestVoice && score > 0) {
      // Tie-breaker: prefer non-local (cloud/network) voices — they sound better
      if (!voice.localService && bestVoice.localService) {
        bestVoice = voice;
      }
    }
  }

  return bestVoice;
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesLoadedRef = useRef(false);
  const pendingSpeakRef = useRef<{ text: string; langCode: string } | null>(null);

  // ─── Load voices (they load async in most browsers) ───
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Check if voices are already available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      voicesLoadedRef.current = true;
      // Play any pending speech
      if (pendingSpeakRef.current) {
        const { text, langCode } = pendingSpeakRef.current;
        pendingSpeakRef.current = null;
        doSpeak(text, langCode);
      }
      return;
    }

    // Wait for voices to load
    const handleVoicesChanged = () => {
      voicesLoadedRef.current = true;
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);

      // Play any pending speech
      if (pendingSpeakRef.current) {
        const { text, langCode } = pendingSpeakRef.current;
        pendingSpeakRef.current = null;
        doSpeak(text, langCode);
      }
    };

    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    };
  }, []);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ─── Internal speak function ───
  const doSpeak = useCallback((text: string, langCode: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langTag = getSpeechLang(langCode);
    utterance.lang = langTag;
    utterance.rate = 0.85; // Slightly slower for language learners
    utterance.pitch = 1;
    utterance.volume = 1;

    // Find the best matching voice
    const voices = window.speechSynthesis.getVoices();
    const bestVoice = findBestVoice(voices, langCode);

    if (bestVoice) {
      utterance.voice = bestVoice;
    }
    // If no matching voice found, we still set utterance.lang
    // The browser will try to use the correct TTS engine based on lang tag

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  // ─── Public speak function ───
  const speak = useCallback(
    (text: string, langCode: string = "en") => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      // If voices aren't loaded yet, queue the speech
      if (!voicesLoadedRef.current && window.speechSynthesis.getVoices().length === 0) {
        pendingSpeakRef.current = { text, langCode };
        // Trigger voice loading by calling getVoices()
        window.speechSynthesis.getVoices();
        return;
      }

      voicesLoadedRef.current = true;
      doSpeak(text, langCode);
    },
    [doSpeak]
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, stop, isSpeaking };
}
