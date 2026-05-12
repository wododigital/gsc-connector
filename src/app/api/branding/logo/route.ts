import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

const ALLOWED_MIME = new Map<string, string>([
  ["image/png", "image/png"],
  ["image/jpeg", "image/jpeg"],
  ["image/svg+xml", "image/svg+xml"],
  ["image/webp", "image/webp"],
  ["image/gif", "image/gif"],
]);
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB raw upload limit

/**
 * Logo upload endpoint.
 *
 * Storage: the file is converted to a base64 data URI and persisted directly
 * on BrandProfile.logoUrl (or logoUrlDark) as text. This intentionally bypasses
 * the filesystem because the production host has an ephemeral disk and any
 * previously-saved local files vanish on each deploy, leaving the dashboard
 * preview and AI-rendered reports with broken image links.
 *
 * Storing the data URI in the DB means:
 *   - The dashboard <img src={dataUri}> renders directly with no network fetch.
 *   - The brand-injector passes data URIs through unchanged, so AI reports get
 *     the real logo with no extra resolution step.
 *   - Logos survive deploys, container restarts and machine moves.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("logo");
    const variantRaw = form.get("variant");
    const variant = variantRaw === "dark" ? "dark" : "light";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing logo file" }, { status: 400 });
    }
    const mime = ALLOWED_MIME.get(file.type);
    if (!mime) {
      return NextResponse.json({ error: "Logo must be PNG, JPG, SVG, WEBP or GIF" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Logo must be 2MB or smaller" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const dataUri = `data:${mime};base64,${buf.toString("base64")}`;

    const update = variant === "dark" ? { logoUrlDark: dataUri } : { logoUrl: dataUri };
    await db.brandProfile.upsert({
      where: { userId: session.id },
      create: { userId: session.id, ...update },
      update,
    });

    return NextResponse.json({ url: dataUri, variant });
  } catch (err) {
    console.error("[api/branding/logo] POST error:", err);
    return NextResponse.json({ error: "Logo upload failed" }, { status: 500 });
  }
}
