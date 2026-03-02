import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { ApiKeysClient } from "@/components/api-keys-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Keys - OMG AI",
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

  // Serialize dates for the client component
  const keys = rawKeys.map((key) => ({
    id: key.id,
    name: key.name,
    keyPrefix: key.keyPrefix,
    isActive: key.isActive,
    lastUsedAt: key.lastUsedAt ? key.lastUsedAt.toISOString() : null,
    createdAt: key.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">API Keys</h1>
        <p className="text-zinc-400 text-sm mt-1">
          API keys are used to authenticate Claude Desktop and Cursor with your MCP endpoint.
          Each key is shown only once at creation.
        </p>
      </div>

      {/* Security note */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-zinc-900 border border-zinc-700">
        <span className="text-yellow-500 text-base mt-0.5">!</span>
        <div className="text-sm text-zinc-400 space-y-1">
          <p className="font-medium text-zinc-300">Security note</p>
          <p>
            API keys are hashed before storage. The full key is only shown once at creation.
            If you lose a key, revoke it and create a new one.
          </p>
          <p>
            Never share your API key or commit it to version control.
          </p>
        </div>
      </div>

      {/* Client component for interactive key management */}
      <ApiKeysClient initialKeys={keys} />
    </div>
  );
}
