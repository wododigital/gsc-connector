import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import db from "@/lib/db";
import { generateSemanticTags } from "@/lib/prompt-tagger";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const adminOrResponse = await requireAdmin(req);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;

  try {
    const existing = await db.promptTemplate.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const semanticTags = await generateSemanticTags({
      title: existing.title,
      description: existing.description,
      body: existing.body,
    });

    const updated = await db.promptTemplate.update({
      where: { id: params.id },
      data: { semanticTags },
    });

    return NextResponse.json({ prompt: updated });
  } catch (err) {
    console.error("[admin/prompts/:id/retag] error:", err);
    return NextResponse.json({ error: "Failed to regenerate tags" }, { status: 500 });
  }
}
