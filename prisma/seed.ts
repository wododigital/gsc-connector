/**
 * Prisma seed script - seeds initial plans and starter coupons.
 * Run: npx ts-node --project tsconfig.json prisma/seed.ts
 * Or:  npx tsx prisma/seed.ts
 */

import { PrismaClient } from "@prisma/client";
import { DEFAULT_PROMPTS } from "./seed-prompts";

const db = new PrismaClient();

// Sentinel for "unlimited" tool calls. Stored as a very high integer so the
// existing Int column in the schema keeps working without a migration.
const UNLIMITED_CALLS = 999999;

async function main() {
  console.log("Seeding plans...");

  // Free: 100 total tool calls / 1 Google account.
  // Note: monthlyCalls is now a LIFETIME cap for the free plan; the
  // usage layer skips the period reset for plan_free so it stays a one-shot
  // trial quota rather than a monthly allowance.
  await db.plan.upsert({
    where: { id: "plan_free" },
    update: {
      name: "free",
      displayName: "Free",
      monthlyCalls: 100,
      priceCents: 0,
      maxGoogleAccounts: 1,
      features: [
        "1 Google account",
        "100 tool calls total",
        "All MCP tools",
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
      monthlyCalls: 100,
      priceCents: 0,
      maxGoogleAccounts: 1,
      features: [
        "1 Google account",
        "100 tool calls total",
        "All MCP tools",
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
        "All MCP tools",
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
        "All MCP tools",
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

  console.log("Seeding prompt templates...");
  for (const p of DEFAULT_PROMPTS) {
    const existing = await db.promptTemplate.findFirst({ where: { title: p.title } });
    const data = {
      title: p.title,
      description: p.description,
      body: p.body,
      category: p.category,
      requiredConnections: p.requiredConnections,
      questions: p.questions,
      semanticTags: p.semanticTags,
      sortOrder: p.sortOrder,
      isActive: true,
    };
    if (existing) {
      await db.promptTemplate.update({ where: { id: existing.id }, data });
    } else {
      await db.promptTemplate.create({ data });
    }
  }
  console.log(`  -> ${DEFAULT_PROMPTS.length} prompt templates upserted`);

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
