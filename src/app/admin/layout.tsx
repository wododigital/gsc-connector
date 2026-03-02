import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SidebarLink } from "@/components/sidebar-link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: "grid", exact: true },
    { href: "/admin/users", label: "Users", icon: "users" },
    { href: "/admin/tickets", label: "Tickets", icon: "ticket" },
    { href: "/admin/coupons", label: "Coupons", icon: "tag" },
    { href: "/admin/errors", label: "Errors & Health", icon: "alert" },
    { href: "/admin/activity", label: "Activity Log", icon: "list" },
    { href: "/admin/notifications", label: "Notifications", icon: "bell" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Full-screen background image */}
      <div className="app-background app-background-admin" />

      {/* Sidebar */}
      <aside className="glass-sidebar fixed left-0 top-0 h-full w-64 flex flex-col z-40">
        <div className="p-4 border-b" style={{ borderColor: "var(--glass-border)" }}>
          <div className="flex items-center gap-2">
            <img src="/OMG Rectangle LOGO Dark BG.svg" alt="OMG AI" className="h-8" />
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: "var(--text-muted)", border: "1px solid var(--glass-border)" }}>
              Admin
            </span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarLink key={item.href} href={item.href} exact={item.exact}>
              <NavIcon name={item.icon} />
              {item.label}
            </SidebarLink>
          ))}
        </nav>
        <div className="p-4 border-t space-y-2" style={{ borderColor: "var(--glass-border)" }}>
          <Link href="/dashboard" className="flex items-center gap-2 text-xs transition-colors" style={{ color: "var(--text-muted)" }}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Signed in as admin</p>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-6 min-h-screen">{children}</main>
    </div>
  );
}

function NavIcon({ name }: { name: string }) {
  const cls = "sidebar-icon";
  const icons: Record<string, React.ReactNode> = {
    grid: <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    users: <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    ticket: <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>,
    tag: <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
    alert: <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    list: <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
    bell: <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  };
  return <>{icons[name] ?? null}</>;
}
