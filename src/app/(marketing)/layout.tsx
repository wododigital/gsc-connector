"use client";

import { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";

const navLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/guides", label: "Guides" },
  { href: "/faq", label: "FAQ" },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
            {/* Logo */}
            <a href="/" style={{ display: "flex", alignItems: "center" }}>
              <img
                src="/OMG Rectangle LOGO Dark BG.svg"
                alt="OMG AI"
                style={{ height: 30, width: "auto" }}
              />
            </a>

            {/* Desktop nav */}
            <nav
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              className="nav-desktop"
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    padding: "6px 12px",
                    borderRadius: "var(--radius-sm)",
                    textDecoration: "none",
                    transition: "color 0.15s ease, background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.target as HTMLElement;
                    el.style.color = "var(--text-primary)";
                    el.style.background = "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.target as HTMLElement;
                    el.style.color = "var(--text-secondary)";
                    el.style.background = "transparent";
                  }}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Desktop actions */}
            <div
              style={{ display: "flex", alignItems: "center", gap: 8 }}
              className="nav-desktop"
            >
              <a
                href="/auth/login"
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-sm)",
                  textDecoration: "none",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--text-primary)")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-secondary)")}
              >
                Sign in
              </a>
              <a
                href="/api/auth/google"
                className="btn-primary"
                style={{ fontSize: 13, padding: "7px 16px" }}
              >
                Get started free
                <ArrowRight size={13} />
              </a>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="nav-mobile-btn"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                padding: 4,
                display: "none",
              }}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            style={{
              borderTop: "1px solid var(--glass-border)",
              background: "rgba(6,10,16,0.96)",
              padding: "16px 24px 24px",
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "block",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  padding: "12px 0",
                  textDecoration: "none",
                  borderBottom: "1px solid var(--glass-border)",
                }}
              >
                {link.label}
              </a>
            ))}
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              <a href="/auth/login" className="btn-ghost" style={{ justifyContent: "center", fontSize: 14 }}>
                Sign in
              </a>
              <a href="/api/auth/google" className="btn-primary" style={{ justifyContent: "center", fontSize: 14 }}>
                Get started free
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        )}
      </header>

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
        }
      `}</style>

      <main>{children}</main>
    </div>
  );
}
