/**
 * Ticket Messages API
 * POST /api/tickets/[ticketId]/messages - Add a reply to an existing support ticket
 *
 * Body: { message: string }
 *
 * Rules:
 * - Only the ticket owner can reply
 * - Replies are blocked if the ticket status is "resolved" or "closed"
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import db from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  const userOrResponse = await requireAuth(req);
  if (userOrResponse instanceof NextResponse) return userOrResponse;
  const user = userOrResponse;

  try {
    const body = await req.json();
    const { message } = body as { message?: string };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.trim().length > 5000) {
      return NextResponse.json(
        { error: "Message must be 5000 characters or fewer" },
        { status: 400 }
      );
    }

    // Verify ticket ownership
    const ticket = await db.supportTicket.findFirst({
      where: { id: params.ticketId, userId: user.id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.status === "resolved" || ticket.status === "closed") {
      return NextResponse.json(
        { error: "Cannot reply to a resolved or closed ticket" },
        { status: 400 }
      );
    }

    const newMessage = await db.ticketMessage.create({
      data: {
        ticketId: params.ticketId,
        userId: user.id,
        senderType: "user",
        message: message.trim(),
      },
    });

    // Touch the ticket's updatedAt so it surfaces at the top of the list
    await db.supportTicket.update({
      where: { id: params.ticketId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error("[api/tickets/messages] POST error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
