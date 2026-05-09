import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

const HEX = /^#[0-9a-fA-F]{6}$/;

function clean(input: unknown, max = 200): string | undefined {
  if (typeof input !== "string") return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

function cleanHex(input: unknown): string | undefined {
  const c = clean(input, 7);
  if (!c) return undefined;
  return HEX.test(c) ? c.toUpperCase() : undefined;
}

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.brandProfile.findUnique({ where: { userId: session.id } });
  return NextResponse.json({ profile });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const reportTheme = body.reportTheme === "dark" ? "dark" : "light";
    const data = {
      companyName: clean(body.companyName, 200) ?? null,
      website: clean(body.website, 300) ?? null,
      description: clean(body.description, 2000) ?? null,
      logoUrl: clean(body.logoUrl, 500) ?? null,
      logoUrlDark: clean(body.logoUrlDark, 500) ?? null,
      primaryColor: cleanHex(body.primaryColor) ?? null,
      secondaryColor: cleanHex(body.secondaryColor) ?? null,
      accentColor: cleanHex(body.accentColor) ?? null,
      fontFamily: clean(body.fontFamily, 80) ?? "Inter",
      reportTheme,
      isApproved: body.isApproved === true,
    };

    const profile = await db.brandProfile.upsert({
      where: { userId: session.id },
      create: { userId: session.id, ...data },
      update: data,
    });

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[api/branding] POST error:", err);
    return NextResponse.json({ error: "Failed to save brand profile" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.brandProfile.deleteMany({ where: { userId: session.id } });
  return NextResponse.json({ ok: true });
}
