/**
 * TTS API Route — Server-side Text-to-Speech
 *
 * Uses Google Translate TTS (public, free, 100+ languages, no API key needed).
 * Returns MP3 audio. Client uses Web Audio API decodeAudioData() to play
 * (supports MP3 on ALL browsers including mobile).
 *
 * Why Google Translate TTS instead of z-ai SDK:
 * - z-ai SDK's API (internal-api.z.ai) resolves to private IPs (172.25.x.x)
 *   which are NOT accessible from Vercel's serverless functions.
 * - Google Translate TTS is publicly accessible, free, and supports all
 *   the languages we need for the vocabulary app.
 */

import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, Buffer>();
const MAX_CACHE = 300;

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text");
  const lang = req.nextUrl.searchParams.get("lang") || "en";

  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  if (text.length > 500) {
    return NextResponse.json({ error: "Text too long (max 500 chars)" }, { status: 400 });
  }

  // Check cache
  const key = `${lang}:${text}`;
  const cached = cache.get(key);
  if (cached) {
    return new NextResponse(new Uint8Array(cached), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(cached.length),
        "Cache-Control": "public, max-age=604800",
      },
    });
  }

  try {
    // Google Translate TTS endpoint
    // client=tw-ob is required to get audio longer than a few words
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(text.trim())}`;

    const response = await fetch(ttsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      console.error(
        "[TTS API] Google TTS failed:",
        response.status,
        await response.text().catch(() => "")
      );
      return NextResponse.json(
        {
          error: "TTS generation failed",
          detail: `Google TTS returned ${response.status}`,
          step: "gtts_fetch",
        },
        { status: 502 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    // Validate it's actual audio (not an error page)
    if (buffer.length < 100) {
      console.error("[TTS API] Response too short, likely an error:", buffer.length);
      return NextResponse.json(
        { error: "TTS returned invalid audio", step: "gtts_invalid" },
        { status: 502 }
      );
    }

    // Cache the result
    if (cache.size >= MAX_CACHE) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }
    cache.set(key, buffer);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "audio/mpeg",
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
