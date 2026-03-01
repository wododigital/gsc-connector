import Stripe from "stripe";
import db from "@/lib/db";

if (!process.env.STRIPE_SECRET_KEY) {
  // Don't throw at module load time - just warn
  console.warn("[stripe] STRIPE_SECRET_KEY not set - Stripe features will be unavailable");
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" })
  : null;

export const PLAN_PRICE_MAP: Record<string, string> = {
  plan_pro: process.env.STRIPE_PRO_PRICE_ID ?? "",
  plan_premium: process.env.STRIPE_PREMIUM_PRICE_ID ?? "",
};

export const PRICE_PLAN_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(PLAN_PRICE_MAP).map(([k, v]) => [v, k])
);

/**
 * Get or create a Stripe Customer for a user.
 * Stores the customer ID in user_subscriptions.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  if (!stripe) throw new Error("Stripe is not configured");

  const sub = await db.userSubscription.findUnique({ where: { userId } });
  if (sub?.stripeCustomerId) return sub.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  });

  await db.userSubscription.upsert({
    where: { userId },
    update: { stripeCustomerId: customer.id },
    create: {
      userId,
      planId: "plan_free",
      stripeCustomerId: customer.id,
      periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return customer.id;
}
