/**
 * TTS API Route — Server-side Text-to-Speech
 *
 * Generates WAV via z-ai-web-dev-sdk, then converts to MP3 via ffmpeg.
 * MP3 is universally supported on ALL mobile browsers.
 * WAV is NOT supported on many mobile browsers (causes FORMAT_NOT_SUPPORTED error).
 */

import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

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

/**
 * Convert WAV buffer to MP3 using ffmpeg.
 * MP3 is universally supported on all mobile browsers.
 * WAV causes "FORMAT_NOT_SUPPORTED" error on many mobile browsers.
 */
async function wavToMp3(wavBuffer: Buffer): Promise<Buffer> {
  const { writeFile, readFile, unlink } = await import("fs/promises");
  const { join } = await import("path");
  const tmpDir = "/tmp";
  const tmpId = `tts_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const wavPath = join(tmpDir, `${tmpId}.wav`);
  const mp3Path = join(tmpDir, `${tmpId}.mp3`);

  try {
    await writeFile(wavPath, wavBuffer);

    await execFileAsync(
      "ffmpeg",
      [
        "-i",
        wavPath,
        "-vn",
        "-ar",
        "44100",
        "-ac",
        "2",
        "-b:a",
        "128k",
        "-f",
        "mp3",
        "-y",
        mp3Path,
      ],
      { timeout: 10000 }
    );

    const mp3Buffer = await readFile(mp3Path);
    return mp3Buffer;
  } finally {
    try {
      await unlink(wavPath);
    } catch {}
    try {
      await unlink(mp3Path);
    } catch {}
  }
}

// Simple LRU cache
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
        "Content-Type": "audio/mpeg",
        "Content-Length": String(cached.length),
        "Cache-Control": "public, max-age=604800",
      },
    });
  }

  try {
    const zai = await getZAI();
    const voice = LANG_VOICES[lang] || "kazi";

    // Generate WAV audio
    const response = await zai.audio.tts.create({
      input: text.trim(),
      voice,
      speed: 0.85,
      response_format: "wav",
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const wavBuffer = Buffer.from(new Uint8Array(arrayBuffer));

    // Convert WAV → MP3 for universal mobile browser support
    const mp3Buffer = await wavToMp3(wavBuffer);

    // Update cache
    if (cache.size >= MAX_CACHE) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }
    cache.set(key, mp3Buffer);

    return new NextResponse(new Uint8Array(mp3Buffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(mp3Buffer.length),
        "Cache-Control": "public, max-age=604800",
      },
    });
  } catch (error: any) {
    console.error("[TTS API] Error:", error?.message || error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
