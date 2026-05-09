import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import db from "@/lib/db";

const ALLOWED = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/svg+xml", "svg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

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
    const ext = ALLOWED.get(file.type);
    if (!ext) {
      return NextResponse.json({ error: "Logo must be PNG, JPG, SVG, WEBP or GIF" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Logo must be 2MB or smaller" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads", "logos");
    await mkdir(dir, { recursive: true });

    // Use timestamp to bust caches when re-uploading.
    const filename = `${session.id}-${variant}-${Date.now()}.${ext}`;
    await writeFile(path.join(dir, filename), buf);
    const url = `/uploads/logos/${filename}`;

    // Persist on the appropriate slot of the brand profile.
    const update = variant === "dark" ? { logoUrlDark: url } : { logoUrl: url };
    await db.brandProfile.upsert({
      where: { userId: session.id },
      create: { userId: session.id, ...update },
      update,
    });

    return NextResponse.json({ url, variant });
  } catch (err) {
    console.error("[api/branding/logo] POST error:", err);
    return NextResponse.json({ error: "Logo upload failed" }, { status: 500 });
  }
}
