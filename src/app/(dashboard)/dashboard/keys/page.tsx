import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { ApiKeysClient } from "@/components/api-keys-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Key - OMG Bridge",
};

async function getApiKeys(userId: string) {
  try {
    return await db.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
  } catch {
    return [];
  }
}

export default async function ApiKeysPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const rawKeys = await getApiKeys(session.id);

  // Serialize dates so the client component receives plain strings.
  const keys = rawKeys.map((key) => ({
    id: key.id,
    name: key.name,
    keyPrefix: key.keyPrefix,
    isActive: key.isActive,
    lastUsedAt: key.lastUsedAt ? key.lastUsedAt.toISOString() : null,
    createdAt: key.createdAt.toISOString(),
  }));

  return (
    <>
      <div className="page-header">
        <div>
          <h1>API <span className="accent">key.</span></h1>
          <p className="lede">
            A single bearer token for AI tools that don&apos;t do OAuth (Claude Desktop, Claude Code,
            Cursor, Gemini CLI). Regenerating revokes the old key in one step.
          </p>
        </div>
      </div>

      <ApiKeysClient initialKeys={keys} />
    </>
  );
}
