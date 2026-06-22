/**
 * useSpeech — TTS using server-side audio
 *
 * ON-SCREEN DEBUG: Shows debug info as toast messages on screen
 * so you can see what's happening on a phone (no console needed).
 */

"use client";

import { useState, useCallback, useRef, useEffect, useContext, createContext } from "react";
import type { ReactNode } from "react";

// ═══════════════════════════════════════════
// On-screen Debug Toast System
// ═══════════════════════════════════════════

interface DebugMsg {
  id: number;
  text: string;
  type: "info" | "ok" | "error";
  time: number;
}

let debugListeners: Array<(msgs: DebugMsg[]) => void> = [];
let debugMsgs: DebugMsg[] = [];
let debugId = 0;

function addDebug(text: string, type: "info" | "ok" | "error" = "info") {
  const msg: DebugMsg = { id: ++debugId, text, type, time: Date.now() };
  debugMsgs = [...debugMsgs.slice(-6), msg]; // Keep last 7 messages
  debugListeners.forEach((fn) => fn([...debugMsgs]));
  // Also log to console for desktop users
  if (type === "error") console.error("[TTS]", text);
  else console.log("[TTS]", text);
}

/** Component to show on screen — import and render once in your page */
export function TTSDebugOverlay() {
  const [msgs, setMsgs] = useState<DebugMsg[]>([]);

  useEffect(() => {
    debugListeners.push(setMsgs);
    return () => {
      debugListeners = debugListeners.filter((fn) => fn !== setMsgs);
    };
  }, []);

  if (msgs.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        left: 8,
        right: 8,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        pointerEvents: "none",
      }}
    >
      {msgs.map((m) => (
        <div
          key={m.id}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            fontSize: 11,
            fontFamily: "monospace",
            lineHeight: 1.4,
            color: "#fff",
            backgroundColor:
              m.type === "error" ? "#dc2626" : m.type === "ok" ? "#16a34a" : "#4f46e5",
            opacity: 0.92,
            wordBreak: "break-all",
          }}
        >
          {m.type === "ok" ? "✅" : m.type === "error" ? "❌" : "🔍"} {m.text}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// Context
// ═══════════════════════════════════════════

const SpeechContext = createContext({ voicesReady: true });

export function SpeechProvider({ children }: { children: ReactNode }) {
  return <SpeechContext.Provider value={{ voicesReady: true }}>{children}</SpeechContext.Provider>;
}

// ═══════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════

const LOAD_TIMEOUT_MS = 8000;

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.oncanplay = null;
      audioRef.current.onplay = null;
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (text: string, langCode: string = "en") => {
      addDebug(`speak("${text}", "${langCode}")`, "info");
      cleanup();

      setIsSpeaking(true);
      addDebug("isSpeaking → true", "info");

      const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(langCode)}`;
      addDebug(`URL: /api/tts?text=...&lang=${langCode}`, "info");

      // Safety timeout
      timeoutRef.current = setTimeout(() => {
        addDebug("⏰ TIMEOUT! API didn't respond in 8s", "error");
        cleanup();
        setIsSpeaking(false);
      }, LOAD_TIMEOUT_MS);

      const audio = new Audio();
      audioRef.current = audio;

      audio.onplay = () => {
        addDebug("🎵 PLAYING! Audio started!", "ok");
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      audio.oncanplay = () => {
        addDebug("Audio loaded, ready to play", "ok");
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      audio.onended = () => {
        addDebug("Playback finished", "ok");
        setIsSpeaking(false);
      };

      audio.onerror = () => {
        const errCode = audio.error?.code;
        const codes: Record<number, string> = {
          1: "ABORTED",
          2: "NETWORK_ERROR",
          3: "DECODE_ERROR",
          4: "FORMAT_NOT_SUPPORTED",
        };
        addDebug(`❌ Audio error: ${codes[errCode || 0] || "unknown"} (code ${errCode})`, "error");
        cleanup();
        setIsSpeaking(false);
      };

      audio.src = url;
      addDebug("Calling audio.play()...", "info");

      audio
        .play()
        .then(() => {
          addDebug("play() succeeded!", "ok");
        })
        .catch((err) => {
          addDebug(`❌ play() failed: ${err?.name} — ${err?.message}`, "error");
          cleanup();
          setIsSpeaking(false);
        });
    },
    [cleanup]
  );

  const stop = useCallback(() => {
    addDebug("stop() called", "info");
    cleanup();
    setIsSpeaking(false);
  }, [cleanup]);

  return { speak, stop, isSpeaking, voicesReady: true };
}
