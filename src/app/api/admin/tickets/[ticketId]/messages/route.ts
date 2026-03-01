import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import db from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  const adminOrResponse = await requireAdmin(req);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;
  const admin = adminOrResponse;

  try {
    const body = await req.json();
    const { message, markResolved } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.trim().length > 5000) {
      return NextResponse.json(
        { error: "Message must be 5000 characters or fewer" },
        { status: 400 }
      );
    }

    const newMessage = await db.ticketMessage.create({
      data: {
        ticketId: params.ticketId,
        userId: admin.id,
        senderType: "admin",
        message: message.trim(),
      },
    });

    // Update ticket status
    await db.supportTicket.update({
      where: { id: params.ticketId },
      data: {
        status: markResolved ? "resolved" : "in_progress",
        resolvedAt: markResolved ? new Date() : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error("[admin/tickets/messages] POST error:", error);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
