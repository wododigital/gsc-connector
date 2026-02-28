/**
 * Auth helper for Next.js App Router API routes.
 * Call requireAuth() at the top of any protected route handler.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./auth";
import type { SessionUser } from "@/types/index";

/**
 * Returns the authenticated SessionUser or a 401 NextResponse.
 * Pattern: const userOrResponse = await requireAuth(req);
 *          if (userOrResponse instanceof NextResponse) return userOrResponse;
 */
export async function requireAuth(
  _req: NextRequest
): Promise<SessionUser | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}
