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

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <span className="num">06</span>
            <span>·</span>
            <span>BRANDING · REPORT TEMPLATES</span>
          </div>
          <h1>Brand <span className="accent">your reports.</span></h1>
          <p className="lede">
            Configure once, applied everywhere. AI-generated reports use these defaults unless overridden per-prompt.
          </p>
        </div>
      </div>

      <BrandingClient initial={profile} />
    </>
  );
}
