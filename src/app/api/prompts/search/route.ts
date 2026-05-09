import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

function matches(haystack: string[], q: string): number {
  const needle = q.toLowerCase();
  let score = 0;
  for (const h of haystack) {
    if (!h) continue;
    const lower = h.toLowerCase();
    if (lower === needle) score += 5;
    else if (lower.includes(needle)) score += 2;
  }
  return score;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ results: [] });

  try {
    const [systemPrompts, userPrompts] = await Promise.all([
      db.promptTemplate.findMany({ where: { isActive: true } }),
      db.userPrompt.findMany({ where: { userId: session.id } }),
    ]);

    const all = [
      ...systemPrompts.map((p) => ({ ...p, isUserOwned: false })),
      ...userPrompts.map((p) => ({ ...p, isUserOwned: true })),
    ];

    const ranked = all
      .map((p) => {
        const tags = Array.isArray(p.semanticTags) ? (p.semanticTags as string[]) : [];
        const score = matches([p.title, p.description, p.category, ...tags], q);
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      .map((x) => ({
        id: x.p.id,
        title: x.p.title,
        description: x.p.description,
        category: x.p.category,
        requiredConnections: x.p.requiredConnections,
        isUserOwned: x.p.isUserOwned,
      }));

    return NextResponse.json({ results: ranked });
  } catch (err) {
    console.error("[api/prompts/search] error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
