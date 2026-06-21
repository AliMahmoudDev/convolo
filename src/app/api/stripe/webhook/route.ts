/**
 * POST /api/stripe/webhook — Handle Stripe webhook events
 *
 * Flow:
 * 1. Read the raw request body (required for signature verification)
 * 2. Verify the webhook signature using STRIPE_WEBHOOK_SECRET
 * 3. Route the event to the appropriate handler
 *
 * Handled events:
 * - checkout.session.completed: Upgrade user to Pro
 * - customer.subscription.updated: Update subscription status
 * - customer.subscription.deleted: Downgrade to Free
 *
 * Environment variables:
 * - STRIPE_SECRET_KEY: Server-side Stripe secret key (sk_test_...)
 * - STRIPE_WEBHOOK_SECRET: Stripe webhook signing secret (whsec_...)
 */

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Map Stripe subscription status to our SubscriptionStatus enum values.
 */
function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    case "trialing":
      return "active";
    case "unpaid":
      return "past_due";
    case "paused":
      return "canceled";
    default:
      return "incomplete";
  }
}

/**
 * Map Stripe price ID to our SubscriptionPlan enum values.
 */
function mapStripePriceToPlan(priceId: string | null): string {
  if (!priceId) return "free";
  // If a STRIPE_YEARLY_PRICE_ID is set and matches, assign pro_yearly
  if (process.env.STRIPE_YEARLY_PRICE_ID && priceId === process.env.STRIPE_YEARLY_PRICE_ID) {
    return "pro_yearly";
  }
  // Default to pro_monthly for any other price ID
  return "pro_monthly";
}

// ─── Event Handlers ───

/**
 * Handle checkout.session.completed — upgrade user to Pro
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("[Stripe Webhook] No userId in checkout session metadata");
    return;
  }

  // Retrieve the subscription from Stripe to get full details
  const subscriptionId = session.subscription as string;
  let subscription: Stripe.Subscription | null = null;

  if (subscriptionId) {
    subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  }

  const plan = mapStripePriceToPlan(subscription?.items?.data?.[0]?.price?.id ?? null);
  const status = subscription ? mapStripeStatus(subscription.status) : "active";

  const now = new Date().toISOString();

  // Update the subscription record
  const { error } = await db
    .from("subscriptions")
    .update({
      plan,
      status,
      stripeSubscriptionId: subscriptionId || null,
      stripePriceId: subscription?.items?.data?.[0]?.price?.id || null,
      currentPeriodStart: subscription ? new Date((subscription as any).current_period_start * 1000).toISOString() : null,
      currentPeriodEnd: subscription ? new Date((subscription as any).current_period_end * 1000).toISOString() : null,
      cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
      trialStart: subscription?.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trialEnd: subscription?.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      updatedAt: now,
    })
    .eq("userId", userId);

  if (error) {
    console.error("[Stripe Webhook] Error updating subscription on checkout completed:", error);
  } else {
    console.log(`[Stripe Webhook] User ${userId} upgraded to ${plan}`);
  }
}

/**
 * Handle customer.subscription.updated — update subscription status
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user by Stripe customer ID
  const { data: subRecord, error: fetchError } = await db
    .from("subscriptions")
    .select("id, userId")
    .eq("stripeCustomerId", customerId)
    .maybeSingle();

  if (fetchError || !subRecord) {
    console.error("[Stripe Webhook] No subscription found for customer:", customerId);
    return;
  }

  const plan = mapStripePriceToPlan(subscription.items?.data?.[0]?.price?.id ?? null);
  const status = mapStripeStatus(subscription.status);

  const now = new Date().toISOString();

  const { error } = await db
    .from("subscriptions")
    .update({
      plan,
      status,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items?.data?.[0]?.price?.id || null,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      updatedAt: now,
    })
    .eq("id", subRecord.id);

  if (error) {
    console.error("[Stripe Webhook] Error updating subscription:", error);
  } else {
    console.log(`[Stripe Webhook] Subscription updated for user ${subRecord.userId}: ${plan} / ${status}`);
  }
}

/**
 * Handle customer.subscription.deleted — downgrade to Free
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user by Stripe customer ID
  const { data: subRecord, error: fetchError } = await db
    .from("subscriptions")
    .select("id, userId")
    .eq("stripeCustomerId", customerId)
    .maybeSingle();

  if (fetchError || !subRecord) {
    console.error("[Stripe Webhook] No subscription found for customer:", customerId);
    return;
  }

  const now = new Date().toISOString();

  const { error } = await db
    .from("subscriptions")
    .update({
      plan: "free",
      status: "active",
      stripeSubscriptionId: null,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
      updatedAt: now,
    })
    .eq("id", subRecord.id);

  if (error) {
    console.error("[Stripe Webhook] Error downgrading subscription:", error);
  } else {
    console.log(`[Stripe Webhook] User ${subRecord.userId} downgraded to free`);
  }
}

// ─── Main Handler ───

export async function POST(request: Request) {
  // 1. Read the raw body (required for Stripe signature verification)
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    console.error("[Stripe Webhook] Missing stripe-signature header");
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // 2. Verify the webhook signature
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stripe Webhook] Signature verification failed:", message);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  // 3. Route the event to the appropriate handler
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[Stripe Webhook] Error handling event:", event.type, err);
    // Return 500 so Stripe retries the webhook
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  // Always return 200 to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}
