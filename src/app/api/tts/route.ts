/**
 * TTS API Route — Server-side Text-to-Speech
 *
 * Returns WAV audio. Client uses Web Audio API to decode and play.
 * Web Audio API decodeAudioData() supports WAV on ALL browsers (including mobile).
 *
 * Includes detailed error info for debugging.
 */

import { NextRequest, NextResponse } from "next/server";

const LANG_VOICES: Record<string, string> = {
  en: "jam",
  fr: "kazi",
  ar: "kazi",
  es: "kazi",
  de: "kazi",
  ja: "kazi",
  ko: "kazi",
  zh: "tongtong",
  pt: "kazi",
  it: "kazi",
  ru: "kazi",
  hi: "kazi",
  tr: "kazi",
};

let zaiInstance: any = null;

async function getZAI() {
  if (!zaiInstance) {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

const cache = new Map<string, Buffer>();
const MAX_CACHE = 300;

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text");
  const lang = req.nextUrl.searchParams.get("lang") || "en";

  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  if (text.length > 1024) {
    return NextResponse.json({ error: "Text too long" }, { status: 400 });
  }

  const key = `${lang}:${text}`;
  const cached = cache.get(key);
  if (cached) {
    return new NextResponse(new Uint8Array(cached), {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(cached.length),
        "Cache-Control": "public, max-age=604800",
      },
    });
  }

  try {
    // Step 1: Initialize SDK
    let zai;
    try {
      zai = await getZAI();
    } catch (sdkInitError: any) {
      console.error("[TTS API] SDK init failed:", sdkInitError?.message);
      return NextResponse.json(
        {
          error: "SDK init failed",
          detail: sdkInitError?.message || String(sdkInitError),
          step: "sdk_init",
        },
        { status: 500 }
      );
    }

    // Step 2: Call TTS
    const voice = LANG_VOICES[lang] || "kazi";
    let response;
    try {
      response = await zai.audio.tts.create({
        input: text.trim(),
        voice,
        speed: 0.85,
        response_format: "wav",
        stream: false,
      });
    } catch (ttsError: any) {
      console.error("[TTS API] TTS create failed:", ttsError?.message);
      return NextResponse.json(
        {
          error: "TTS generation failed",
          detail: ttsError?.message || String(ttsError),
          step: "tts_create",
          voice,
          text: text.slice(0, 50),
        },
        { status: 500 }
      );
    }

    // Step 3: Read audio data
    let arrayBuffer;
    try {
      arrayBuffer = await response.arrayBuffer();
    } catch (readError: any) {
      console.error("[TTS API] Read audio failed:", readError?.message);
      return NextResponse.json(
        {
          error: "Failed to read audio data",
          detail: readError?.message || String(readError),
          step: "read_audio",
        },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    if (cache.size >= MAX_CACHE) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }
    cache.set(key, buffer);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=604800",
      },
    });
  } catch (error: any) {
    console.error("[TTS API] Unexpected error:", error?.message || error);
    return NextResponse.json(
      {
        error: "TTS failed",
        detail: error?.message || String(error),
        step: "unknown",
      },
      { status: 500 }
    );
  }
}
