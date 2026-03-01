/**
 * Single Ticket API
 * GET /api/tickets/[ticketId] - Fetch a specific ticket with all messages
 *
 * Only the ticket owner can access it.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import db from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  const userOrResponse = await requireAuth(req);
  if (userOrResponse instanceof NextResponse) return userOrResponse;
  const user = userOrResponse;

  try {
    const ticket = await db.supportTicket.findFirst({
      where: { id: params.ticketId, userId: user.id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("[api/tickets/[id]] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}
