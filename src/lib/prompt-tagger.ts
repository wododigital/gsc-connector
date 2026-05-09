/**
 * Semantic auto-tagging for prompt templates.
 * Uses Anthropic Claude Haiku to extract 5-8 keywords/phrases from a prompt.
 * Falls back to a deterministic keyword extractor when ANTHROPIC_API_KEY is
 * unset or the API call fails so seeding/dev still works offline.
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const HAIKU_MODEL = "claude-haiku-4-5-20251001";

interface ExtractInput {
  title: string;
  description: string;
  body: string;
}

export async function generateSemanticTags(input: ExtractInput): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallbackTags(input);

  try {
    const userContent =
      `Title: ${input.title}\n` +
      `Description: ${input.description}\n` +
      `Body: ${input.body.slice(0, 800)}`;

    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: HAIKU_MODEL,
        max_tokens: 250,
        system:
          "Extract 5-8 short semantic keywords or phrases from this SEO/analytics prompt template. " +
          "Focus on the topics, metrics, and use cases the prompt covers. " +
          'Return ONLY a JSON array of strings, no commentary. Example: ["organic traffic","keyword ranking","CTR","monthly report"]',
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!res.ok) {
      console.warn("[prompt-tagger] Anthropic returned non-OK", res.status);
      return fallbackTags(input);
    }

    const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = json.content?.find((c) => c.type === "text")?.text?.trim();
    if (!text) return fallbackTags(input);

    return parseTags(text) ?? fallbackTags(input);
  } catch (err) {
    console.warn("[prompt-tagger] failed, using fallback:", err);
    return fallbackTags(input);
  }
}

function parseTags(raw: string): string[] | null {
  // Try to find a JSON array even when wrapped in prose / code fences.
  const match = raw.match(/\[[\s\S]*?\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0 && s.length <= 60)
      .slice(0, 10);
  } catch {
    return null;
  }
}

const STOPWORDS = new Set([
  "the","and","for","with","that","this","from","your","into","over","when","what","which","then","they","them","each",
  "have","will","would","could","should","about","using","make","makes","made","also","just","like","more","than",
  "such","very","there","here","every","other","some","most","across","between","please","based","onto","upon","once",
  "report","reports","prompt","prompts","question","questions","section","instruction","instructions","include",
]);

function fallbackTags(input: ExtractInput): string[] {
  const text = `${input.title} ${input.description} ${input.body.slice(0, 600)}`.toLowerCase();
  const counts = new Map<string, number>();
  for (const word of text.split(/[^a-z0-9]+/g)) {
    if (word.length < 4 || STOPWORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  return ranked.map(([w]) => w);
}
