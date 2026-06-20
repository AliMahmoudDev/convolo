/**
 * GET /api/user/profile — Fetch the current user's profile
 *
 * Returns: language preferences, proficiency level, subscription status
 * Used by the frontend to pre-fill language selectors and check access.
 *
 * PUT /api/user/profile — Update the current user's profile
 *
 * Accepts partial updates: { name, nativeLanguage, targetLanguage, proficiencyLevel }
 * Only the fields you send will be updated (the rest stay the same).
 */

import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse, parseRequestBody } from "@/lib/api-helpers";
import { db } from "@/lib/db";

// Fields that are allowed to be updated
const UPDATABLE_FIELDS = ["name", "nativeLanguage", "targetLanguage", "proficiencyLevel"] as const;
type UpdatableField = (typeof UPDATABLE_FIELDS)[number];

// Valid values for enum-like fields
const VALID_PROFICIENCY_LEVELS = ["beginner", "intermediate", "advanced"];
const VALID_LANGUAGE_CODES = [
  "en",
  "ar",
  "es",
  "fr",
  "de",
  "ja",
  "ko",
  "zh",
  "pt",
  "it",
  "ru",
  "hi",
  "tr",
];

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

export async function PUT(request: NextRequest) {
  // 1. Authenticate
  const user = await getAuthUser();
  if (!user) {
    return errorResponse("UNAUTHORIZED", "Please log in", 401);
  }

  // 2. Parse and validate request body
  const body = await parseRequestBody<Record<string, unknown>>(request);
  if (!body) {
    return errorResponse("VALIDATION_ERROR", "Invalid request body");
  }

  // 3. Build update data — only allow specific fields
  const updateData: Record<string, unknown> = {};

  for (const field of UPDATABLE_FIELDS) {
    if (field in body) {
      const value = body[field];

      // Validate specific fields
      if (field === "name") {
        if (typeof value !== "string" || value.trim().length === 0) {
          return errorResponse("VALIDATION_ERROR", "Name cannot be empty");
        }
        updateData[field] = value.trim();
      } else if (field === "proficiencyLevel") {
        if (typeof value !== "string" || !VALID_PROFICIENCY_LEVELS.includes(value)) {
          return errorResponse(
            "VALIDATION_ERROR",
            `Proficiency level must be one of: ${VALID_PROFICIENCY_LEVELS.join(", ")}`
          );
        }
        updateData[field] = value;
      } else if (field === "nativeLanguage" || field === "targetLanguage") {
        // targetLanguage can be null (not selected yet)
        if (value === null || value === "") {
          if (field === "nativeLanguage") {
            return errorResponse("VALIDATION_ERROR", "Native language is required");
          }
          updateData[field] = null;
        } else if (typeof value === "string" && VALID_LANGUAGE_CODES.includes(value)) {
          updateData[field] = value;
        } else {
          return errorResponse("VALIDATION_ERROR", `Invalid language code: ${value}`);
        }
      }
    }
  }

  // 4. Check that at least one valid field was provided
  if (Object.keys(updateData).length === 0) {
    return errorResponse("VALIDATION_ERROR", "No valid fields to update");
  }

  // 5. Update the user
  const updatedUser = await db.user.update({
    where: { supabaseUid: user.id },
    data: updateData,
    include: {
      subscription: { select: { plan: true, status: true } },
    },
  });

  const isPro =
    updatedUser.subscription?.plan !== "free" && updatedUser.subscription?.status === "active";

  // 6. Return updated profile
  return successResponse({
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    nativeLanguage: updatedUser.nativeLanguage,
    targetLanguage: updatedUser.targetLanguage,
    proficiencyLevel: updatedUser.proficiencyLevel,
    isPro,
  });
}
