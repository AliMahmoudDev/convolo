/**
 * GET /api/scenarios — List published conversation scenarios
 *
 * Fetches scenarios from the database, optionally filtered by:
 * - languagePair: e.g., "en-ar" (optional)
 * - difficultyLevel: "beginner" | "intermediate" | "advanced" (optional)
 *
 * Only returns published scenarios (isPublished = true).
 * For non-pro users, filters out premium scenarios.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-helpers";
import { getOrCreateUser } from "@/lib/user-provisioning";

export async function GET(request: NextRequest) {
  try {
    let isPro = false;

    try {
      const user = await getAuthUser();
      if (user) {
        const dbUser = await getOrCreateUser(user);
        isPro = dbUser.subscription?.plan !== "free" && dbUser.subscription?.status === "active";
      }
    } catch {
      // Not authenticated — show only free scenarios
    }

    const { searchParams } = new URL(request.url);
    const languagePair = searchParams.get("languagePair");
    const difficultyLevel = searchParams.get("difficultyLevel");

    let query = db
      .from("scenarios")
      .select(
        "id, title, description, languagePair, category, difficultyLevel, openingLine, keyVocabulary, culturalNotes, estimatedMinutes, isPremium, isPublished, sortOrder"
      )
      .eq("isPublished", true)
      .order("sortOrder", { ascending: true });

    if (languagePair) {
      query = query.eq("languagePair", languagePair);
    }
    if (difficultyLevel) {
      query = query.eq("difficultyLevel", difficultyLevel);
    }

    const { data: scenarios, error: dbError } = await query;

    if (dbError) {
      console.error("[Scenarios API] GET error:", dbError);
      return errorResponse("INTERNAL_ERROR", "Failed to fetch scenarios", 500);
    }

    const filtered = (scenarios || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      languagePair: s.languagePair,
      category: s.category,
      difficultyLevel: s.difficultyLevel,
      openingLine: s.openingLine,
      keyVocabulary: s.keyVocabulary,
      culturalNotes: s.culturalNotes,
      estimatedMinutes: s.estimatedMinutes,
      isPremium: s.isPremium,
      isLocked: s.isPremium && !isPro,
    }));

    return successResponse({ scenarios: filtered });
  } catch (error) {
    console.error("[Scenarios API] Unhandled error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch scenarios", 500);
  }
}
