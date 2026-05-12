import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { OnboardingClient } from "@/components/onboarding-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome - OMG Bridge",
};

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  // If they've already finished onboarding, push them to the dashboard.
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { onboardingCompleted: true },
  });
  if (user?.onboardingCompleted) redirect("/dashboard");

  const [credential, gscProperties, ga4Properties] = await Promise.all([
    db.googleCredential.findFirst({
      where: { userId: session.id },
      select: { scopes: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.gscProperty.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, siteUrl: true, permissionLevel: true, isActive: true },
    }),
    db.ga4Property.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, propertyId: true, displayName: true, accountName: true, isActive: true },
    }),
  ]);

  const mcpEndpoint = `${process.env.APP_URL || "http://localhost:3000"}/api/mcp`;

  return (
    <OnboardingClient
      sessionEmail={session.email}
      sessionName={session.name ?? null}
      hasGoogleConnection={Boolean(credential)}
      hasAnalyticsScope={Boolean(credential?.scopes.includes("analytics.readonly"))}
      gscProperties={gscProperties}
      ga4Properties={ga4Properties}
      mcpEndpoint={mcpEndpoint}
    />
  );
}
