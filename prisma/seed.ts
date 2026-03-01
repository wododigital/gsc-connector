/**
 * Prisma seed script - seeds initial plans and starter coupons.
 * Run: npx ts-node --project tsconfig.json prisma/seed.ts
 * Or:  npx tsx prisma/seed.ts
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding plans...");

  // Upsert the 3 default plans (idempotent)
  await db.plan.upsert({
    where: { id: "plan_free" },
    update: {},
    create: {
      id: "plan_free",
      name: "free",
      displayName: "Free",
      monthlyCalls: 100,
      priceCents: 0,
      maxGoogleAccounts: 1,
      features: ["1 Google account", "100 tool calls/month", "GSC + GA4 access", "Community support"],
      sortOrder: 0,
    },
  });

  await db.plan.upsert({
    where: { id: "plan_pro" },
    update: {},
    create: {
      id: "plan_pro",
      name: "pro",
      displayName: "Pro",
      monthlyCalls: 1000,
      priceCents: 1900,
      maxGoogleAccounts: 3,
      features: ["3 Google accounts", "1,000 tool calls/month", "GSC + GA4 access", "Priority support", "Usage analytics"],
      sortOrder: 1,
    },
  });

  await db.plan.upsert({
    where: { id: "plan_premium" },
    update: {},
    create: {
      id: "plan_premium",
      name: "premium",
      displayName: "Premium",
      monthlyCalls: 5000,
      priceCents: 4900,
      maxGoogleAccounts: 10,
      features: ["10 Google accounts", "5,000 tool calls/month", "GSC + GA4 access", "Priority support", "Usage analytics", "Early access to new features"],
      sortOrder: 2,
    },
  });

  console.log("Seeding starter coupons...");

  // Starter coupons - use upsert by code
  const betaCoupon = await db.couponCode.findUnique({ where: { code: "BETA50" } });
  if (!betaCoupon) {
    await db.couponCode.create({
      data: {
        code: "BETA50",
        planId: "plan_pro",
        durationMonths: 3,
        maxRedemptions: 100,
        isActive: true,
      },
    });
  }

  const launchCoupon = await db.couponCode.findUnique({ where: { code: "LAUNCH2026" } });
  if (!launchCoupon) {
    await db.couponCode.create({
      data: {
        code: "LAUNCH2026",
        planId: "plan_premium",
        durationMonths: 1,
        maxRedemptions: 50,
        isActive: true,
      },
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
