import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a dummy client that won't crash during build
    // Real auth will only work when env vars are set
    client = createBrowserClient("https://placeholder.supabase.co", "placeholder-key");
    return client;
  }

  client = createBrowserClient(url, key);
  return client;
}
