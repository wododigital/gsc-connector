/**
 * Admin authentication helpers for API routes.
 * Admin = user whose email matches ADMIN_EMAIL env var.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * Returns true if the current session user is the admin.
 */
export async function isAdmin(): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  const session = await getSession();
  return session?.email === adminEmail;
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
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!adminEmail || session.email !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { id: session.id, email: session.email };
}
