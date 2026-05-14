/**
 * Admin authentication helpers for API routes.
 * Admin = user whose email matches one of the addresses in ADMIN_EMAIL
 * (comma-separated list, case-insensitive).
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

/**
 * Returns true if the current session user is an admin.
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return isAdminEmail(session?.email);
}

/**
 * Use at the top of admin API routes.
 * Returns the session user or a 403 NextResponse.
 *
 * Pattern:
 *   const adminOrResponse = await requireAdmin(req);
 *   if (adminOrResponse instanceof NextResponse) return adminOrResponse;
 */
export async function requireAdmin(
  _req: NextRequest
): Promise<{ id: string; email: string } | NextResponse> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminEmail(session.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { id: session.id, email: session.email };
}
