/**
 * Admin Scenarios API — Manage conversation scenarios.
 *
 * GET /api/admin/scenarios — List all scenarios (including unpublished)
 * POST /api/admin/scenarios — Create new scenario
 * PUT /api/admin/scenarios — Update scenario
 * DELETE /api/admin/scenarios — Delete scenario
 *
 * Enrichment fields: keyVocabulary, culturalNotes, estimatedMinutes, systemPrompt
 * Language pair: Constructed from nativeLanguage + targetLanguage (NOT hardcoded "en-")
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db, generateId } from "@/lib/db";
import { errorResponse, successResponse, parseRequestBody } from "@/lib/api-helpers";

const SCENARIO_FIELDS =
  "id, title, description, languagePair, category, difficultyLevel, openingLine, keyVocabulary, culturalNotes, estimatedMinutes, systemPrompt, isPremium, isPublished, sortOrder, createdAt, updatedAt";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return errorResponse("UNAUTHORIZED", "Admin access required", 403);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const published = searchParams.get("published"); // "true", "false", or null

    const offset = (page - 1) * limit;

    let query = db.from("scenarios").select(SCENARIO_FIELDS, { count: "exact" });

    // Search
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Category filter
    if (category) {
      query = query.eq("category", category);
    }

    // Published filter
    if (published === "true") {
      query = query.eq("isPublished", true);
    } else if (published === "false") {
      query = query.eq("isPublished", false);
    }

    // Sort
    query = query.order("createdAt", { ascending: false });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: scenarios, count, error: dbError } = await query;

    if (dbError) {
      console.error("[Admin Scenarios API] GET error:", dbError);
      return errorResponse("INTERNAL_ERROR", "Failed to fetch scenarios", 500);
    }

    return successResponse({
      scenarios: scenarios || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("[Admin Scenarios API] Unhandled error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch scenarios", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return errorResponse("UNAUTHORIZED", "Admin access required", 403);
    }

    const body = await parseRequestBody<{
      title: string;
      description: string;
      category: string;
      difficultyLevel: string;
      nativeLanguage?: string;
      targetLanguage?: string;
      openingLine?: string;
      keyVocabulary?: string[];
      culturalNotes?: string;
      estimatedMinutes?: number | null;
      systemPrompt?: string;
      languagePair?: string;
      isPremium?: boolean;
      isPublished?: boolean;
    }>(request);

    if (!body || !body.title || !body.description || !body.category) {
      return errorResponse(
        "VALIDATION_ERROR",
        "title, description, and category are required",
        400
      );
    }

    // Build language pair from nativeLanguage + targetLanguage (NOT hardcoded "en-")
    const nativeLang = body.nativeLanguage || "en";
    const targetLang = body.targetLanguage || "ar";
    const languagePair = body.languagePair || `${nativeLang}-${targetLang}`;

    const now = new Date().toISOString();
    const id = generateId();

    const { data: scenario, error: dbError } = await db
      .from("scenarios")
      .insert({
        id,
        title: body.title,
        description: body.description,
        languagePair,
        category: body.category,
        difficultyLevel: body.difficultyLevel || "intermediate",
        systemPrompt:
          body.systemPrompt ||
          `You are a ${targetLang} language conversation partner. Help the user practice ${targetLang} through natural conversation. Provide corrections and feedback when they make mistakes.`,
        openingLine: body.openingLine || "Hello! Let's start practicing.",
        keyVocabulary: Array.isArray(body.keyVocabulary) ? body.keyVocabulary : [],
        culturalNotes: body.culturalNotes || null,
        estimatedMinutes: body.estimatedMinutes || null,
        isPremium: body.isPremium || false,
        isPublished: body.isPublished || false,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      })
      .select(SCENARIO_FIELDS)
      .single();

    if (dbError) {
      console.error("[Admin Scenarios API] POST error:", dbError);
      return errorResponse("INTERNAL_ERROR", "Failed to create scenario", 500);
    }

    return successResponse({ scenario }, 201);
  } catch (error) {
    console.error("[Admin Scenarios API] POST unhandled error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to create scenario", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return errorResponse("UNAUTHORIZED", "Admin access required", 403);
    }

    const body = await parseRequestBody<{
      id: string;
      title?: string;
      description?: string;
      category?: string;
      difficultyLevel?: string;
      nativeLanguage?: string;
      targetLanguage?: string;
      openingLine?: string;
      keyVocabulary?: string[];
      culturalNotes?: string;
      estimatedMinutes?: number | null;
      systemPrompt?: string;
      languagePair?: string;
      isPremium?: boolean;
      isPublished?: boolean;
    }>(request);

    if (!body || !body.id) {
      return errorResponse("VALIDATION_ERROR", "Scenario id is required", 400);
    }

    // Build updates object (only include fields that were provided)
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category !== undefined) updates.category = body.category;
    if (body.difficultyLevel !== undefined) updates.difficultyLevel = body.difficultyLevel;
    if (body.openingLine !== undefined) updates.openingLine = body.openingLine;
    if (body.isPremium !== undefined) updates.isPremium = body.isPremium;
    if (body.isPublished !== undefined) updates.isPublished = body.isPublished;
    if (body.systemPrompt !== undefined) updates.systemPrompt = body.systemPrompt;
    if (body.keyVocabulary !== undefined) updates.keyVocabulary = body.keyVocabulary;
    if (body.culturalNotes !== undefined) updates.culturalNotes = body.culturalNotes;
    if (body.estimatedMinutes !== undefined) updates.estimatedMinutes = body.estimatedMinutes;

    // FIX: Build language pair from nativeLanguage + targetLanguage
    // NOT hardcoded "en-" anymore
    if (body.targetLanguage !== undefined || body.nativeLanguage !== undefined) {
      // If we have both, use them directly
      if (body.nativeLanguage && body.targetLanguage) {
        updates.languagePair = `${body.nativeLanguage}-${body.targetLanguage}`;
      } else if (body.targetLanguage) {
        // Only targetLanguage provided — need to fetch existing nativeLanguage
        const { data: existing } = await db
          .from("scenarios")
          .select("languagePair")
          .eq("id", body.id)
          .maybeSingle();

        const existingNative = existing?.languagePair?.split("-")[0] || "en";
        updates.languagePair = `${existingNative}-${body.targetLanguage}`;
      } else if (body.nativeLanguage) {
        // Only nativeLanguage provided — need to fetch existing targetLanguage
        const { data: existing } = await db
          .from("scenarios")
          .select("languagePair")
          .eq("id", body.id)
          .maybeSingle();

        const existingTarget = existing?.languagePair?.split("-")[1] || "ar";
        updates.languagePair = `${body.nativeLanguage}-${existingTarget}`;
      }
    }

    // Also support explicit languagePair override
    if (body.languagePair !== undefined) {
      updates.languagePair = body.languagePair;
    }

    const { data: scenario, error: dbError } = await db
      .from("scenarios")
      .update(updates)
      .eq("id", body.id)
      .select(SCENARIO_FIELDS)
      .maybeSingle();

    if (dbError) {
      console.error("[Admin Scenarios API] PUT error:", dbError);
      return errorResponse("INTERNAL_ERROR", "Failed to update scenario", 500);
    }

    if (!scenario) {
      return errorResponse("NOT_FOUND", "Scenario not found", 404);
    }

    return successResponse({ scenario });
  } catch (error) {
    console.error("[Admin Scenarios API] PUT unhandled error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to update scenario", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return errorResponse("UNAUTHORIZED", "Admin access required", 403);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return errorResponse("VALIDATION_ERROR", "Scenario id is required", 400);
    }

    const { error: dbError } = await db.from("scenarios").delete().eq("id", id);

    if (dbError) {
      console.error("[Admin Scenarios API] DELETE error:", dbError);
      return errorResponse("INTERNAL_ERROR", "Failed to delete scenario", 500);
    }

    return successResponse({ deleted: true });
  } catch (error) {
    console.error("[Admin Scenarios API] DELETE unhandled error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to delete scenario", 500);
  }
}
