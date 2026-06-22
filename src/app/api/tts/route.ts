/**
 * TTS API Route — Server-side Text-to-Speech
 *
 * Returns WAV audio. Client uses Web Audio API to decode and play.
 * Web Audio API decodeAudioData() supports WAV on ALL browsers (including mobile).
 *
 * Uses environment variables for SDK config (Best Practice):
 *   ZAI_BASE_URL  — API base URL
 *   ZAI_API_KEY   — API key
 *   ZAI_CHAT_ID   — Chat ID (optional)
 *   ZAI_TOKEN     — Auth token (optional)
 *   ZAI_USER_ID   — User ID (optional)
 *
 * On Vercel, set these in Project Settings → Environment Variables.
 * Locally, add them to .env.local.
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

/**
 * Initialize ZAI SDK using environment variables instead of .z-ai-config file.
 *
 * The SDK's ZAI.create() reads from a file, but the constructor new ZAI(config)
 * accepts a config object directly. We use the constructor to avoid committing
 * secrets to the repo — all config comes from process.env (Vercel env vars).
 */
async function getZAI() {
  if (!zaiInstance) {
    const baseUrl = process.env.ZAI_BASE_URL;
    const apiKey = process.env.ZAI_API_KEY;

    if (!baseUrl || !apiKey) {
      throw new Error(
        "Missing ZAI config env vars. Set ZAI_BASE_URL and ZAI_API_KEY " +
          "in your Vercel project settings (or .env.local for local dev)."
      );
    }

    const config: Record<string, string> = { baseUrl, apiKey };

    // Optional fields — used in request headers if present
    if (process.env.ZAI_CHAT_ID) config.chatId = process.env.ZAI_CHAT_ID;
    if (process.env.ZAI_TOKEN) config.token = process.env.ZAI_TOKEN;
    if (process.env.ZAI_USER_ID) config.userId = process.env.ZAI_USER_ID;

    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    // ZAI.create() reads from file — we bypass it and use the constructor
    // directly with config from environment variables (Best Practice).
    // The constructor is marked private in .d.ts but works at runtime.

    zaiInstance = new (ZAI as any)(config);
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
      console.error("[TTS API] TTS create failed:", ttsError?.message, ttsError?.cause);
      return NextResponse.json(
        {
          error: "TTS generation failed",
          detail: ttsError?.message || String(ttsError),
          cause: ttsError?.cause ? String(ttsError.cause) : undefined,
          code: ttsError?.code || undefined,
          step: "tts_create",
          voice,
          text: text.slice(0, 50),
          configDebug: {
            hasBaseUrl: !!process.env.ZAI_BASE_URL,
            hasApiKey: !!process.env.ZAI_API_KEY,
            hasChatId: !!process.env.ZAI_CHAT_ID,
            hasToken: !!process.env.ZAI_TOKEN,
            hasUserId: !!process.env.ZAI_USER_ID,
          },
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
