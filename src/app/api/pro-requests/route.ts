/**
 * Public Pro Plan enquiry submission endpoint.
 * POST /api/pro-requests - accept enquiry from pricing form, persist to DB.
 *
 * The dashboard / admin/pro-requests panel reads these via the admin
 * counterpart at /api/admin/pro-requests.
 */
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

const ORG_TYPES = new Set(["startup_brand", "enterprise", "agency"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s().-]{5,}$/;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const orgType = typeof body.orgType === "string" ? body.orgType.trim() : "";
  const source = typeof body.source === "string" ? body.source.trim() : "pricing_page";

  if (name.length < 2 || name.length > 120) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!ORG_TYPES.has(orgType)) {
    return NextResponse.json({ error: "Please choose an organisation type." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (!PHONE_RE.test(phone) || phone.length > 32) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  try {
    const created = await db.proRequest.create({
      data: { name, email, phone, orgType, source: source.slice(0, 64) },
      select: { id: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, id: created.id, createdAt: created.createdAt });
  } catch (error) {
    console.error("[api/pro-requests] POST error:", error);
    return NextResponse.json(
      { error: "Could not save your enquiry. Please try again." },
      { status: 500 }
    );
  }
}
