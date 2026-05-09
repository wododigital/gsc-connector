import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { BrandingClient } from "@/components/branding-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Profile - OMG Bridge",
};

export default async function BrandingPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const profile = await db.brandProfile.findUnique({ where: { userId: session.id } });

  return <BrandingClient initial={profile} />;
}
