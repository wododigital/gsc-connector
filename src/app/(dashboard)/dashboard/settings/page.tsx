import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings - OMG Bridge",
};

function deriveDisplayName(name: string | null | undefined, email: string): string {
  if (name && name.trim().length > 0) return name;
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[._-]+/)[0] ?? local;
  if (!first) return "";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function initialsFor(email: string): string {
  if (!email) return "??";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "??").toUpperCase();
}

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const displayName = deriveDisplayName(session.name, session.email);
  const initials = initialsFor(session.email);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Account <span className="accent">settings.</span></h1>
          <p className="lede">
            Manage your profile, workspace and security preferences.
          </p>
        </div>
      </div>

      <SettingsClient
        email={session.email}
        displayName={displayName}
        initials={initials}
      />
    </>
  );
}
