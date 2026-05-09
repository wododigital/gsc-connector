import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { generateSemanticTags } from "@/lib/prompt-tagger";
import { buildClipboardPrompt } from "@/lib/brand-injector";

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

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [systemPrompts, userPrompts, brand] = await Promise.all([
      db.promptTemplate.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      db.userPrompt.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
      }),
      db.brandProfile.findUnique({ where: { userId: session.id } }),
    ]);

    return NextResponse.json({
      system: systemPrompts.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        requiredConnections: p.requiredConnections,
        questions: p.questions,
        semanticTags: p.semanticTags,
        body: buildClipboardPrompt(p.body, brand),
        rawBody: p.body,
        isUserOwned: false,
      })),
      user: userPrompts.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        requiredConnections: p.requiredConnections,
        questions: p.questions,
        semanticTags: p.semanticTags,
        body: buildClipboardPrompt(p.body, brand),
        rawBody: p.body,
        isUserOwned: true,
      })),
      hasBrandProfile: Boolean(brand?.isApproved),
    });
  } catch (err) {
    console.error("[api/prompts] GET error:", err);
    return NextResponse.json({ error: "Failed to load prompts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const promptBody = typeof body.body === "string" ? body.body.trim() : "";
    const category = typeof body.category === "string" && VALID_CATEGORIES.has(body.category) ? body.category : "custom";
    const questions = sanitizeQuestions(body.questions);
    const requiredConnections = sanitizeConnections(body.requiredConnections);

    if (!title || title.length > 200) {
      return NextResponse.json({ error: "Title is required (max 200 chars)" }, { status: 400 });
    }
    if (!description || description.length > 500) {
      return NextResponse.json({ error: "Description is required (max 500 chars)" }, { status: 400 });
    }
    if (!promptBody || promptBody.length > 20000) {
      return NextResponse.json({ error: "Body is required (max 20000 chars)" }, { status: 400 });
    }

    const semanticTags = await generateSemanticTags({ title, description, body: promptBody });

    const created = await db.userPrompt.create({
      data: {
        userId: session.id,
        title,
        description,
        body: promptBody,
        category,
        requiredConnections,
        questions,
        semanticTags,
      },
    });

    return NextResponse.json({ prompt: created }, { status: 201 });
  } catch (err) {
    console.error("[api/prompts] POST error:", err);
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
  }
}
