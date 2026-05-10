import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "/features", label: "FEATURES" },
  { href: "/#how-it-works", label: "HOW IT WORKS" },
  { href: "/pricing", label: "PRICING" },
  { href: "/guides", label: "GUIDES" },
  { href: "/faq", label: "FAQ" },
];

const productLinks: { href: string; label: string; external?: boolean }[] = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#how-it-works", label: "How it works" },
];

const resourceLinks: { href: string; label: string; external?: boolean }[] = [
  { href: "/guides", label: "Documentation" },
  { href: "/faq", label: "FAQ" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

const companyLinks: { href: string; label: string; external?: boolean }[] = [
  { href: "mailto:hello@theomg.ai", label: "Contact" },
  { href: "https://wodo.digital", label: "About", external: true },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="topbar">
        <div className="brand">
          <Link href="/" style={{ display: "flex", alignItems: "center" }}>
            <Image
              src="/omg-logo-light.webp"
              alt="OMG / BRIDGE"
              width={140}
              height={28}
              className="logo-img"
              priority
            />
          </Link>
        </div>
        <nav>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="actions">
          <ThemeToggle />
          <Link href="/auth/login">LOG IN</Link>
          <Link href="/onboarding" className="primary">
            START FREE →
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="site-footer">
        <div className="gutter">
          <div className="num">05</div>
          <div className="vert">END · SESSION</div>
        </div>
        <div className="footer-body">
          <div className="footer-cta">
            <div>
              <h5>
                Stop digging. <span className="accent">Start asking.</span>
              </h5>
              <p>
                Free to start. No credit card. Connect Google in 90 seconds.
              </p>
              <Link href="/onboarding" className="btn btn-primary">
                Start Free →
              </Link>
            </div>
            <div className="right">
              <div className="meta">
                <span className="num">●</span> ALL SYSTEMS NOMINAL
              </div>
              <div className="meta">UPDATED 2 DAYS AGO</div>
            </div>
          </div>

          <div className="footer-grid">
            <div className="col brand-col">
              <Image
                src="/omg-logo-light.webp"
                alt="OMG / BRIDGE"
                width={160}
                height={32}
                className="footer-logo"
              />
              <p>
                The bridge between your Google data and any AI assistant. No SQL.
                No dashboards. Just answers.
              </p>
              <div className="footer-status">
                <span className="status-dot" /> ALL SYSTEMS NOMINAL
              </div>
            </div>
            <div className="col">
              <h6>PRODUCT</h6>
              {productLinks.map((l) => (
                <Link key={l.label} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="col">
              <h6>RESOURCES</h6>
              {resourceLinks.map((l) => (
                <Link key={l.label} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="col">
              <h6>COMPANY</h6>
              {companyLinks.map((l) =>
                l.external ? (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link key={l.label} href={l.href}>
                    {l.label}
                  </Link>
                ),
              )}
            </div>
          </div>

          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} OMG · BRIDGE · BENGALURU</div>
            <div>
              BUILT BY{" "}
              <a href="https://wodo.digital" target="_blank" rel="noreferrer">
                WODO DIGITAL
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        /* topbar */
        .topbar {
          position: sticky;
          top: 0;
          z-index: 50;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: stretch;
          background: rgba(10, 16, 24, 0.85);
          backdrop-filter: blur(14px) saturate(1.4);
          -webkit-backdrop-filter: blur(14px) saturate(1.4);
          border-bottom: 1px solid var(--teal);
          font-family: var(--body);
          font-size: 12px;
          letter-spacing: 0.04em;
        }
        .topbar .brand {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 24px;
          border-right: 1px solid var(--rule-strong);
        }
        .topbar .brand .logo-img { height: 28px; width: auto; display: block; }
        .topbar nav {
          display: flex;
          align-items: center;
          padding: 0 8px;
          border-right: 1px solid var(--rule-strong);
        }
        .topbar nav a {
          padding: 0 18px;
          align-self: stretch;
          display: flex;
          align-items: center;
          color: var(--ink-2);
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.10em;
          font-size: 11px;
          font-weight: 500;
          transition: color 0.18s ease;
        }
        .topbar nav a:hover { color: var(--teal-bright); }
        .topbar .actions { display: flex; align-items: stretch; }
        .topbar .actions a {
          padding: 16px 22px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: var(--ink);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          border-left: 1px solid var(--rule-strong);
          transition: background 0.18s ease, color 0.18s ease;
        }
        .topbar .actions a:hover { background: var(--surface-1); color: var(--teal-bright); }
        .topbar .actions a.primary { background: var(--teal); color: #fff; font-weight: 600; }
        .topbar .actions a.primary:hover { background: var(--vermilion); color: #fff; }

        /* footer */
        .site-footer {
          display: grid;
          grid-template-columns: 80px 1fr;
          background: var(--bg);
          border-top: 1px solid var(--rule);
          margin-top: 80px;
        }
        .site-footer .footer-body {
          padding: 80px 56px 32px;
          display: flex;
          flex-direction: column;
          gap: 64px;
        }
        .footer-cta {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 56px;
          align-items: end;
          padding-bottom: 56px;
          border-bottom: 1px solid var(--rule);
        }
        .footer-cta h5 {
          font-family: var(--display);
          font-weight: 700;
          font-size: clamp(36px, 4.6vw, 60px);
          line-height: 0.98;
          letter-spacing: -0.04em;
          text-transform: uppercase;
          max-width: 600px;
          margin-bottom: 18px;
        }
        .footer-cta h5 .accent { color: var(--vermilion); }
        .footer-cta p {
          color: var(--ink-2);
          font-size: 14px;
          max-width: 460px;
          margin-bottom: 22px;
        }
        .footer-cta .right { text-align: right; }
        .footer-cta .right .meta {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-3);
          margin-bottom: 14px;
        }
        .footer-cta .right .meta .num { color: var(--teal); }

        .footer-grid {
          display: grid;
          grid-template-columns: 1.4fr repeat(3, 1fr);
          gap: 48px;
          padding-bottom: 56px;
          border-bottom: 1px solid var(--rule);
        }
        .footer-grid .col h6 {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-3);
          margin-bottom: 18px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--rule);
        }
        .footer-grid .col a {
          display: block;
          color: var(--ink-2);
          text-decoration: none;
          font-size: 13px;
          padding: 6px 0;
          transition: color 0.18s;
        }
        .footer-grid .col a:hover { color: var(--teal); }

        .brand-col .footer-logo {
          height: 32px;
          width: auto;
          margin-bottom: 18px;
          display: block;
        }
        .brand-col p {
          font-size: 13px;
          color: var(--ink-2);
          line-height: 1.6;
          max-width: 280px;
          margin-bottom: 18px;
        }
        .footer-status {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--teal);
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: var(--ink-3);
        }
        .footer-bottom a { color: var(--ink-3); text-decoration: none; }
        .footer-bottom a:hover { color: var(--teal); }

        /* gutter shared */
        .site-footer .gutter {
          border-right: 1px solid var(--rule);
          padding: 40px 16px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          font-family: var(--body);
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-3);
        }
        .site-footer .gutter .num {
          font-family: var(--display);
          font-size: 38px;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: -0.04em;
          line-height: 1;
        }

        @media (max-width: 980px) {
          .topbar { grid-template-columns: 1fr auto; }
          .topbar nav { display: none; }
          .topbar .brand { padding: 12px 16px; gap: 10px; }
          .topbar .brand .logo-img { height: 24px; }
          .topbar .actions a { padding: 12px 14px; font-size: 10px; }

          .site-footer { grid-template-columns: 1fr; }
          .site-footer .gutter { display: none; }
          .site-footer .footer-body { padding: 48px 20px 32px; gap: 48px; }
          .footer-cta { grid-template-columns: 1fr; gap: 32px; align-items: start; }
          .footer-cta .right { text-align: left; }
          .footer-grid { grid-template-columns: 1fr 1fr; gap: 36px; }
          .footer-bottom { flex-direction: column; gap: 12px; }
        }
      `}</style>
    </div>
  );
}
