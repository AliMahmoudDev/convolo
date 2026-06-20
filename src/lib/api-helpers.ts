/**
 * API Route Helpers — shared utilities for API routes.
 *
 * WHY: Every API route needs to:
 * 1. Get the authenticated user from Supabase session
 * 2. Return consistent error responses
 * 3. Parse request bodies
 *
 * Instead of duplicating this code in every route, we centralize it here.
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Get the authenticated user from the request session.
 *
 * Returns the user object if authenticated, or null if not.
 * This function reads the Supabase session cookies from the request.
 *
 * WHY: Every protected API route needs to verify auth.
 * This function does it in one line instead of 5+ lines per route.
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Create a standardized error response.
 *
 * WHY: All API errors must follow the same format:
 * { success: false, error: { code: string, message: string } }
 *
 * This ensures the frontend can handle errors consistently.
 */
export function errorResponse(code: string, message: string, status: number = 400) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
    },
    { status }
  );
}

/**
 * Create a standardized success response.
 */
export function successResponse(data: unknown, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Parse the JSON body from a request.
 *
 * WHY: We could use `await request.json()` directly,
 * but that throws on invalid JSON. This wraps it in a try/catch
 * and returns a consistent error response.
 */
export async function parseRequestBody<T>(request: NextRequest): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
