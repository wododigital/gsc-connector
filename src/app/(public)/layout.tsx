import Link from "next/link";

const navLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/guides", label: "Guides" },
  { href: "/faq", label: "FAQ" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(6, 10, 16, 0.82)",
          backdropFilter: "blur(24px) saturate(1.6)",
          WebkitBackdropFilter: "blur(24px) saturate(1.6)",
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: 60,
            }}
          >
            <Link href="/" style={{ display: "flex", alignItems: "center" }}>
              <img
                src="/OMG Rectangle LOGO Dark BG.svg"
                alt="OMG Bridge"
                style={{ height: 30, width: "auto" }}
              />
            </Link>
            <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    padding: "6px 12px",
                    borderRadius: "var(--radius-sm)",
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link
                href="/auth/login"
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  padding: "6px 12px",
                  textDecoration: "none",
                }}
              >
                Sign in
              </Link>
              <Link
                href="/api/auth/google"
                className="btn-primary"
                style={{ fontSize: 13, padding: "7px 16px" }}
              >
                Get started free
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer
        style={{
          borderTop: "1px solid var(--glass-border)",
          marginTop: 80,
        }}
      >
        <div
          className="max-w-6xl mx-auto px-6"
          style={{
            paddingTop: 48,
            paddingBottom: 24,
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 32,
            }}
          >
            <div>
              <img src="/OMG Rectangle LOGO Dark BG.svg" alt="OMG Bridge" className="h-7 mb-3" />
              <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>
                Connect Google Search Console, Analytics, and Business Profile to your AI assistants via MCP.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div>
                <p
                  className="font-semibold mb-3"
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                  }}
                >
                  Product
                </p>
                <ul className="space-y-2">
                  <li><Link href="/features" style={{ color: "var(--text-secondary)" }}>Features</Link></li>
                  <li><Link href="/pricing" style={{ color: "var(--text-secondary)" }}>Pricing</Link></li>
                  <li><Link href="/guides" style={{ color: "var(--text-secondary)" }}>Setup Guides</Link></li>
                </ul>
              </div>
              <div>
                <p
                  className="font-semibold mb-3"
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                  }}
                >
                  Support
                </p>
                <ul className="space-y-2">
                  <li><Link href="/faq" style={{ color: "var(--text-secondary)" }}>FAQ</Link></li>
                  <li><Link href="/dashboard/tickets" style={{ color: "var(--text-secondary)" }}>Support Tickets</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid var(--glass-border)",
              paddingTop: 16,
              textAlign: "center",
            }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              &copy; {new Date().getFullYear()} OMG Bridge. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
