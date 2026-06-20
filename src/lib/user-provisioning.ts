/**
 * User Provisioning — Auto-create Prisma User records for authenticated users.
 *
 * ═══════════════════════════════════════════
 * WHY DO WE NEED THIS?
 * ═══════════════════════════════════════════
 *
 * When a user signs up (via email or Google OAuth), Supabase creates an Auth
 * user record. But our Prisma database does NOT automatically get a matching
 * User record. This means:
 *
 *   Supabase Auth: ✅ User exists (can log in)
 *   Prisma DB:     ❌ No User record (can't fetch profile, start conversations, etc.)
 *
 * This gap causes the "Failed to load profile — Unexpected end of JSON input" error.
 * The API route crashes because it finds a Supabase user but no Prisma user.
 *
 * ═══════════════════════════════════════════
 * THE FIX: LAZY PROVISIONING
 * ═══════════════════════════════════════════
 *
 * Instead of requiring the signup flow to create the Prisma record,
 * we use "lazy provisioning" — when any API route needs the Prisma user,
 * it checks if the record exists and creates it if missing.
 *
 * This is MORE ROBUST because:
 * 1. It works for email signup, Google OAuth, and any future auth method
 * 2. It self-heals — even if the initial creation somehow fails, it retries
 * 3. It's idempotent — calling it multiple times is safe
 * 4. No need to modify the signup form or OAuth callback
 *
 * HOW IT WORKS:
 * 1. Take the Supabase user object
 * 2. Try to find a matching Prisma User by supabaseUid
 * 3. If found → return it
 * 4. If not found → create one using data from Supabase user_metadata
 * 5. Also create a free Subscription record for the new user
 */

import { db } from "@/lib/db";
import type { User as SupabaseUser } from "@supabase/supabase-js";

/**
 * Get or create a Prisma User record for the given Supabase user.
 *
 * This is the single source of truth for user provisioning.
 * Every API route that needs the Prisma user should call this.
 *
 * @param supabaseUser - The user from supabase.auth.getUser()
 * @returns The Prisma User record (with subscription included)
 */
export async function getOrCreateUser(supabaseUser: SupabaseUser) {
  // 1. Try to find existing user with subscription
  const existingUser = await db.user.findUnique({
    where: { supabaseUid: supabaseUser.id },
    include: {
      subscription: true,
    },
  });

  if (existingUser) {
    return existingUser;
  }

  // 2. User doesn't exist — create one!
  // Extract name from Supabase user_metadata (set during signup)
  const name =
    supabaseUser.user_metadata?.name ||
    supabaseUser.user_metadata?.full_name ||
    supabaseUser.email?.split("@")[0] ||
    "User";

  // Detect auth provider
  const provider = supabaseUser.app_metadata?.provider === "google" ? "google" : "email";

  console.log(
    `[Provisioning] Creating Prisma User for ${supabaseUser.email} (provider: ${provider})`
  );

  // 3. Create the user + free subscription in a transaction
  const newUser = await db.user.create({
    data: {
      supabaseUid: supabaseUser.id,
      email: supabaseUser.email!,
      name,
      provider,
      emailVerified: supabaseUser.confirmed_at ? new Date(supabaseUser.confirmed_at) : null,
      subscription: {
        create: {
          plan: "free",
          status: "active",
          // stripeCustomerId is required by Prisma but not used for free plans
          // We use a generated placeholder that's unique per user
          stripeCustomerId: `free_${supabaseUser.id}`,
        },
      },
    },
    include: {
      subscription: true,
    },
  });

  return newUser;
}
