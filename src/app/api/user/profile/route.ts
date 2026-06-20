/**
 * GET /api/user/profile — Fetch the current user's profile
 *
 * Returns: language preferences, proficiency level, subscription status
 * Used by the frontend to pre-fill language selectors and check access.
 */

import { getAuthUser, errorResponse, successResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";

export async function GET() {
  // 1. Authenticate
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("UNAUTHORIZED", "Please log in", 401);
  }

  // 2. Fetch user profile with subscription
  const dbUser = await db.user.findUnique({
    where: { supabaseUid: user.id },
    include: {
      subscription: { select: { plan: true, status: true } },
    },
  });

  if (!dbUser) {
    return errorResponse("NOT_FOUND", "User profile not found", 404);
  }

  const isPro = dbUser.subscription?.plan !== "free" && dbUser.subscription?.status === "active";

  // 3. Return profile data
  return successResponse({
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    nativeLanguage: dbUser.nativeLanguage,
    targetLanguage: dbUser.targetLanguage,
    proficiencyLevel: dbUser.proficiencyLevel,
    isPro,
  });
}
