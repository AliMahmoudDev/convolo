/**
 * POST /api/auth/reset-password
 *
 * Triggers a password-reset email via Supabase Auth.
 * Always returns success (security best practice — prevents email enumeration).
 */

import { db } from "@/lib/db";
import { errorResponse, parseRequestBody, successResponse } from "@/lib/api-helpers";

export async function POST(request: Request) {
  const body = await parseRequestBody<{ email?: string }>(request as never);

  if (!body?.email) {
    return errorResponse("MISSING_EMAIL", "Please provide your email address.", 400);
  }

  const email = body.email.trim().toLowerCase();

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return errorResponse("INVALID_EMAIL", "Please enter a valid email address.", 400);
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://convolo.vercel.app";

    const { error: resetError } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/callback?next=/settings`,
    });

    // Intentionally ignore the error response to prevent email enumeration.
    // Supabase will silently not send an email if the account doesn't exist.
    if (resetError) {
      console.warn("[ResetPassword] Supabase returned an error:", resetError.message);
    }
  } catch (err) {
    // Log but don't expose to the client
    console.error("[ResetPassword] Unexpected error:", err);
  }

  // Always return success to prevent email enumeration attacks
  return successResponse({
    message: "If an account with that email exists, we've sent a password reset link.",
  });
}
