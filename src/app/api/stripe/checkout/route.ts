/**
 * POST /api/stripe/checkout — Create a Stripe Checkout session for Pro subscription
 *
 * Flow:
 * 1. Authenticate user via Supabase session
 * 2. Get or create the user record + subscription record
 * 3. Create a Stripe Checkout session with the configured price ID
 * 4. Return the checkout session URL for the frontend to redirect to
 *
 * Environment variables:
 * - STRIPE_SECRET_KEY: Server-side Stripe secret key (sk_test_...)
 * - STRIPE_PRICE_ID: The Stripe Price ID for the Pro plan (price_...)
 */

import Stripe from "stripe";
import { getAuthUser, errorResponse, successResponse } from "@/lib/api-helpers";
import { getOrCreateUser } from "@/lib/user-provisioning";
import { db, generateId } from "@/lib/db";

// Lazy Stripe client — avoids crash at build time when STRIPE_SECRET_KEY is empty
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
      return errorResponse("UNAUTHORIZED", "Please log in to subscribe", 401);
    }

    // 2. Get or create the user record
    const dbUser = await getOrCreateUser(user);

    // Already a Pro subscriber? No need to create another checkout
    if (dbUser.subscription?.plan !== "free" && dbUser.subscription?.status === "active") {
      return errorResponse(
        "ALREADY_SUBSCRIBED",
        "You already have an active Pro subscription",
        400
      );
    }

    // 3. Fetch or create the subscription record to get the Stripe customer ID
    const { data: existingSub } = await db
      .from("subscriptions")
      .select("id, stripeCustomerId")
      .eq("userId", dbUser.id)
      .maybeSingle();

    let stripeCustomerId = existingSub?.stripeCustomerId;

    // If the existing stripeCustomerId is a placeholder (free_...), create a real one
    if (!stripeCustomerId || stripeCustomerId.startsWith("free_")) {
      // Create a Stripe Customer
      const customer = await getStripe().customers.create({
        email: dbUser.email,
        name: dbUser.name,
        metadata: {
          userId: dbUser.id,
        },
      });

      stripeCustomerId = customer.id;

      // Update or create the subscription record
      if (existingSub) {
        await db
          .from("subscriptions")
          .update({ stripeCustomerId, updatedAt: new Date().toISOString() })
          .eq("id", existingSub.id);
      } else {
        await db.from("subscriptions").insert({
          id: generateId(),
          userId: dbUser.id,
          stripeCustomerId,
          plan: "free",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 4. Determine the origin for success/cancel URLs
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";

    // 5. Create a Stripe Checkout session
    const checkoutSession = await getStripe().checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID || "",
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?upgraded=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
      metadata: {
        userId: dbUser.id,
      },
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          userId: dbUser.id,
        },
      },
    });

    return successResponse({ url: checkoutSession.url });
  } catch (error) {
    console.error("[Stripe Checkout] Error:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "Failed to create checkout session. Please try again.",
      500
    );
  }
}
