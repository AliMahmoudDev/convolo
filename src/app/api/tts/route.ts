/**
 * TTS API Route — Server-side Text-to-Speech
 *
 * Uses z-ai-web-dev-sdk for reliable, multi-language TTS.
 * This is the same approach used by production language learning apps
 * (Duolingo, Babbel, etc.) — server-side TTS instead of Web Speech API.
 *
 * Why NOT Web Speech API:
 * - Only English local voices are reliably available across browsers
 * - Network voices (Google Français, etc.) fail silently in Chrome
 * - No control over voice quality, speed, or availability
 *
 * Why server-side TTS:
 * - Works for ALL languages (French, Arabic, Spanish, etc.)
 * - Consistent quality across browsers
 * - Cacheable (same word = same audio)
 * - Fast (~200ms for single words)
 */

import { NextRequest, NextResponse } from "next/server";

// Map language codes to appropriate voice for best pronunciation
const LANG_VOICES: Record<string, string> = {
  en: "jam", // British English — clear pronunciation
  fr: "kazi", // Clear standard
  ar: "kazi",
  es: "kazi",
  de: "kazi",
  ja: "kazi",
  ko: "kazi",
  zh: "tongtong", // Warm Chinese voice
  pt: "kazi",
  it: "kazi",
  ru: "kazi",
  hi: "kazi",
  tr: "kazi",
};

// SDK singleton — reuse across requests
let zaiInstance: any = null;

async function getZAI() {
  if (!zaiInstance) {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// Simple in-memory cache for repeated words
const audioCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 500;

function getCacheKey(text: string, lang: string): string {
  return `${lang}:${text}`;
}

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text");
  const lang = req.nextUrl.searchParams.get("lang") || "en";

  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  if (text.length > 1024) {
    return NextResponse.json({ error: "Text too long (max 1024 chars)" }, { status: 400 });
  }

  // Check cache first
  const cacheKey = getCacheKey(text, lang);
  const cached = audioCache.get(cacheKey);
  if (cached) {
    return new NextResponse(new Uint8Array(cached), {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": cached.length.toString(),
        "Cache-Control": "public, max-age=604800", // 7 days
        "X-Cache": "HIT",
      },
    });
  }

  try {
    const zai = await getZAI();
    const voice = LANG_VOICES[lang] || "kazi";

    const response = await zai.audio.tts.create({
      input: text.trim(),
      voice: voice,
      speed: 0.85,
      response_format: "wav",
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    // Cache the result (evict oldest if cache is full)
    if (audioCache.size >= MAX_CACHE_SIZE) {
      const firstKey = audioCache.keys().next().value;
      if (firstKey) audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, buffer);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=604800", // 7 days
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("[TTS API] Error:", error);
    return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 });
  }
}
