/**
 * One-time Stripe product setup script.
 * Run: npx tsx scripts/setup-stripe.ts
 * Requires STRIPE_SECRET_KEY to be set.
 */
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY not set");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" });

async function setup() {
  const proProduct = await stripe.products.create({
    name: "OMG AI - Pro Plan",
    description: "1,000 tool calls/month, up to 3 Google accounts, priority support",
    metadata: { plan_id: "plan_pro" },
  });

  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 1900,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { plan_id: "plan_pro" },
  });

  const premiumProduct = await stripe.products.create({
    name: "OMG AI - Premium Plan",
    description: "5,000 tool calls/month, unlimited accounts, early access",
    metadata: { plan_id: "plan_premium" },
  });

  const premiumPrice = await stripe.prices.create({
    product: premiumProduct.id,
    unit_amount: 4900,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { plan_id: "plan_premium" },
  });

  console.log("=== STRIPE SETUP COMPLETE ===");
  console.log("Add these to Railway environment variables:");
  console.log(`STRIPE_PRO_PRICE_ID=${proPrice.id}`);
  console.log(`STRIPE_PREMIUM_PRICE_ID=${premiumPrice.id}`);
}

setup().catch(console.error);
