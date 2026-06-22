/**
 * Admin Users API — List and manage users.
 *
 * GET /api/admin/users — List all users with pagination, search, filter
 * PUT /api/admin/users — Update a user's plan or status
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { errorResponse, successResponse, parseRequestBody } from "@/lib/api-helpers";

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
    const planFilter = searchParams.get("plan") || ""; // "free", "pro", or ""
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    // Build query
    let query = db
      .from("users")
      .select("id, name, email, nativeLanguage, targetLanguage, proficiencyLevel, createdAt", {
        count: "exact",
      });

    // Search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Sorting
    const ascending = sortOrder === "asc";
    query = query.order(sortBy, { ascending });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, count, error: dbError } = await query;

    if (dbError) {
      console.error("[Admin Users API] GET error:", dbError);
      return errorResponse("INTERNAL_ERROR", "Failed to fetch users", 500);
    }

    // Enrich with subscription data
    const enrichedUsers = await Promise.all(
      (users || []).map(async (user: any) => {
        const { data: sub } = await db
          .from("subscriptions")
          .select("plan, status")
          .eq("userId", user.id)
          .maybeSingle();
        return {
          ...user,
          plan: sub?.plan || "free",
          status: sub?.status || "active",
        };
      })
    );

    // Apply plan filter after enrichment (since subscriptions are in a separate table)
    const filteredUsers = planFilter
      ? enrichedUsers.filter((u) => {
          if (planFilter === "free") return u.plan === "free";
          if (planFilter === "pro") return u.plan !== "free";
          return true;
        })
      : enrichedUsers;

    return successResponse({
      users: filteredUsers,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("[Admin Users API] Unhandled error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch users", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return errorResponse("UNAUTHORIZED", "Admin access required", 403);
    }

    const body = await parseRequestBody<{
      userId: string;
      plan?: string;
      status?: string;
    }>(request);

    if (!body || !body.userId) {
      return errorResponse("VALIDATION_ERROR", "userId is required", 400);
    }

    const { userId, plan, status } = body;

    // Check user exists
    const { data: existingUser, error: fetchError } = await db
      .from("users")
      .select("id, email")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError || !existingUser) {
      return errorResponse("NOT_FOUND", "User not found", 404);
    }

    // Update subscription
    const updates: Record<string, string> = {};
    if (plan) updates.plan = plan;
    if (status) updates.status = status;
    updates.updatedAt = new Date().toISOString();

    const { data: updatedSub, error: updateError } = await db
      .from("subscriptions")
      .update(updates)
      .eq("userId", userId)
      .select("plan, status")
      .maybeSingle();

    if (updateError) {
      console.error("[Admin Users API] PUT error:", updateError);
      return errorResponse("INTERNAL_ERROR", "Failed to update user subscription", 500);
    }

    return successResponse({
      userId,
      plan: updatedSub?.plan || plan,
      status: updatedSub?.status || status,
    });
  } catch (error) {
    console.error("[Admin Users API] PUT unhandled error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to update user", 500);
  }
}
