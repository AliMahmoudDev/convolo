/**
 * GET /api/user/profile — Fetch the current user's profile
 * PUT /api/user/profile — Update the current user's profile
 *
 * Uses Supabase JS Client (PostgREST over HTTPS).
 */

import { NextRequest } from "next/server";
import { getAuthUser, errorResponse, successResponse, parseRequestBody } from "@/lib/api-helpers";
import { getOrCreateUser } from "@/lib/user-provisioning";
import { db } from "@/lib/db";

// Fields that are allowed to be updated
const UPDATABLE_FIELDS = ["name", "nativeLanguage", "targetLanguage", "proficiencyLevel"] as const;

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
  try {
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Please log in", 401);
    }

    const dbUser = await getOrCreateUser(user);

    const isPro = dbUser.subscription?.plan !== "free" && dbUser.subscription?.status === "active";

    return successResponse({
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      nativeLanguage: dbUser.nativeLanguage,
      targetLanguage: dbUser.targetLanguage,
      proficiencyLevel: dbUser.proficiencyLevel,
      isPro,
    });
  } catch (error) {
    console.error("[Profile API] GET error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to load profile. Please try again.", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Please log in", 401);
    }

    const dbUser = await getOrCreateUser(user);

    const body = await parseRequestBody<Record<string, unknown>>(request);
    if (!body) {
      return errorResponse("VALIDATION_ERROR", "Invalid request body");
    }

    // Build update data — only allow specific fields
    const updateData: Record<string, unknown> = {};

    for (const field of UPDATABLE_FIELDS) {
      if (field in body) {
        const value = body[field];

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

    if (Object.keys(updateData).length === 0) {
      return errorResponse("VALIDATION_ERROR", "No valid fields to update");
    }

    // Update the user via Supabase
    updateData.updatedAt = new Date().toISOString();

    const { data: updatedUser, error: updateError } = await db
      .from("users")
      .update(updateData as Record<string, never>)
      .eq("id", dbUser.id)
      .select("id, name, email, nativeLanguage, targetLanguage, proficiencyLevel")
      .single();

    if (updateError) {
      console.error("[Profile API] Update error:", updateError);
      return errorResponse("INTERNAL_ERROR", "Failed to update profile", 500);
    }

    // Fetch subscription separately
    const { data: subscription } = await db
      .from("subscriptions")
      .select("plan, status")
      .eq("userId", updatedUser.id)
      .maybeSingle();

    const isPro = subscription?.plan !== "free" && subscription?.status === "active";

    return successResponse({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      nativeLanguage: updatedUser.nativeLanguage,
      targetLanguage: updatedUser.targetLanguage,
      proficiencyLevel: updatedUser.proficiencyLevel,
      isPro,
    });
  } catch (error) {
    console.error("[Profile API] PUT error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to update profile. Please try again.", 500);
  }
}
