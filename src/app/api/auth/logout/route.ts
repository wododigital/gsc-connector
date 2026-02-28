/**
 * Logout endpoint
 * GET /api/auth/logout  (or POST - accepts both)
 *
 * Clears the session cookie and redirects to /.
 */

import { NextRequest, NextResponse } from "next/server";
import { config } from "@/config/index";
import { getSessionCookieOptions } from "@/lib/auth";

function logout(req: NextRequest): NextResponse {
  const cookieOptions = getSessionCookieOptions();
  const response = NextResponse.redirect(new URL("/", config.app.url));

  // Clear session cookie
  response.cookies.set(cookieOptions.name, "", {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    maxAge: 0,
    path: cookieOptions.path,
  });

  return response;
}

export async function GET(req: NextRequest) {
  return logout(req);
}

export async function POST(req: NextRequest) {
  return logout(req);
}
