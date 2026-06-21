import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const email = "123aliactionx5@gmail.com";

  const { data: user, error: userError } = await db
    .from("users")
    .select("id, email, name")
    .eq("email", email)
    .maybeSingle();

  if (userError || !user) {
    console.error("User not found:", userError);
    return;
  }

  console.log("Found user:", user.id, user.email, user.name);

  const { data: sub } = await db
    .from("subscriptions")
    .select("*")
    .eq("userId", user.id)
    .maybeSingle();

  console.log("Current subscription:", sub);

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await db
    .from("subscriptions")
    .update({
      plan: "pro_monthly",
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: "2099-12-31T23:59:59.999Z",
      updatedAt: now,
    })
    .eq("userId", user.id)
    .select()
    .single();

  if (updateError) {
    console.error("Update error:", updateError);
    console.log("Creating new subscription...");
    const { data: created, error: createError } = await db
      .from("subscriptions")
      .insert({
        id: crypto.randomUUID(),
        userId: user.id,
        plan: "pro_monthly",
        status: "active",
        stripeCustomerId: "pro_" + user.id,
        currentPeriodStart: now,
        currentPeriodEnd: "2099-12-31T23:59:59.999Z",
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (createError) {
      console.error("Create error:", createError);
    } else {
      console.log("Created Pro subscription:", created);
    }
  } else {
    console.log("Updated to Pro:", updated);
  }
}

main().catch(console.error);
