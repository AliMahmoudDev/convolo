/**
 * TTS API Route — Server-side Text-to-Speech
 *
 * Simple and robust: text + lang → WAV audio
 * Uses z-ai-web-dev-sdk with caching.
 */

import { NextRequest, NextResponse } from "next/server";

// Map language codes to best voice
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

// SDK singleton
let zaiInstance: any = null;

async function getZAI() {
  if (!zaiInstance) {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// Simple LRU cache (max 300 entries)
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

  // Check cache
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
    const zai = await getZAI();
    const voice = LANG_VOICES[lang] || "kazi";

    const response = await zai.audio.tts.create({
      input: text.trim(),
      voice,
      speed: 0.85,
      response_format: "wav",
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    // Update cache
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
    console.error("[TTS API] Error:", error?.message || error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
