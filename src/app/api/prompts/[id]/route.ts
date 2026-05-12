import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { generateSemanticTags } from "@/lib/prompt-tagger";

const VALID_CATEGORIES = new Set([
  "seo-report",
  "traffic-analysis",
  "aeo",
  "technical-seo",
  "gbp-report",
  "competitor",
  "custom",
]);
const VALID_CONNECTIONS = new Set(["gsc", "ga4", "gbp"]);

function sanitizeQuestions(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((q): q is string => typeof q === "string")
    .map((q) => q.trim())
    .filter((q) => q.length > 0 && q.length <= 500)
    .slice(0, 15);
}

function sanitizeConnections(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((c): c is string => typeof c === "string")
    .map((c) => c.trim().toLowerCase())
    .filter((c) => VALID_CONNECTIONS.has(c));
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const existing = await db.userPrompt.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== session.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : existing.title;
    const description = typeof body.description === "string" ? body.description.trim() : existing.description;
    const promptBody = typeof body.body === "string" ? body.body.trim() : existing.body;
    const category =
      typeof body.category === "string" && VALID_CATEGORIES.has(body.category) ? body.category : existing.category;
    const questions = body.questions !== undefined ? sanitizeQuestions(body.questions) : (existing.questions as unknown as string[]);
    const requiredConnections =
      body.requiredConnections !== undefined
        ? sanitizeConnections(body.requiredConnections)
        : (existing.requiredConnections as unknown as string[]);
    const isActive = typeof body.isActive === "boolean" ? body.isActive : existing.isActive;

    if (!title || title.length > 200) {
      return NextResponse.json({ error: "Title is required (max 200 chars)" }, { status: 400 });
    }
    if (!description || description.length > 500) {
      return NextResponse.json({ error: "Description is required (max 500 chars)" }, { status: 400 });
    }
    if (!promptBody || promptBody.length > 20000) {
      return NextResponse.json({ error: "Body is required (max 20000 chars)" }, { status: 400 });
    }

    const contentChanged = title !== existing.title || description !== existing.description || promptBody !== existing.body;
    const semanticTags = contentChanged
      ? await generateSemanticTags({ title, description, body: promptBody })
      : (existing.semanticTags as unknown as string[]);

    const updated = await db.userPrompt.update({
      where: { id: params.id },
      data: {
        title,
        description,
        body: promptBody,
        category,
        requiredConnections,
        questions,
        semanticTags,
        isActive,
      },
    });

    return NextResponse.json({ prompt: updated });
  } catch (err) {
    console.error("[api/prompts/:id] PUT error:", err);
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const existing = await db.userPrompt.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== session.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await db.userPrompt.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/prompts/:id] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete prompt" }, { status: 500 });
  }
}
