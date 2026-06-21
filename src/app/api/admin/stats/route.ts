/**
 * GET /api/admin/stats — Platform overview for admin dashboard.
 *
 * Returns:
 * - Total users, total conversations, total messages
 * - Active users today, this week, this month
 * - Pro vs Free breakdown
 * - Revenue metrics (from subscriptions)
 */

import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-helpers";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return errorResponse("UNAUTHORIZED", "Admin access required", 403);
    }

    // Total users
    const { count: totalUsers } = await db.from("users").select("*", { count: "exact", head: true });

    // Total conversations
    const { count: totalConversations } = await db
      .from("conversations")
      .select("*", { count: "exact", head: true });

    // Total messages
    const { count: totalMessages } = await db
      .from("messages")
      .select("*", { count: "exact", head: true });

    // Pro vs Free breakdown
    const { data: subscriptionBreakdown } = await db
      .from("subscriptions")
      .select("plan");

    const proCount = (subscriptionBreakdown || []).filter(
      (s) => s.plan !== "free" && s.plan !== null
    ).length;
    const freeCount = (subscriptionBreakdown || []).filter(
      (s) => s.plan === "free" || s.plan === null
    ).length;

    // Active users today
    const today = new Date().toISOString().split("T")[0];
    const { count: activeToday } = await db
      .from("daily_usage")
      .select("*", { count: "exact", head: true })
      .eq("date", today);

    // Active users this week (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: weekData } = await db
      .from("daily_usage")
      .select("userId")
      .gte("date", weekAgo.toISOString().split("T")[0]);
    const activeThisWeek = new Set((weekData || []).map((d) => d.userId)).size;

    // Active users this month (last 30 days)
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const { data: monthData } = await db
      .from("daily_usage")
      .select("userId")
      .gte("date", monthAgo.toISOString().split("T")[0]);
    const activeThisMonth = new Set((monthData || []).map((d) => d.userId)).size;

    // Revenue metrics — count active paid subscriptions
    const { count: activeProSubscriptions } = await db
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .neq("plan", "free")
      .eq("status", "active");

    // Recent signups (last 10)
    const { data: recentSignups } = await db
      .from("users")
      .select("id, name, email, nativeLanguage, targetLanguage, proficiencyLevel, createdAt")
      .order("createdAt", { ascending: false })
      .limit(10);

    // Enrich recent signups with subscription data
    const enrichedSignups = await Promise.all(
      (recentSignups || []).map(async (user) => {
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

    return successResponse({
      totalUsers: totalUsers || 0,
      totalConversations: totalConversations || 0,
      totalMessages: totalMessages || 0,
      activeUsersToday: activeToday || 0,
      activeUsersThisWeek: activeThisWeek,
      activeUsersThisMonth: activeThisMonth,
      proUsers: proCount,
      freeUsers: freeCount,
      activeProSubscriptions: activeProSubscriptions || 0,
      recentSignups: enrichedSignups,
    });
  } catch (error) {
    console.error("[Admin Stats API] Error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch platform stats", 500);
  }
}
