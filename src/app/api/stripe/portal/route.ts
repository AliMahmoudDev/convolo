/**
 * POST /api/stripe/portal — Create a Stripe Customer Portal session
 *
 * Flow:
 * 1. Authenticate user
 * 2. Look up the user's Stripe customer ID from the subscription record
 * 3. Create a Stripe Customer Portal session for managing their subscription
 * 4. Return the portal URL for the frontend to redirect to
 *
 * Environment variables:
 * - STRIPE_SECRET_KEY: Server-side Stripe secret key (sk_test_...)
 */

import Stripe from "stripe";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-helpers";
import { getOrCreateUser } from "@/lib/user-provisioning";
import { db } from "@/lib/db";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const user = await getAuthUser();
    if (!user) {
      return errorResponse("UNAUTHORIZED", "Please log in to manage your subscription", 401);
    }

    // 2. Get the user record + subscription
    const dbUser = await getOrCreateUser(user);

    // 3. Get Stripe customer ID
    const { data: subscription } = await db
      .from("subscriptions")
      .select("stripeCustomerId")
      .eq("userId", dbUser.id)
      .maybeSingle();

    if (!subscription?.stripeCustomerId || subscription.stripeCustomerId.startsWith("free_")) {
      return errorResponse(
        "NO_SUBSCRIPTION",
        "No Stripe customer found. Please subscribe first.",
        400
      );
    }

    // 4. Determine the origin for return URL
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";

    // 5. Create a Customer Portal session
    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${origin}/dashboard`,
    });

    return successResponse({ url: portalSession.url });
  } catch (error) {
    console.error("[Stripe Portal] Error:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "Failed to create portal session. Please try again.",
      500
    );
  }
}
