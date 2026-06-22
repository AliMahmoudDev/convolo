/**
 * TTS API Route — Server-side Text-to-Speech
 *
 * Uses Google Translate TTS (public, free, 100+ languages, no API key needed).
 * Returns MP3 audio. Client uses Web Audio API decodeAudioData() to play
 * (supports MP3 on ALL browsers including mobile).
 *
 * Query params:
 *   text  — the text to speak (required, max 500 chars)
 *   lang  — language code: en, fr, ar, es, de, ja, ko, zh, pt, it, ru, hi, tr
 *   speed — playback speed: 0.2 (very slow) to 3.0 (very fast), default 1.0
 *           Learners benefit from slower speed (0.5-0.7) for comprehension.
 */

import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, Buffer>();
const MAX_CACHE = 300;

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text");
  const lang = req.nextUrl.searchParams.get("lang") || "en";
  const speedParam = req.nextUrl.searchParams.get("speed");

  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  if (text.length > 500) {
    return NextResponse.json({ error: "Text too long (max 500 chars)" }, { status: 400 });
  }

  // Parse and clamp speed: 0.2 to 3.0, default 1.0
  let speed = 1.0;
  if (speedParam) {
    speed = Math.max(0.2, Math.min(3.0, parseFloat(speedParam) || 1.0));
  }

  // Check cache (include speed in key so different speeds are cached separately)
  const key = `${lang}:${speed}:${text}`;
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
    // client=t supports ttsspeed parameter for controlling playback rate
    const params = new URLSearchParams({
      ie: "UTF-8",
      tl: lang,
      client: "t",
      q: text.trim(),
    });

    // Only add ttsspeed if not default (1.0) to keep URLs clean for caching
    if (speed !== 1.0) {
      params.set("ttsspeed", String(speed));
    }

    const ttsUrl = `https://translate.google.com/translate_tts?${params.toString()}`;

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
