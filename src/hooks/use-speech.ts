/**
 * useSpeech — Text-to-Speech hook using the Web Speech API
 *
 * Uses the browser's built-in SpeechSynthesis API.
 * No API keys needed — works offline on all modern browsers.
 *
 * Features:
 * - Speak text in a specific language
 * - Auto-selects the best voice for the language
 * - Tracks playing state for UI feedback
 * - Cancel on unmount to prevent ghost audio
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// Language code mapping for SpeechSynthesis lang tags
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

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string, langCode: string = "en") => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getSpeechLang(langCode);
    utterance.rate = 0.85; // Slightly slower for language learners
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to find a voice matching the language
    const voices = window.speechSynthesis.getVoices();
    const langTag = getSpeechLang(langCode);

    // First try: exact match
    let voice = voices.find((v) => v.lang === langTag);

    // Second try: partial match (e.g., "ar" matches "ar-SA", "ar-EG")
    if (!voice) {
      voice = voices.find((v) => v.lang.startsWith(langCode));
    }

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
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
