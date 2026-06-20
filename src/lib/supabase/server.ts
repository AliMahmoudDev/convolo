import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = async () => {
  const cookieStore = await cookies();

  // During build time (SSG/SSG prerender), env vars may not be available.
  // Return a dummy client that won't crash the build.
  // The middleware already skips auth checks when env vars are missing.
  if (!supabaseUrl || !supabaseKey) {
    return createServerClient("https://placeholder.supabase.co", "placeholder-key", {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op during build
        },
      },
    });
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
    },
  });
};
