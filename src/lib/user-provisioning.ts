/**
 * User Provisioning — Auto-create User records for authenticated Supabase users.
 *
 * Lazy Provisioning: when any API route needs the user, it checks if the
 * record exists and creates it if missing. This works for all auth methods
 * (email, Google OAuth, etc.) and self-heals if initial creation fails.
 *
 * Uses Supabase JS Client (PostgREST over HTTPS).
 */

import { db } from "@/lib/db";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// App-level user shape (from DB, with subscription info)
export interface AppUser {
  id: string;
  email: string;
  name: string;
  supabaseUid: string | null;
  nativeLanguage: string;
  targetLanguage: string | null;
  proficiencyLevel: string;
  subscription?: {
    plan: string;
    status: string;
  } | null;
}

/**
 * Get or create a User record for the given Supabase auth user.
 *
 * This is the single source of truth for user provisioning.
 * Every API route that needs the user should call this.
 */
export async function getOrCreateUser(supabaseUser: SupabaseUser): Promise<AppUser> {
  // 1. Try to find existing user
  const { data: existingUser, error: fetchError } = await db
    .from("users")
    .select("id, email, name, supabaseUid, nativeLanguage, targetLanguage, proficiencyLevel")
    .eq("supabaseUid", supabaseUser.id)
    .maybeSingle();

  if (existingUser && !fetchError) {
    // Fetch subscription
    const { data: subscription } = await db
      .from("subscriptions")
      .select("plan, status")
      .eq("userId", existingUser.id)
      .maybeSingle();

    return {
      ...existingUser,
      subscription: subscription || null,
    };
  }

  // 2. User doesn't exist — create one!
  const name =
    supabaseUser.user_metadata?.name ||
    supabaseUser.user_metadata?.full_name ||
    supabaseUser.email?.split("@")[0] ||
    "User";

  console.log(`[Provisioning] Creating User for ${supabaseUser.email}`);

  const now = new Date().toISOString();
  const userId = crypto.randomUUID();

  // Create user
  const { data: newUser, error: createError } = await db
    .from("users")
    .insert({
      id: userId,
      supabaseUid: supabaseUser.id,
      email: supabaseUser.email!,
      name,
      provider: supabaseUser.app_metadata?.provider === "google" ? "google" : "email",
      nativeLanguage: "en",
      proficiencyLevel: "beginner",
      createdAt: now,
      updatedAt: now,
    })
    .select("id, email, name, supabaseUid, nativeLanguage, targetLanguage, proficiencyLevel")
    .single();

  if (createError) {
    console.error("[Provisioning] Error creating user:", createError);
    // Maybe the user was created by a concurrent request — try fetching again
    const { data: retryUser } = await db
      .from("users")
      .select("id, email, name, supabaseUid, nativeLanguage, targetLanguage, proficiencyLevel")
      .eq("supabaseUid", supabaseUser.id)
      .maybeSingle();

    if (retryUser) {
      const { data: subscription } = await db
        .from("subscriptions")
        .select("plan, status")
        .eq("userId", retryUser.id)
        .maybeSingle();

      return {
        ...retryUser,
        subscription: subscription || null,
      };
    }

    throw new Error("Failed to create user record");
  }

  // Create free subscription
  await db.from("subscriptions").insert({
    id: crypto.randomUUID(),
    userId: newUser.id,
    plan: "free",
    status: "active",
    stripeCustomerId: `free_${supabaseUser.id}`,
    createdAt: now,
    updatedAt: now,
  });

  return {
    ...newUser,
    subscription: { plan: "free", status: "active" },
  };
}
