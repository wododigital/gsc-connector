/**
 * Prisma seed script - seeds initial plans and starter coupons.
 * Run: npx ts-node --project tsconfig.json prisma/seed.ts
 * Or:  npx tsx prisma/seed.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Sentinel for "unlimited" tool calls. Stored as a very high integer so the
// existing Int column in the schema keeps working without a migration.
const UNLIMITED_CALLS = 999999;

async function main() {
  console.log("Seeding plans...");

  // Free: 200 tool calls / 1 Google account
  await db.plan.upsert({
    where: { id: "plan_free" },
    update: {
      name: "free",
      displayName: "Free",
      monthlyCalls: 200,
      priceCents: 0,
      maxGoogleAccounts: 1,
      features: [
        "1 Google account",
        "200 tool calls/month",
        "All 30 MCP tools",
        "GSC + GA4 + GBP access",
        "Community support",
      ],
      sortOrder: 0,
      isActive: true,
    },
    create: {
      id: "plan_free",
      name: "free",
      displayName: "Free",
      monthlyCalls: 200,
      priceCents: 0,
      maxGoogleAccounts: 1,
      features: [
        "1 Google account",
        "200 tool calls/month",
        "All 30 MCP tools",
        "GSC + GA4 + GBP access",
        "Community support",
      ],
      sortOrder: 0,
    },
  });

  // Annual: $199/year, unlimited
  await db.plan.upsert({
    where: { id: "plan_annual" },
    update: {
      name: "annual",
      displayName: "Annual",
      monthlyCalls: UNLIMITED_CALLS,
      priceCents: 19900,
      maxGoogleAccounts: 999,
      features: [
        "Unlimited Google accounts",
        "Unlimited tool calls",
        "All 30 MCP tools",
        "GSC + GA4 + GBP access",
        "Priority support",
        "Usage analytics",
      ],
      sortOrder: 1,
      isActive: true,
    },
    create: {
      id: "plan_annual",
      name: "annual",
      displayName: "Annual",
      monthlyCalls: UNLIMITED_CALLS,
      priceCents: 19900,
      maxGoogleAccounts: 999,
      features: [
        "Unlimited Google accounts",
        "Unlimited tool calls",
        "All 30 MCP tools",
        "GSC + GA4 + GBP access",
        "Priority support",
        "Usage analytics",
      ],
      sortOrder: 1,
    },
  });

  // Deactivate any legacy plans (plan_pro / plan_premium) so they no longer
  // appear in the UI but existing FK references still resolve.
  await db.plan.updateMany({
    where: { id: { in: ["plan_pro", "plan_premium"] } },
    data: { isActive: false },
  });

  console.log("Seeding starter coupons...");

  // Starter coupons - point at the annual plan (since pro/premium are gone)
  const betaCoupon = await db.couponCode.findUnique({ where: { code: "BETA50" } });
  if (!betaCoupon) {
    await db.couponCode.create({
      data: {
        code: "BETA50",
        planId: "plan_annual",
        durationMonths: 3,
        maxRedemptions: 100,
        isActive: true,
      },
    });
  } else if (betaCoupon.planId !== "plan_annual") {
    await db.couponCode.update({
      where: { code: "BETA50" },
      data: { planId: "plan_annual" },
    });
  }

  const launchCoupon = await db.couponCode.findUnique({ where: { code: "LAUNCH2026" } });
  if (!launchCoupon) {
    await db.couponCode.create({
      data: {
        code: "LAUNCH2026",
        planId: "plan_annual",
        durationMonths: 12,
        maxRedemptions: 50,
        isActive: true,
      },
    });
  } else if (launchCoupon.planId !== "plan_annual") {
    await db.couponCode.update({
      where: { code: "LAUNCH2026" },
      data: { planId: "plan_annual" },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
