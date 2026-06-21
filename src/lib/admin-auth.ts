/**
 * Admin Auth — Middleware helper for admin-only API routes.
 *
 * Checks if the authenticated user's email is in the ADMIN_EMAILS env var.
 * Returns the AppUser if admin, or null if not.
 */

import { getAuthUser } from "@/lib/api-helpers";
import { getOrCreateUser, type AppUser } from "@/lib/user-provisioning";

export async function requireAdmin(): Promise<AppUser | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const dbUser = await getOrCreateUser(user);

  // For MVP: check if user email is in ADMIN_EMAILS env var
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  if (!adminEmails.includes(dbUser.email.toLowerCase())) return null;

  return dbUser;
}
