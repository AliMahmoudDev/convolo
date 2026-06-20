import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing Supabase environment variables:\n",
    "  NEXT_PUBLIC_SUPABASE_URL:",
    supabaseUrl ? "✓ set" : "✗ missing",
    "\n",
    "  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:",
    supabaseKey ? "✓ set" : "✗ missing"
  );
}

export const createClient = () =>
  createBrowserClient(
    supabaseUrl ?? "https://missing-env.supabase.co",
    supabaseKey ?? "missing-env-key"
  );
