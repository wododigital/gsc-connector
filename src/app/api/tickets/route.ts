/**
 * Support Tickets API
 * GET  /api/tickets - List the authenticated user's tickets (with first message preview)
 * POST /api/tickets - Create a new support ticket
 *
 * POST body: { subject: string, category?: string, description: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import db from "@/lib/db";

// ----------------------------------------------------------------
// GET - List tickets for the authenticated user
// ----------------------------------------------------------------
export async function GET(req: NextRequest) {
  const userOrResponse = await requireAuth(req);
  if (userOrResponse instanceof NextResponse) return userOrResponse;
  const user = userOrResponse;

  try {
    const tickets = await db.supportTicket.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1, // first message as preview
        },
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("[api/tickets] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

// ----------------------------------------------------------------
// POST - Create a new support ticket
// ----------------------------------------------------------------
export async function POST(req: NextRequest) {
  const userOrResponse = await requireAuth(req);
  if (userOrResponse instanceof NextResponse) return userOrResponse;
  const user = userOrResponse;

  try {
    const body = await req.json();
    const { subject, category = "general", description } = body as {
      subject?: string;
      category?: string;
      description?: string;
    };

    if (!subject?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: "Subject and description are required" },
        { status: 400 }
      );
    }

    const ticket = await db.supportTicket.create({
      data: {
        userId: user.id,
        subject: subject.trim(),
        category,
        messages: {
          create: {
            userId: user.id,
            senderType: "user",
            message: description.trim(),
          },
        },
      },
      include: { messages: true },
    });

    // Notify admins of the new ticket
    await db.adminNotification.create({
      data: {
        type: "new_ticket",
        title: "New support ticket",
        message: `${user.email} opened: "${subject.trim()}"`,
        severity: "info",
        metadata: { ticketId: ticket.id, userId: user.id, category },
      },
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error("[api/tickets] POST error:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
