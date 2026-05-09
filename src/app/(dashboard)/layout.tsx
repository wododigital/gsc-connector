import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarLink } from "@/components/sidebar-link";
import { UsageBanner } from "@/components/usage-banner";
import db from "@/lib/db";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  // Onboarding redirect: only push the user there if they haven't finished it.
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { onboardingCompleted: true },
  });
  if (user && !user.onboardingCompleted) redirect("/onboarding");

  // Subscription stats for the usage banner + brand stub for the sidebar.
  const [subscription, brandProfile] = await Promise.all([
    db.userSubscription.findUnique({
      where: { userId: session.id },
      include: { plan: true },
    }),
    db.brandProfile.findUnique({
      where: { userId: session.id },
      select: { companyName: true, logoUrl: true, isApproved: true },
    }),
  ]);
  const isFreeUser = subscription?.plan.name === "free";
  const callsUsed = subscription?.callsUsed ?? 0;
  const callsLimit = subscription?.plan.monthlyCalls ?? 200;
  const periodEnd = (subscription?.periodEnd ?? new Date(Date.now() + 30 * 86400000)).toISOString();

  return (
    <div className="min-h-screen">
      {/* Full-screen background image */}
      <div className="app-background app-background-user" />

      {/* Sidebar */}
      <aside className="glass-sidebar fixed left-0 top-0 w-64 h-full flex flex-col z-40">
        {/* Logo */}
        <div className="p-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
          <img
            src="/omg-bridge-logo-dark.svg"
            alt="OMG Bridge"
            className="h-7 w-auto"
          />
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <SidebarLink href="/dashboard" exact>
            <svg className="sidebar-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2h5v5H2V2zm0 7h5v5H2V9zm7-7h5v5H9V2zm0 7h5v5H9V9z" />
            </svg>
            <span>Dashboard</span>
          </SidebarLink>
          <SidebarLink href="/dashboard/prompts">
            <svg className="sidebar-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 1.5A1.5 1.5 0 0 1 3.5 0h9A1.5 1.5 0 0 1 14 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5V1.5zM4 4h8v1H4V4zm0 3h8v1H4V7zm0 3h5v1H4v-1z" />
            </svg>
            <span>Prompts</span>
          </SidebarLink>
          <SidebarLink href="/dashboard/branding">
            <svg className="sidebar-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM4 5.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm5 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm-3.5 4a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z" />
            </svg>
            <span>Branding</span>
          </SidebarLink>
          <SidebarLink href="/dashboard/keys">
            <svg className="sidebar-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11 0a5 5 0 0 0-4.796 6.374L.146 12.427A.5.5 0 0 0 0 12.8V15a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-1h1a.5.5 0 0 0 .5-.5v-1h1a.5.5 0 0 0 .354-.147l.26-.26A5 5 0 1 0 11 0zm0 1a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
            </svg>
            <span>API Keys</span>
          </SidebarLink>
          <SidebarLink href="/dashboard/logs">
            <svg className="sidebar-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 1.5A1.5 1.5 0 0 1 3.5 0h9A1.5 1.5 0 0 1 14 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5V1.5zm2 .5v1h8V2H4zm0 3v1h8V5H4zm0 3v1h5V8H4z" />
            </svg>
            <span>Usage Logs</span>
          </SidebarLink>
          <SidebarLink href="/dashboard/billing">
            <svg className="sidebar-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7zm-9 2h2a.5.5 0 0 1 0 1H6a.5.5 0 0 1 0-1zm-3 0h1a.5.5 0 0 1 0 1H3a.5.5 0 0 1 0-1z" />
            </svg>
            <span>Billing</span>
          </SidebarLink>
          <SidebarLink href="/dashboard/tickets">
            <svg className="sidebar-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
              <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z" />
            </svg>
            <span>Support Tickets</span>
          </SidebarLink>
          {session.email === process.env.ADMIN_EMAIL && (
            <SidebarLink href="/admin">
              <svg className="sidebar-icon" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              </svg>
              <span>Admin Panel</span>
            </SidebarLink>
          )}
        </nav>

        {/* Brand stub - clickable, links to Branding page */}
        <a
          href="/dashboard/branding"
          className="block p-3 mx-3 mb-2 rounded-lg transition-colors no-underline"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)" }}
        >
          {brandProfile && (brandProfile.logoUrl || brandProfile.companyName) ? (
            <div className="flex items-center gap-2">
              <div
                className="rounded shrink-0 flex items-center justify-center"
                style={{ width: 28, height: 28, background: "#FFFFFF", border: "1px solid var(--glass-border)" }}
              >
                {brandProfile.logoUrl ? (
                  <img src={brandProfile.logoUrl} alt="Brand" style={{ maxWidth: 24, maxHeight: 24, objectFit: "contain" }} />
                ) : (
                  <span className="text-[10px] font-bold" style={{ color: "#0E1420" }}>
                    {(brandProfile.companyName ?? "?").slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs truncate" style={{ color: "var(--text-primary)" }}>
                  {brandProfile.companyName ?? "Your brand"}
                </p>
                <p className="text-[10px]" style={{ color: brandProfile.isApproved ? "var(--success)" : "var(--warning)" }}>
                  {brandProfile.isApproved ? "Brand active" : "Draft - approve to activate"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="rounded shrink-0 flex items-center justify-center"
                style={{ width: 28, height: 28, background: "rgba(255,255,255,0.05)", border: "1px dashed var(--glass-border)", color: "var(--text-muted)" }}
              >
                +
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs" style={{ color: "var(--text-primary)" }}>Add your brand</p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>White-label your reports</p>
              </div>
            </div>
          )}
        </a>

        {/* User info + sign out */}
        <div className="p-4 border-t" style={{ borderColor: "var(--glass-border)" }}>
          <p className="text-xs truncate mb-1" style={{ color: "var(--text-muted)" }} title={session.email}>
            {session.email}
          </p>
          {session.subscriptionTier && (
            <p className="text-xs mb-2 capitalize" style={{ color: "var(--text-muted)" }}>
              {session.subscriptionTier} plan
            </p>
          )}
          <a href="/api/auth/logout" className="sidebar-signout text-xs">
            Sign out
          </a>
          <div
            className="flex gap-3 mt-3 pt-3 text-xs"
            style={{ borderTop: "1px solid var(--glass-border)", color: "var(--text-muted)" }}
          >
            <a href="/privacy" style={{ color: "var(--text-muted)" }}>Privacy</a>
            <a href="/terms" style={{ color: "var(--text-muted)" }}>Terms</a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        <UsageBanner
          callsUsed={callsUsed}
          callsLimit={callsLimit}
          isFreeUser={Boolean(isFreeUser)}
          periodEnd={periodEnd}
        />
        {children}
      </main>
    </div>
  );
}
