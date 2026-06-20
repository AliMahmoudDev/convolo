/**
 * Auth Callback Route Handler
 *
 * This is the CRITICAL piece that makes OAuth work!
 *
 * HOW OAUTH FLOW WORKS:
 * 1. User clicks "Continue with Google"
 * 2. Google authenticates the user
 * 3. Google redirects to Supabase's callback URL with an auth code
 * 4. Supabase exchanges the code for a session
 * 5. Supabase redirects the user to OUR site with ?code=xxx in the URL
 * 6. THIS route handler catches that redirect, exchanges the code for a session,
 *    and redirects the user to the dashboard
 *
 * WITHOUT this handler, the user gets redirected to the site URL with ?code=xxx
 * but nothing processes the code — so they're not actually logged in!
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  // The `next` param tells us where to redirect after login
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Success! Redirect to the dashboard or the `next` page
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("[Auth Callback] Code exchange failed:", error.message);
  }

  // If there's no code or exchange failed, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
