import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import db from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  const adminOrResponse = await requireAdmin(req);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const ticket = await db.supportTicket.findUnique({
      where: { id: params.ticketId },
      include: {
        user: { select: { email: true, name: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("[admin/tickets/[id]] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  const adminOrResponse = await requireAdmin(req);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const body = await req.json();
    const { status, priority } = body;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (status === "resolved") updateData.resolvedAt = new Date();

    const ticket = await db.supportTicket.update({
      where: { id: params.ticketId },
      data: updateData,
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("[admin/tickets/[id]] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
