# Stripe Integration — Task Complete

## Task ID: stripe-integration-main

## Summary

Implemented full Stripe integration for Convolo — a language learning SaaS app. This includes checkout session creation, webhook handling, customer portal access, and UI updates across pricing, dashboard, and profile pages.

## Files Created

1. **`/src/app/api/stripe/checkout/route.ts`** — POST endpoint that creates a Stripe Checkout session for Pro subscription. Authenticates user, gets/creates Stripe customer, creates checkout session with trial period.
2. **`/src/app/api/stripe/webhook/route.ts`** — POST endpoint that handles Stripe webhook events. Verifies signature using raw body. Handles: `checkout.session.completed` (upgrade to Pro), `customer.subscription.updated` (update status), `customer.subscription.deleted` (downgrade to Free).
3. **`/src/app/api/stripe/portal/route.ts`** — POST endpoint that creates a Stripe Customer Portal session for managing subscriptions.

## Files Modified

1. **`/src/app/(marketing)/pricing/page.tsx`** — Converted to client component. Added Stripe checkout flow with loading states, success/cancel messages from URL params, and "Manage Subscription" button for Pro users.
2. **`/src/app/(app)/dashboard/page.tsx`** — Added upgrade CTA banner for free users (links to /pricing), upgrade success banner when `?upgraded=true`, and new icons.
3. **`/src/app/(app)/profile/page.tsx`** — Added "Manage Subscription" button for Pro users that opens Stripe Customer Portal. Non-Pro users still see "Upgrade" link to /pricing.

## Packages Installed

- `stripe` (server-side SDK)
- `@stripe/stripe-js` (client-side SDK)

## Environment Variables Required

```
STRIPE_SECRET_KEY=sk_test_...          # Server-side Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...        # Stripe webhook signing secret
STRIPE_PRICE_ID=price_...              # Stripe Price ID for Pro plan
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Client-side publishable key
STRIPE_YEARLY_PRICE_ID=price_...       # (Optional) Yearly plan price ID
```

## Architecture Notes

- Uses Supabase JS Client (`db` from `@/lib/db`) for all database operations
- Uses existing `getAuthUser` and `getOrCreateUser` patterns from `@/lib/api-helpers` and `@/lib/user-provisioning`
- Subscription model in DB has: id, userId, stripeCustomerId, stripeSubscriptionId, stripePriceId, plan, status, etc.
- Webhook uses raw body text for Stripe signature verification (important in Next.js App Router)
- Free users get a placeholder `free_` prefix Stripe customer ID; real customer IDs are created on first checkout
- 7-day trial period included in checkout session
