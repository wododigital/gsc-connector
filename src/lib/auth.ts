/**
 * Session/JWT management utilities
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { JwtPayload, SessionUser, SubscriptionTier } from "@/types/index";
import { AppError } from "@/types/index";

const appSecret = process.env.APP_SECRET;
if (!appSecret && process.env.NODE_ENV === "production") {
  throw new Error("[auth] APP_SECRET environment variable is required in production");
}

const SECRET = new TextEncoder().encode(
  appSecret ?? "dev-secret-change-in-production"
);

const COOKIE_NAME = "gsc_session";
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    tier: user.subscriptionTier,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<JwtPayload> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    throw AppError.unauthorized("Invalid or expired session");
  }
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      subscriptionTier: payload.tier as SubscriptionTier,
    };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_TTL,
    path: "/",
  };
}
