import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

/**
 * PATCH /api/prompts/[id]/active
 *
 * Toggles the per-user active state of a prompt. Works for both:
 *  - User-owned prompts -> updates user_prompts.is_active directly
 *  - Admin (system) prompts -> upserts a row in user_prompt_template_states
 *    so the change only affects the current user. The underlying admin
 *    template is never modified or deleted.
 *
 * Body: { isActive: boolean }
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { isActive?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
  }
  const isActive = body.isActive;

  try {
    // User-owned prompt? Update the column directly.
    const userPrompt = await db.userPrompt.findUnique({ where: { id: params.id } });
    if (userPrompt) {
      if (userPrompt.userId !== session.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const updated = await db.userPrompt.update({
        where: { id: params.id },
        data: { isActive },
      });
      return NextResponse.json({ id: updated.id, isActive: updated.isActive, scope: "user" });
    }

    // System prompt? Upsert per-user state.
    const systemPrompt = await db.promptTemplate.findUnique({ where: { id: params.id } });
    if (systemPrompt) {
      const state = await db.userPromptTemplateState.upsert({
        where: {
          userId_promptTemplateId: { userId: session.id, promptTemplateId: params.id },
        },
        create: { userId: session.id, promptTemplateId: params.id, isActive },
        update: { isActive },
      });
      return NextResponse.json({ id: params.id, isActive: state.isActive, scope: "system" });
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (err) {
    console.error("[api/prompts/:id/active] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update prompt state" }, { status: 500 });
  }
}
