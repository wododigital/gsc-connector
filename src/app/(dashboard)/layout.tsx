import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 w-64 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-zinc-800">
          <span className="text-lg font-bold text-green-400">OMG AI</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-4 space-y-1">
          <a
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <span className="text-zinc-500">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2h5v5H2V2zm0 7h5v5H2V9zm7-7h5v5H9V2zm0 7h5v5H9V9z" />
              </svg>
            </span>
            Dashboard
          </a>
          <a
            href="/dashboard/keys"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <span className="text-zinc-500">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11 0a5 5 0 0 0-4.796 6.374L.146 12.427A.5.5 0 0 0 0 12.8V15a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-1h1a.5.5 0 0 0 .5-.5v-1h1a.5.5 0 0 0 .354-.147l.26-.26A5 5 0 1 0 11 0zm0 1a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
              </svg>
            </span>
            API Keys
          </a>
          <a
            href="/dashboard/logs"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <span className="text-zinc-500">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 1.5A1.5 1.5 0 0 1 3.5 0h9A1.5 1.5 0 0 1 14 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5V1.5zm2 .5v1h8V2H4zm0 3v1h8V5H4zm0 3v1h5V8H4z" />
              </svg>
            </span>
            Usage Logs
          </a>
        </nav>

        {/* User info + sign out */}
        <div className="p-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 mb-1 truncate" title={session.email}>
            {session.email}
          </p>
          {session.subscriptionTier && (
            <p className="text-xs text-zinc-600 mb-2 capitalize">
              {session.subscriptionTier} plan
            </p>
          )}
          <a
            href="/api/auth/logout"
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Sign out
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
