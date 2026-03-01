import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const adminOrResponse = await requireAdmin(req);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const notifications = await db.adminNotification.findMany({
      where: unreadOnly ? { isRead: false } : {},
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const unreadCount = await db.adminNotification.count({ where: { isRead: false } });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("[admin/notifications] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const adminOrResponse = await requireAdmin(req);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const body = await req.json();

    if (body.markAll) {
      await db.adminNotification.updateMany({ data: { isRead: true } });
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      // Validate all ids are strings to prevent injection
      const ids = body.ids.filter((id: unknown) => typeof id === "string");
      if (ids.length === 0) {
        return NextResponse.json({ error: "ids must be an array of strings" }, { status: 400 });
      }
      await db.adminNotification.updateMany({
        where: { id: { in: ids } },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/notifications] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
