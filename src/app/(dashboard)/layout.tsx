import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  SidebarLink,
  SidebarSection,
  SidebarToggle,
  SidebarTooltipHost,
} from "@/components/sidebar-link";
import { UsageBanner } from "@/components/usage-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import db from "@/lib/db";

/* ────────────────────────────────────────────────────────────
 * Inline icon set (16x16, stroke-current). Kept local so the
 * sidebar nav stays a single self-contained file.
 * ──────────────────────────────────────────────────────────── */
const Icons = {
  overview: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="5" height="5" />
      <rect x="9" y="2" width="5" height="5" />
      <rect x="2" y="9" width="5" height="5" />
      <rect x="9" y="9" width="5" height="5" />
    </svg>
  ),
  prompts: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7l-3 2v-2H4a2 2 0 0 1-2-2z" />
    </svg>
  ),
  properties: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="8" cy="3.5" rx="5" ry="1.5" />
      <path d="M3 3.5v3c0 .8 2.2 1.5 5 1.5s5-.7 5-1.5v-3" />
      <path d="M3 8v3c0 .8 2.2 1.5 5 1.5s5-.7 5-1.5V8" />
    </svg>
  ),
  apikeys: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="5.5" cy="8" r="2.5" />
      <path d="M8 8h6m-2.5 0v2.5M14 8v3" />
    </svg>
  ),
  branding: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6c0 1.1-1 2-2 2H10c-1 0-1.5 1-1 2 .3.7-.3 2-1 2z" />
      <circle cx="5" cy="7" r="0.6" fill="currentColor" />
      <circle cx="8" cy="5" r="0.6" fill="currentColor" />
      <circle cx="11" cy="7" r="0.6" fill="currentColor" />
    </svg>
  ),
  usage: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 13h12M2 13V3M5 11l3-4 2 2 4-5" />
    </svg>
  ),
  billing: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1" />
      <path d="M1.5 6.5h13M3.5 10h2" />
    </svg>
  ),
  support: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6" />
      <path d="M6.2 6.5c0-1 .9-1.8 1.8-1.8s1.8.8 1.8 1.8-1.8 1.4-1.8 2.4" />
      <circle cx="8" cy="11.4" r="0.5" fill="currentColor" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2L3.4 12.6M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 1.5l5 2.5v4c0 3-2.2 5.5-5 6.5-2.8-1-5-3.5-5-6.5V4z" />
      <path d="M6 8.5l1.5 1.5L11 6.5" />
    </svg>
  ),
};

function initialsFor(email: string): string {
  if (!email) return "??";
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "??").toUpperCase();
}

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

  // Subscription stats for the usage banner.
  const subscription = await db.userSubscription.findUnique({
    where: { userId: session.id },
    include: { plan: true },
  });
  const isFreeUser = subscription?.plan.name === "free";
  const callsUsed = subscription?.callsUsed ?? 0;
  const callsLimit = subscription?.plan.monthlyCalls ?? 200;
  const periodEnd = (
    subscription?.periodEnd ?? new Date(Date.now() + 30 * 86400000)
  ).toISOString();
  const planLabel = subscription?.plan.name?.toUpperCase() ?? "FREE";

  // Counts for sidebar badges. All wrapped so failures fall back to 0.
  const [promptCount, propertyCount, apiKeyCount] = await Promise.all([
    db.userPrompt
      .count({ where: { userId: session.id } })
      .catch(() => 0),
    Promise.all([
      db.gscProperty.count({ where: { userId: session.id, isActive: true } }).catch(() => 0),
      db.ga4Property.count({ where: { userId: session.id, isActive: true } }).catch(() => 0),
    ]).then(([a, b]) => a + b),
    db.apiKey.count({ where: { userId: session.id, isActive: true } }).catch(() => 0),
  ]);

  const isAdmin = session.email === process.env.ADMIN_EMAIL;
  const userInitials = initialsFor(session.email);

  return (
    <div>
      {/* Layout-scoped CSS. Foundation tokens live in globals.css; this only
          wires up the topbar + collapsible sidebar shell. */}
      <style>{LAYOUT_CSS}</style>

      {/* Default to collapsed sidebar so the layout boots in its narrow state.
          The SidebarToggle restores the user's preference from localStorage on mount. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{var s=localStorage.getItem('omg-sidebar-collapsed');if(s===null||s==='1'){document.body.classList.add('sidebar-collapsed');}}catch(e){document.body.classList.add('sidebar-collapsed');}",
        }}
      />

      {/* ── Topbar ─────────────────────────────────────────── */}
      <header className="topbar">
        <a href="/dashboard" className="brand">
          <img src="/omg-logo-light.webp" alt="OMG / BRIDGE" className="logo-img" />
          <img src="/omg-bridge-icon.svg" alt="OMG" className="logo-icon" />
        </a>
        <div className="breadcrumb">
          <span className="dot" />
          <span>WORKSPACE / WODO DIGITAL /</span>
          <span className="here">DASHBOARD</span>
        </div>
        <div className="user">
          <ThemeToggle />
          <div className="info">
            <div className="avatar">{userInitials}</div>
            <span className="email">{session.email}</span>
          </div>
          <a href="/api/auth/logout">SIGN OUT</a>
        </div>
      </header>

      {/* ── Shell: sidebar + main ───────────────────────────── */}
      <div className="shell">
        <aside className="sidebar">
          <SidebarToggle />
          <nav>
            <div className="section-label">WORKSPACE</div>
            <SidebarLink href="/dashboard" exact icon={Icons.overview} label="Overview" />
            <SidebarLink
              href="/dashboard/prompts"
              icon={Icons.prompts}
              label="Prompts"
              badge={promptCount > 0 ? promptCount : null}
            />
            <SidebarLink
              href="/dashboard/properties"
              icon={Icons.properties}
              label="Properties"
              badge={propertyCount > 0 ? propertyCount : null}
            />
            <SidebarLink
              href="/dashboard/keys"
              icon={Icons.apikeys}
              label="API Keys"
              badge={apiKeyCount > 0 ? apiKeyCount : null}
            />
            <SidebarLink href="/dashboard/branding" icon={Icons.branding} label="Branding" />

            <SidebarSection label="ACCOUNT" defaultOpen>
              <SidebarLink href="/dashboard/logs" icon={Icons.usage} label="Usage Logs" />
              <SidebarLink
                href="/dashboard/billing"
                icon={Icons.billing}
                label="Billing"
                badge={planLabel}
              />
              <SidebarLink href="/dashboard/tickets" icon={Icons.support} label="Support" />
              <SidebarLink href="/dashboard/settings" icon={Icons.settings} label="Settings" />
              {isAdmin && (
                <SidebarLink href="/admin" icon={Icons.admin} label="Admin Panel" />
              )}
            </SidebarSection>
          </nav>

          <div className="footer-mini">
            <div>OMG · BRIDGE</div>
            <div className="status">ALL SYSTEMS NOMINAL</div>
          </div>
        </aside>

        <main className="main">
          <UsageBanner
            callsUsed={callsUsed}
            callsLimit={callsLimit}
            isFreeUser={Boolean(isFreeUser)}
            periodEnd={periodEnd}
          />
          {children}
        </main>
      </div>

      <SidebarTooltipHost />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Layout CSS — Swiss Dark Modernist topbar + collapsible sidebar.
 * Self-contained so it doesn't bleed into other routes.
 * ──────────────────────────────────────────────────────────── */
const LAYOUT_CSS = `
:root { --sidebar-w: 240px; }
body.sidebar-collapsed { --sidebar-w: 64px; }
body { padding-top: 57px; }

body::before {
  content: '';
  position: fixed; inset: 0;
  background:
    radial-gradient(50% 40% at 0% 0%, rgba(0,181,181,0.07), transparent 60%),
    radial-gradient(40% 30% at 100% 100%, rgba(255,107,74,0.04), transparent 60%);
  pointer-events: none;
  z-index: 0;
}

/* ─── topbar (fixed) ─────────────────────────────────── */
.topbar {
  position: fixed; top: 0; left: 0; right: 0;
  z-index: 50;
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr auto;
  align-items: stretch;
  background: rgba(10,16,24,0.92);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--teal);
  font-family: var(--body);
  font-size: 11px;
  letter-spacing: 0.06em;
  transition: grid-template-columns .25s ease;
}
.topbar .brand {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 24px;
  border-right: 1px solid var(--rule-strong);
  text-decoration: none;
  transition: padding .25s ease, justify-content .25s ease;
}
.topbar .brand img { height: 26px; width: auto; }
.topbar .brand .logo-icon { display: none; height: 28px; width: auto; }
body.sidebar-collapsed .topbar .brand { padding: 14px 0; justify-content: center; gap: 0; }
body.sidebar-collapsed .topbar .brand .logo-img { display: none; }
body.sidebar-collapsed .topbar .brand .logo-icon { display: block; }

.topbar .breadcrumb {
  display: flex; align-items: center; gap: 12px;
  padding: 0 24px;
  color: var(--ink-3);
  letter-spacing: 0.10em;
  text-transform: uppercase;
}
.topbar .breadcrumb .dot {
  width: 6px; height: 6px;
  background: var(--teal);
  box-shadow: 0 0 6px var(--teal);
  border-radius: 50%;
}
.topbar .breadcrumb .here { color: var(--ink); font-weight: 500; }

.topbar .user { display: flex; align-items: stretch; }
.topbar .user .info {
  padding: 14px 22px;
  display: flex; align-items: center; gap: 10px;
  border-left: 1px solid var(--rule-strong);
  color: var(--ink-2);
  font-size: 11px;
  letter-spacing: 0.04em;
}
.topbar .user .avatar {
  width: 26px; height: 26px;
  background: var(--teal);
  color: var(--bg);
  display: grid; place-items: center;
  font-family: var(--display);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0;
}
.topbar .user a {
  padding: 14px 22px;
  display: flex; align-items: center;
  border-left: 1px solid var(--rule-strong);
  color: var(--ink-2);
  text-decoration: none;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  font-size: 11px;
  transition: all .15s;
}
.topbar .user a:hover { background: var(--surface-1); color: var(--vermilion); }

/* ─── shell ─────────────────────────────────────────── */
.shell {
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr;
  min-height: calc(100vh - 57px);
  transition: grid-template-columns .25s ease;
  position: relative;
  z-index: 1;
}

/* ─── sidebar ───────────────────────────────────────── */
.sidebar {
  background: var(--surface-1);
  border-right: 1px solid var(--rule);
  padding: 0 0 24px;
  display: flex; flex-direction: column;
  position: sticky; top: 57px;
  height: calc(100vh - 57px);
  overflow-y: auto;
  overflow-x: visible;
}
.sidebar nav { padding-top: 12px; display: flex; flex-direction: column; }
.sidebar .section-label {
  font-size: 10px;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  color: var(--ink-3);
  padding: 12px 24px 6px;
  margin-top: 8px;
}
.sidebar .section-label:first-child { margin-top: 0; }

.sidebar .nav-link {
  padding: 11px 22px;
  color: var(--ink-2);
  text-decoration: none;
  font-size: 13px;
  letter-spacing: 0.02em;
  display: grid;
  grid-template-columns: 22px 1fr auto;
  align-items: center;
  gap: 12px;
  border-left: 2px solid transparent;
  transition: color .15s ease, background .15s ease, border-color .15s ease;
}
.sidebar .nav-link:hover { color: var(--ink); background: var(--surface-2); }
.sidebar .nav-link.active {
  color: var(--teal-bright);
  background: var(--surface-2);
  border-left-color: var(--teal);
  font-weight: 500;
}
.sidebar .nav-link .icon { display: grid; place-items: center; color: var(--ink-3); transition: color .15s; }
.sidebar .nav-link .icon svg { width: 16px; height: 16px; display: block; }
.sidebar .nav-link:hover .icon { color: var(--ink); }
.sidebar .nav-link.active .icon { color: var(--teal-bright); }
.sidebar .nav-link .badge {
  font-family: var(--mono);
  font-size: 10px;
  padding: 1px 6px;
  background: var(--surface-3);
  color: var(--ink-3);
  letter-spacing: 0;
}
.sidebar .nav-link.active .badge { background: var(--teal); color: var(--bg); }
.sidebar .nav-link .badge:empty { display: none; }

/* sidebar hamburger toggle (matches nav-link grid) */
.sidebar-toggle {
  width: 100%;
  background: none;
  border: none;
  border-bottom: 1px solid var(--rule);
  padding: 13px 22px;
  display: grid;
  grid-template-columns: 22px 1fr auto;
  align-items: center;
  gap: 12px;
  color: var(--ink-2);
  font-family: inherit;
  font-size: 13px;
  letter-spacing: 0.02em;
  text-align: left;
  cursor: pointer;
  transition: color .15s, background .15s;
}
.sidebar-toggle:hover { color: var(--teal); background: var(--surface-2); }
.sidebar-toggle .icon { display: grid; place-items: center; color: var(--ink-3); transition: color .15s; }
.sidebar-toggle:hover .icon { color: var(--teal); }
.sidebar-toggle .icon svg { width: 16px; height: 16px; display: block; }
body.sidebar-collapsed .sidebar-toggle {
  grid-template-columns: 1fr;
  justify-items: center;
  padding: 13px 0;
  gap: 0;
}
body.sidebar-collapsed .sidebar-toggle .label-text { display: none; }

/* section dropdown toggle */
.section-toggle {
  width: 100%;
  background: none; border: none;
  padding: 12px 24px 6px;
  margin-top: 8px;
  display: flex; justify-content: space-between; align-items: center;
  font-size: 10px;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  color: var(--ink-3);
  cursor: pointer;
  font-family: var(--body);
  transition: color .15s;
}
.section-toggle:hover { color: var(--ink); }
.section-toggle .caret { font-size: 10px; transition: transform .2s; display: inline-block; }
.section-toggle.collapsed .caret { transform: rotate(-90deg); }
.section-children { max-height: 600px; overflow: hidden; transition: max-height .25s ease; }
.section-children.collapsed { max-height: 0; }

/* footer */
.sidebar .footer-mini {
  margin-top: auto;
  padding: 16px 24px;
  border-top: 1px solid var(--rule);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-3);
  display: flex; flex-direction: column; gap: 4px;
}
.sidebar .footer-mini .status {
  color: var(--teal);
  display: flex; align-items: center; gap: 6px;
}
.sidebar .footer-mini .status::before {
  content: ''; width: 6px; height: 6px; background: var(--teal);
  box-shadow: 0 0 6px var(--teal); border-radius: 50%;
  animation: pulse 2.4s ease-in-out infinite;
}

/* COLLAPSED state */
body.sidebar-collapsed .sidebar .nav-link {
  grid-template-columns: 1fr;
  justify-items: center;
  padding: 12px 0;
  gap: 0;
}
body.sidebar-collapsed .sidebar .nav-link .label-text,
body.sidebar-collapsed .sidebar .nav-link .badge,
body.sidebar-collapsed .sidebar .section-label,
body.sidebar-collapsed .sidebar .footer-mini { display: none; }
body.sidebar-collapsed .sidebar .section-toggle {
  padding: 14px 0 6px;
  justify-content: center;
}
body.sidebar-collapsed .sidebar .section-toggle .label,
body.sidebar-collapsed .sidebar .section-toggle .caret { display: none; }
body.sidebar-collapsed .sidebar .section-toggle::after {
  content: '·';
  color: var(--ink-3);
  font-size: 22px;
  line-height: 0;
}
body.sidebar-collapsed .sidebar .section-children { max-height: none !important; overflow: visible; }

/* tooltip (JS-positioned · escapes overflow clipping) */
.sidebar-tooltip {
  position: fixed;
  background: var(--surface-2);
  color: var(--ink);
  padding: 6px 12px;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
  border: 1px solid var(--teal);
  box-shadow: 0 0 12px var(--teal-glow);
  z-index: 1000;
  pointer-events: none;
  opacity: 0;
  transition: opacity .12s ease;
}
.sidebar-tooltip.visible { opacity: 1; }

/* ─── main ──────────────────────────────────────────── */
.main {
  padding: 0 40px 80px;
  max-width: 100%;
  position: relative;
  z-index: 2;
  min-width: 0;
}

/* ─── shared page-header primitive (used by every dashboard page) ── */
.page-header {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: end;
  padding: 36px 0 28px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--rule);
}
.page-header .eyebrow {
  display: flex; align-items: center; gap: 12px;
  font-size: 10px;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 14px;
}
.page-header .eyebrow .num { color: var(--teal); font-family: var(--mono); }
.page-header h1 {
  font-family: var(--display);
  font-weight: 700;
  font-size: 38px;
  line-height: 1.0;
  letter-spacing: -0.035em;
  text-transform: uppercase;
  margin-bottom: 8px;
  color: var(--ink);
}
.page-header h1 .accent { color: var(--teal); }
.page-header .lede {
  color: var(--ink-2);
  font-size: 14px;
  max-width: 640px;
}
.page-header .lede strong { color: var(--ink); font-weight: 600; }
.page-header .actions { display: flex; gap: 10px; flex-wrap: wrap; }

/* shared section-header (between page sections) */
.section-header {
  display: flex; justify-content: space-between; align-items: end;
  margin: 36px 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--rule);
}
.section-header h2 {
  font-family: var(--display);
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink);
}
.section-header .right {
  display: flex; gap: 12px; align-items: center;
  font-size: 11px;
  letter-spacing: 0.10em;
  color: var(--ink-3);
  text-transform: uppercase;
}
.section-header .right a { color: var(--teal); text-decoration: none; }
.section-header .right a:hover { color: var(--vermilion); }

/* shared stats row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 1px solid var(--rule-strong);
  margin-bottom: 16px;
  background: var(--surface-1);
}
.stats-row .stat {
  padding: 22px 24px;
  border-right: 1px solid var(--rule-strong);
  display: flex; flex-direction: column; gap: 8px;
}
.stats-row .stat:last-child { border-right: none; }
.stats-row .stat .label {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.stats-row .stat .num {
  font-family: var(--display);
  font-weight: 700;
  font-size: 36px;
  letter-spacing: -0.04em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}
.stats-row .stat .num.teal { color: var(--teal); }
.stats-row .stat .num.vermilion { color: var(--vermilion); }
.stats-row .stat .num .unit { font-size: 18px; color: var(--ink-3); }
.stats-row .stat .trend {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--ink-3);
  display: flex; align-items: center; gap: 6px;
}
.stats-row .stat .trend.up { color: var(--green); }
.stats-row .stat .trend.down { color: var(--vermilion); }

/* service cards */
.service-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.service-card {
  padding: 20px;
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  display: flex; flex-direction: column; gap: 12px;
  transition: border-color .18s;
}
.service-card.connected { border-color: var(--card-rule); }
.service-card .head {
  display: flex; justify-content: space-between; align-items: start;
  gap: 8px;
}
.service-card .name {
  font-family: var(--display);
  font-weight: 700;
  font-size: 16px;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--ink);
  line-height: 1.05;
}
.service-card .pill {
  font-size: 10px;
  padding: 3px 8px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  border: 1px solid var(--rule);
  color: var(--ink-3);
  display: flex; align-items: center; gap: 6px;
  white-space: nowrap;
}
.service-card.connected .pill {
  color: var(--teal); border-color: var(--teal);
}
.service-card.connected .pill::before {
  content: ''; width: 6px; height: 6px; background: var(--teal);
  box-shadow: 0 0 6px var(--teal); border-radius: 50%;
}
.service-card .meta {
  font-family: var(--mono);
  font-size: 11.5px;
  color: var(--ink-2);
  line-height: 1.7;
  display: flex; flex-direction: column; gap: 2px;
}
.service-card .meta .label {
  color: var(--ink-3);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.service-card .actions {
  margin-top: auto; padding-top: 12px;
  border-top: 1px solid var(--rule);
  display: flex; gap: 14px;
  font-size: 11px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}
.service-card .actions a {
  color: var(--ink-2);
  text-decoration: none;
  transition: color .15s;
}
.service-card .actions a:hover { color: var(--teal); }
.service-card .actions a.primary { color: var(--teal); }

/* endpoint card (highlight) */
.endpoint-card {
  background: var(--surface-1);
  border: 1px solid var(--card-rule);
  box-shadow: 0 0 0 1px var(--teal-glow), 0 0 30px var(--teal-glow);
  margin-top: 0;
}
.endpoint-card .ehead {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid var(--rule);
  background: var(--surface-2);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.endpoint-card .ehead .live { color: var(--teal); display: flex; align-items: center; gap: 6px; }
.endpoint-card .ehead .live::before {
  content: ''; width: 6px; height: 6px; background: var(--teal);
  box-shadow: 0 0 6px var(--teal); border-radius: 50%;
  animation: pulse 2.4s ease-in-out infinite;
}
.endpoint-card .ebody {
  padding: 18px;
  display: flex; align-items: center; gap: 14px;
}
.endpoint-card code {
  flex: 1;
  font-family: var(--mono);
  font-size: 13.5px;
  color: var(--ink);
  word-break: break-all;
}

/* tabs */
.tabs {
  display: flex;
  border-bottom: 1px solid var(--rule);
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.tabs button {
  padding: 14px 24px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--ink-3);
  font-family: var(--body);
  font-size: 11.5px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  cursor: pointer;
  display: flex; align-items: center; gap: 10px;
  transition: all .15s;
}
.tabs button:hover { color: var(--ink); }
.tabs button.active { color: var(--teal); border-bottom-color: var(--teal); }
.tabs button .count {
  font-family: var(--mono);
  font-size: 10px;
  padding: 2px 7px;
  background: var(--surface-2);
  color: var(--ink-3);
  letter-spacing: 0;
}
.tabs button.active .count { background: var(--teal); color: var(--bg); }

/* setup card with details/summary */
.setup-card {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  margin-bottom: 12px;
}
.setup-card summary {
  list-style: none;
  cursor: pointer;
  padding: 14px 18px;
  display: flex; justify-content: space-between; align-items: center;
  font-size: 12px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: var(--ink);
  font-weight: 500;
}
.setup-card summary::-webkit-details-marker { display: none; }
.setup-card summary .right {
  color: var(--ink-3);
  font-family: var(--mono); font-size: 11px;
  letter-spacing: 0;
}
.setup-card[open] summary { border-bottom: 1px solid var(--rule); }
.setup-card .body {
  padding: 16px 18px;
  font-size: 12.5px;
  color: var(--ink-2);
  line-height: 1.6;
}
.setup-card .body code {
  font-family: var(--mono);
  font-size: 11.5px;
  color: var(--teal-bright);
  background: var(--bg);
  padding: 2px 6px;
}
.setup-card .body ol { padding-left: 18px; }
.setup-card .body pre {
  background: var(--bg);
  border: 1px solid var(--rule);
  padding: 14px;
  font-family: var(--mono);
  font-size: 11.5px;
  color: var(--teal-bright);
  overflow-x: auto;
  margin-top: 10px;
  position: relative;
}

/* logs meta + pagination */
.logs-meta {
  display: flex; gap: 24px;
  padding: 14px 18px;
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  border-bottom: none;
  font-size: 11px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: var(--ink-3);
  flex-wrap: wrap;
}
.logs-meta strong { color: var(--ink); font-family: var(--mono); font-size: 13px; }
.pagination {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 18px;
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  border-top: none;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--ink-3);
  flex-wrap: wrap;
}
.pagination .pages { display: flex; gap: 4px; flex-wrap: wrap; }
.pagination .pages a, .pagination .pages span {
  padding: 5px 10px;
  background: transparent;
  border: 1px solid var(--rule);
  color: var(--ink-2);
  font-family: var(--mono);
  font-size: 11px;
  cursor: pointer;
  transition: all .15s;
  text-decoration: none;
}
.pagination .pages a:hover { border-color: var(--teal); color: var(--teal); }
.pagination .pages .active { background: var(--teal); color: var(--bg); border-color: var(--teal); }

/* ─── responsive ────────────────────────────────────── */
@media (max-width: 980px) {
  .topbar { grid-template-columns: 1fr auto; }
  .topbar .breadcrumb { display: none; }
  .topbar .user .email { display: none; }
  .shell { grid-template-columns: 1fr; }
  .sidebar { display: none; }
  .main { padding: 0 20px 64px; }
  .page-header { grid-template-columns: 1fr; }
  .page-header h1 { font-size: 28px; }
  .stats-row { grid-template-columns: 1fr 1fr; }
  .stats-row .stat:nth-child(2) { border-right: none; }
  .stats-row .stat:nth-child(1), .stats-row .stat:nth-child(2) {
    border-bottom: 1px solid var(--rule-strong);
  }
  .service-grid { grid-template-columns: 1fr; }
}
`;
