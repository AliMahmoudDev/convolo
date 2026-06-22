/**
 * useSpeech — TTS using server-side audio with Web Audio API playback
 *
 * Why Web Audio API instead of <audio> element:
 * - <audio> element doesn't support WAV on many mobile browsers
 * - Web Audio API decodeAudioData() works with WAV on ALL browsers
 * - Same approach used by production audio apps
 */

"use client";

import { useState, useCallback, useRef, useEffect, useContext, createContext } from "react";
import type { ReactNode } from "react";

// ═══════════════════════════════════════════
// Context
// ═══════════════════════════════════════════

const SpeechContext = createContext({ voicesReady: true });

export function SpeechProvider({ children }: { children: ReactNode }) {
  return <SpeechContext.Provider value={{ voicesReady: true }}>{children}</SpeechContext.Provider>;
}

// ═══════════════════════════════════════════
// On-screen Debug Toast System
// ═══════════════════════════════════════════

interface DebugMsg {
  id: number;
  text: string;
  type: "info" | "ok" | "error";
}

let debugListeners: Array<(msgs: DebugMsg[]) => void> = [];
let debugMsgs: DebugMsg[] = [];
let debugId = 0;

function addDebug(text: string, type: "info" | "ok" | "error" = "info") {
  const msg: DebugMsg = { id: ++debugId, text, type };
  debugMsgs = [...debugMsgs.slice(-6), msg];
  debugListeners.forEach((fn) => fn([...debugMsgs]));
}

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
// Hook
// ═══════════════════════════════════════════

const LOAD_TIMEOUT_MS = 10000;

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
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
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {}
      try {
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (text: string, langCode: string = "en") => {
      addDebug(`speak("${text}", "${langCode}")`, "info");
      cleanup();
      setIsSpeaking(true);
      addDebug("Fetching audio...", "info");

      // Safety timeout
      timeoutRef.current = setTimeout(() => {
        addDebug("⏰ TIMEOUT — no response", "error");
        cleanup();
        setIsSpeaking(false);
      }, LOAD_TIMEOUT_MS);

      const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(langCode)}`;

      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          addDebug(`Got response (${res.headers.get("Content-Type")})`, "info");
          return res.arrayBuffer();
        })
        .then((arrayBuffer) => {
          addDebug(`Audio data: ${arrayBuffer.byteLength} bytes`, "info");

          // Create AudioContext if needed
          if (!audioContextRef.current) {
            audioContextRef.current = new (
              window.AudioContext || (window as any).webkitAudioContext
            )();
          }
          const ctx = audioContextRef.current;

          // Resume if suspended (mobile browsers require user interaction)
          if (ctx.state === "suspended") {
            addDebug("Resuming AudioContext...", "info");
            ctx.resume();
          }

          // Decode the audio data — this works with WAV on ALL browsers
          return ctx.decodeAudioData(arrayBuffer);
        })
        .then((audioBuffer) => {
          addDebug("Decoded OK, playing!", "ok");

          // Clear timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          const ctx = audioContextRef.current!;

          // Create and play source
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          sourceRef.current = source;

          source.onended = () => {
            setIsSpeaking(false);
            addDebug("Playback finished", "ok");
          };

          source.start(0);
          addDebug("🎵 PLAYING!", "ok");
        })
        .catch((err) => {
          addDebug(`❌ Error: ${err?.message || err}`, "error");
          cleanup();
          setIsSpeaking(false);
        });
    },
    [cleanup]
  );

  const stop = useCallback(() => {
    addDebug("Stopped", "info");
    cleanup();
    setIsSpeaking(false);
  }, [cleanup]);

  return { speak, stop, isSpeaking, voicesReady: true };
}
