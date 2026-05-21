import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  SidebarLink,
  SidebarSection,
  SidebarToggle,
  SidebarTooltipHost,
} from "@/components/sidebar-link";

/* ────────────────────────────────────────────────────────────
 * Inline icon set (16x16, stroke-current). Local so the admin
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
  users: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="5.5" r="2.5" />
      <path d="M2 13.5c.4-2.2 2-3.5 4-3.5s3.6 1.3 4 3.5" />
      <circle cx="11.5" cy="6" r="2" />
      <path d="M14 13c-.2-1.6-1.1-2.7-2.5-3" />
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 13h12M4 11V7M7 11V4M10 11V8M13 11V5" />
    </svg>
  ),
  tickets: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2a1.5 1.5 0 0 0 0 3v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1.5 1.5 0 0 0 0-3z" />
      <path d="M10 4v8" strokeDasharray="1 1.5" />
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 7a4 4 0 0 1 8 0v3l1 1.5H3L4 10z" />
      <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" />
    </svg>
  ),
  prompts: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7l-3 2v-2H4a2 2 0 0 1-2-2z" />
    </svg>
  ),
  coupons: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8.5 1.5h5v5L7 13.5l-5-5z" />
      <circle cx="11" cy="4" r="0.8" fill="currentColor" />
    </svg>
  ),
  errors: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 1.5l6.5 11.5h-13z" />
      <path d="M8 6v3.5" />
      <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
    </svg>
  ),
  proRequests: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2.5 4.5h11v8a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1z" />
      <path d="M2.5 4.5L8 8.5l5.5-4" />
      <path d="M5 2.5h6" />
    </svg>
  ),
  back: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 3.5L4.5 8l4.5 4.5M4.5 8H14" />
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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || !isAdminEmail(session.email)) {
    redirect("/dashboard");
  }

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
        <Link href="/admin" className="brand">
          <Image
            src="/omg-logo-light.webp"
            alt="OMG / BRIDGE"
            width={120}
            height={26}
            className="logo-img"
            priority
          />
          <Image
            src="/omg-bridge-icon.svg"
            alt="OMG"
            width={28}
            height={28}
            className="logo-icon"
          />
        </Link>
        <div className="breadcrumb">
          <span className="dot" />
          <span>WORKSPACE / ADMIN /</span>
          <span className="here">CONTROL PANEL</span>
        </div>
        <div className="user">
          <ThemeToggle />
          <div className="info">
            <span className="role-tag">ADMIN</span>
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
            <SidebarLink href="/admin" exact icon={Icons.overview} label="Overview" />
            <SidebarLink href="/admin/users" icon={Icons.users} label="Users" />
            <SidebarLink
              href="/admin/pro-requests"
              icon={Icons.proRequests}
              label="Pro Requests"
            />
            <SidebarLink href="/admin/activity" icon={Icons.activity} label="Activity" />

            <SidebarSection label="SUPPORT" defaultOpen>
              <SidebarLink href="/admin/tickets" icon={Icons.tickets} label="Tickets" />
              <SidebarLink
                href="/admin/notifications"
                icon={Icons.notifications}
                label="Notifications"
              />
            </SidebarSection>

            <SidebarSection label="TOOLING" defaultOpen>
              <SidebarLink href="/admin/prompts" icon={Icons.prompts} label="Prompts" />
              <SidebarLink href="/admin/coupons" icon={Icons.coupons} label="Coupons" />
              <SidebarLink href="/admin/errors" icon={Icons.errors} label="Errors" />
            </SidebarSection>

            <SidebarSection label="EXIT" defaultOpen>
              <SidebarLink href="/dashboard" icon={Icons.back} label="User Dashboard" />
            </SidebarSection>
          </nav>

          <div className="footer-mini">
            <div>OMG · BRIDGE</div>
            <div className="footer-role">Admin console</div>
          </div>
        </aside>

        <main className="main">{children}</main>
      </div>

      <SidebarTooltipHost />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Layout CSS — Swiss Dark Modernist topbar + collapsible sidebar.
 * Mirrors the dashboard layout, but with a vermilion admin accent
 * on the topbar role tag so admins always know where they are.
 * ──────────────────────────────────────────────────────────── */
const LAYOUT_CSS = `
:root { --sidebar-w: 240px; }
body.sidebar-collapsed { --sidebar-w: 64px; }
body { padding-top: 57px; }

body::before {
  content: '';
  position: fixed; inset: 0;
  background:
    radial-gradient(50% 40% at 0% 0%, rgba(255,107,74,0.06), transparent 60%),
    radial-gradient(40% 30% at 100% 100%, rgba(0,181,181,0.05), transparent 60%);
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
  background: var(--topbar-bg);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--vermilion);
  font-family: var(--body);
  font-size: 11px;
  letter-spacing: 0.06em;
  transition: grid-template-columns .25s ease, background .25s ease;
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
  background: var(--vermilion);
  box-shadow: 0 0 6px var(--vermilion);
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
.topbar .user .role-tag {
  font-family: var(--body);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--vermilion);
  border: 1px solid var(--vermilion);
  padding: 3px 8px;
}
.topbar .user .avatar {
  width: 26px; height: 26px;
  background: var(--vermilion);
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
  color: var(--vermilion);
  background: var(--surface-2);
  border-left-color: var(--vermilion);
  font-weight: 500;
}
.sidebar .nav-link .icon { display: grid; place-items: center; color: var(--ink-3); transition: color .15s; }
.sidebar .nav-link .icon svg { width: 16px; height: 16px; display: block; }
.sidebar .nav-link:hover .icon { color: var(--ink); }
.sidebar .nav-link.active .icon { color: var(--vermilion); }
.sidebar .nav-link .badge {
  font-family: var(--mono);
  font-size: 10px;
  padding: 1px 6px;
  background: var(--surface-3);
  color: var(--ink-3);
  letter-spacing: 0;
}
.sidebar .nav-link.active .badge { background: var(--vermilion); color: var(--bg); }
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
.sidebar-toggle:hover { color: var(--vermilion); background: var(--surface-2); }
.sidebar-toggle .icon { display: grid; place-items: center; color: var(--ink-3); transition: color .15s; }
.sidebar-toggle:hover .icon { color: var(--vermilion); }
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
.sidebar .footer-mini .footer-role {
  color: var(--vermilion);
  letter-spacing: 0.16em;
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
  border: 1px solid var(--vermilion);
  box-shadow: 0 0 12px var(--vermilion-glow);
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

/* ─── shared page-header primitive ────────────────────── */
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
.page-header .eyebrow .num { color: var(--vermilion); font-family: var(--mono); }
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
.page-header h1 .accent { color: var(--vermilion); }
.page-header .lede {
  color: var(--ink-2);
  font-size: 14px;
  max-width: 640px;
}
.page-header .lede strong { color: var(--ink); font-weight: 600; }
.page-header .actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }

/* shared section-header */
.section-header {
  display: flex; justify-content: space-between; align-items: end;
  margin: 36px 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--rule);
  gap: 16px;
  flex-wrap: wrap;
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
  flex-wrap: wrap;
}

/* shared stats row (KPI grid) */
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
.stats-row .stat .num.amber { color: var(--amber); }
.stats-row .stat .num.green { color: var(--green); }
.stats-row .stat .sub {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--ink-3);
}

/* admin alert banner (uses existing pill colors) */
.admin-alert {
  display: flex; flex-direction: column; gap: 8px;
  padding: 14px 18px;
  background: var(--surface-1);
  border: 1px solid var(--vermilion);
  border-left-width: 3px;
  margin-bottom: 24px;
}
.admin-alert p { font-size: 12.5px; color: var(--ink-2); margin: 0; }
.admin-alert p.warn { color: var(--amber); }
.admin-alert p.err  { color: var(--vermilion); }

/* generic surface card (used by config/forms) */
.surface-card {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  padding: 22px 24px;
}
.surface-card.padded-lg { padding: 28px 28px; }
.surface-card .head {
  font-family: var(--display);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink);
  margin-bottom: 16px;
}

/* filter-bar (search + chips above tables) */
.filter-bar {
  display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
  margin: 16px 0;
}
.filter-bar .search {
  flex: 1;
  min-width: 220px;
  background: var(--bg);
  border: 1px solid var(--rule);
  color: var(--ink);
  padding: 10px 14px;
  font-family: var(--body);
  font-size: 13px;
  outline: none;
  transition: border-color .18s;
}
.filter-bar .search:focus { border-color: var(--vermilion); }
.filter-bar .search::placeholder { color: var(--ink-3); }
.filter-bar select {
  background: var(--bg);
  border: 1px solid var(--rule);
  color: var(--ink-2);
  padding: 10px 12px;
  font-family: var(--body);
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color .18s, color .18s;
}
.filter-bar select:focus { border-color: var(--vermilion); color: var(--ink); outline: none; }
.filter-bar .chip {
  padding: 7px 14px;
  font-size: 11px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  border: 1px solid var(--rule);
  color: var(--ink-3);
  background: transparent;
  cursor: pointer;
  font-family: var(--body);
  transition: all .15s;
}
.filter-bar .chip:hover { border-color: var(--rule-strong); color: var(--ink); }
.filter-bar .chip.active {
  border-color: var(--vermilion);
  color: var(--vermilion);
  background: rgba(255, 107, 74, 0.08);
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
  gap: 12px;
}
.pagination .pages { display: flex; gap: 4px; flex-wrap: wrap; }
.pagination .pages button, .pagination .pages span {
  padding: 5px 12px;
  background: transparent;
  border: 1px solid var(--rule);
  color: var(--ink-2);
  font-family: var(--mono);
  font-size: 11px;
  cursor: pointer;
  transition: all .15s;
}
.pagination .pages button:hover:not(:disabled) { border-color: var(--vermilion); color: var(--vermilion); }
.pagination .pages button:disabled { opacity: 0.35; cursor: not-allowed; }

/* table empty/loading row helpers */
.data-table .row-empty td {
  text-align: center;
  padding: 32px 16px;
  color: var(--ink-3);
  font-style: normal;
}
.data-table .row-good td { color: var(--green); }

/* progress bar (used in users table) */
.bar {
  width: 100%;
  height: 4px;
  background: var(--surface-3);
  position: relative;
  overflow: hidden;
}
.bar > span {
  display: block;
  height: 100%;
  background: var(--teal);
  transition: width .25s, background .25s;
}
.bar.warn > span  { background: var(--amber); }
.bar.error > span { background: var(--vermilion); }

/* notification cards */
.notif-card {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  border-left-width: 3px;
  padding: 14px 18px;
  display: flex; gap: 14px;
  cursor: pointer;
  transition: border-color .18s, background .18s;
}
.notif-card:hover { background: var(--surface-2); }
.notif-card.unread { border-left-color: var(--teal); }
.notif-card.read { opacity: 0.55; }
.notif-card.severity-error   { border-left-color: var(--vermilion); }
.notif-card.severity-warning { border-left-color: var(--amber); }
.notif-card.severity-info    { border-left-color: var(--teal); }
.notif-card.severity-success { border-left-color: var(--green); }
.notif-card .col { flex: 1; min-width: 0; }
.notif-card .meta-row {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 6px; flex-wrap: wrap;
}
.notif-card .meta-row .ts {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--ink-3);
}
.notif-card .title {
  font-family: var(--display);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0;
  color: var(--ink);
  margin-bottom: 4px;
}
.notif-card .body { font-size: 13px; color: var(--ink-2); line-height: 1.5; }

/* tickets two-pane layout */
.tickets-shell {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  height: calc(100vh - 240px);
  min-height: 480px;
}
.tickets-list {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  overflow-y: auto;
}
.tickets-list .row {
  padding: 12px 14px;
  border-bottom: 1px solid var(--rule);
  cursor: pointer;
  transition: background .15s;
}
.tickets-list .row:hover { background: var(--surface-2); }
.tickets-list .row.active {
  background: var(--surface-2);
  border-left: 3px solid var(--vermilion);
  padding-left: 11px;
}
.tickets-list .row .head {
  display: flex; justify-content: space-between; gap: 8px; margin-bottom: 6px;
}
.tickets-list .row .subject {
  font-size: 13px; color: var(--ink); margin-bottom: 4px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.tickets-list .row .meta {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--ink-3);
}
.tickets-detail {
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.tickets-detail .head {
  padding: 16px 20px;
  border-bottom: 1px solid var(--rule);
  display: flex; justify-content: space-between; align-items: start;
  gap: 16px;
}
.tickets-detail .head .title {
  font-family: var(--display); font-weight: 700;
  font-size: 16px; letter-spacing: 0.02em;
  text-transform: uppercase; color: var(--ink);
  margin-bottom: 4px;
}
.tickets-detail .head .sub {
  font-family: var(--mono); font-size: 11px; color: var(--ink-3);
}
.tickets-detail .messages {
  flex: 1; overflow-y: auto;
  padding: 18px 20px;
  display: flex; flex-direction: column; gap: 12px;
}
.tickets-detail .msg {
  max-width: 80%;
  border: 1px solid var(--rule);
  background: var(--bg);
  padding: 12px 14px;
}
.tickets-detail .msg.admin {
  align-self: flex-end;
  border-color: var(--card-rule);
  background: rgba(0, 181, 181, 0.08);
}
.tickets-detail .msg .who {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 6px;
}
.tickets-detail .msg .text {
  font-size: 13px;
  color: var(--ink);
  white-space: pre-wrap;
  line-height: 1.55;
}
.tickets-detail .reply {
  padding: 16px 20px;
  border-top: 1px solid var(--rule);
  display: flex; flex-direction: column; gap: 10px;
}
.tickets-detail .reply textarea {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--rule);
  color: var(--ink);
  padding: 12px 14px;
  font-family: var(--body);
  font-size: 13px;
  outline: none;
  resize: vertical;
  min-height: 80px;
  transition: border-color .18s;
}
.tickets-detail .reply textarea:focus { border-color: var(--vermilion); }
.tickets-detail .reply .actions {
  display: flex; gap: 10px; justify-content: flex-end;
}
.tickets-empty {
  display: grid; place-items: center;
  background: var(--surface-1);
  border: 1px solid var(--rule-strong);
  color: var(--ink-3);
  font-size: 12px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}

/* prompt modal */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 100;
  display: grid; place-items: center;
  padding: 24px;
}
.modal-shell {
  width: 100%;
  max-width: 760px;
  max-height: 92vh;
  display: flex; flex-direction: column;
  background: var(--surface-1);
  border: 1px solid var(--card-rule);
  box-shadow: 0 30px 80px -20px rgba(0,0,0,0.7), 0 0 60px var(--teal-glow);
}
.modal-shell .head {
  padding: 16px 22px;
  border-bottom: 1px solid var(--rule);
  display: flex; justify-content: space-between; align-items: center;
}
.modal-shell .head h2 {
  font-family: var(--display);
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink);
}
.modal-shell .body {
  padding: 20px 22px;
  overflow-y: auto;
  flex: 1;
  display: flex; flex-direction: column; gap: 18px;
}
.modal-shell .foot {
  padding: 16px 22px;
  border-top: 1px solid var(--rule);
  display: flex; justify-content: flex-end; gap: 10px;
}
.modal-shell textarea {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--rule);
  color: var(--ink);
  padding: 12px 14px;
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.55;
  outline: none;
  resize: vertical;
  transition: border-color .18s;
}
.modal-shell textarea:focus { border-color: var(--teal); }
.tag-toggle {
  display: inline-flex; align-items: center;
  font-size: 11px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  padding: 6px 12px;
  border: 1px solid var(--rule);
  color: var(--ink-3);
  background: transparent;
  cursor: pointer;
  transition: all .15s;
  font-family: var(--body);
}
.tag-toggle:hover { border-color: var(--rule-strong); color: var(--ink); }
.tag-toggle.on {
  border-color: var(--teal);
  color: var(--teal);
  background: rgba(0, 181, 181, 0.08);
}

/* ─── responsive ────────────────────────────────────── */
@media (max-width: 980px) {
  .topbar { grid-template-columns: 1fr auto; }
  .topbar .breadcrumb { display: none; }
  .topbar .user .email { display: none; }
  .topbar .user .role-tag { display: none; }
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
  .tickets-shell {
    grid-template-columns: 1fr;
    height: auto;
  }
  .tickets-list { max-height: 300px; }
}
`;
