/**
 * Convolo Database Client — Supabase JS Client (PostgREST over HTTPS)
 *
 * WHY Supabase JS Client instead of Prisma?
 * - Prisma requires a direct TCP connection to PostgreSQL (port 5432)
 * - On Vercel Lambda, this fails because:
 *   1. Direct connection: IPv6-only, Vercel doesn't support IPv6 outbound
 *   2. Supavisor pooler: "tenant not found" errors on Free tier
 * - Supabase JS Client uses PostgREST over HTTPS (port 443), which works everywhere
 *
 * Column names are camelCase as returned by PostgREST.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (
  (!supabaseUrl || !supabaseServiceKey) &&
  process.env.NODE_ENV === "production" &&
  typeof window === "undefined"
) {
  // Only warn in server-side production, don't crash the build
  // The actual API routes will fail at request time if the keys are missing
  console.warn(
    "[DB] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — DB operations will fail"
  );
}

const globalForSupabase = globalThis as unknown as {
  supabaseAdmin: ReturnType<typeof createClient<Database>> | undefined;
};

export const db =
  globalForSupabase.supabaseAdmin ??
  createClient<Database>(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseServiceKey || "placeholder-key",
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

if (process.env.NODE_ENV !== "production" && supabaseUrl) globalForSupabase.supabaseAdmin = db;

/** Generate a new UUID for database records */
export function generateId(): string {
  return crypto.randomUUID();
}

/** Get today's date as a string (YYYY-MM-DD) for daily_usage queries */
export function todayDateString(): string {
  return new Date().toISOString().split("T")[0];
}
