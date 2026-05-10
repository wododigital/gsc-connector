import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { ApiKeysClient } from "@/components/api-keys-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Keys - OMG Bridge",
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
          <div className="eyebrow">
            <span className="num">04</span>
            <span>·</span>
            <span>API KEYS · STATIC AUTH</span>
          </div>
          <h1>API <span className="accent">keys.</span></h1>
          <p className="lede">
            Static keys for tools that don&apos;t support OAuth (Cursor, Claude Desktop config files).
            Each key has the same scopes as your account. Rotate often.
          </p>
        </div>
      </div>

      <ApiKeysClient initialKeys={keys} />
    </>
  );
}
