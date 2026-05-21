/**
 * Admin: update or delete a single Pro Plan enquiry.
 * PATCH /api/admin/pro-requests/[id] - update status / notes
 * DELETE /api/admin/pro-requests/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import db from "@/lib/db";

const ALLOWED_STATUSES = new Set(["new", "contacted", "qualified", "won", "lost"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminOrResponse = await requireAdmin(req);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: { status?: string; notes?: string | null; contactedAt?: Date | null } = {};

  if (typeof body.status === "string") {
    const next = body.status.toLowerCase();
    if (!ALLOWED_STATUSES.has(next)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = next;
    if (next !== "new" && body.contactedAt === undefined) {
      data.contactedAt = new Date();
    }
  }
  if (body.notes === null || typeof body.notes === "string") {
    data.notes = body.notes as string | null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const updated = await db.proRequest.update({ where: { id }, data });
    return NextResponse.json({ ok: true, request: updated });
  } catch (error) {
    console.error("[admin/pro-requests] PATCH error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminOrResponse = await requireAdmin(req);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  const { id } = await params;

  try {
    await db.proRequest.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/pro-requests] DELETE error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
