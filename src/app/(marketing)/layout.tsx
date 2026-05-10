import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { href: "/features", label: "FEATURES" },
  { href: "/pricing", label: "PRICING" },
  { href: "/guides", label: "GUIDES" },
  { href: "/faq", label: "FAQ" },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="atmosphere min-h-screen">
      <header className="topbar">
        <div className="brand">
          <Image
            src="/omg-logo-dark.webp"
            alt="OMG / BRIDGE"
            width={140}
            height={28}
            className="logo-img"
            priority
          />
        </div>
        <nav>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="actions">
          <Link href="/auth/login">LOG IN</Link>
          <Link href="/onboarding" className="primary">
            START FREE →
          </Link>
        </div>
      </header>

      <main>{children}</main>

      <style>{`
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
        .topbar .brand .logo-img {
          height: 28px;
          width: auto;
          display: block;
        }
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
        .topbar .actions a:hover {
          background: var(--surface-1);
          color: var(--teal-bright);
        }
        .topbar .actions a.primary {
          background: var(--teal);
          color: #fff;
          font-weight: 600;
        }
        .topbar .actions a.primary:hover {
          background: var(--vermilion);
          color: #fff;
        }
        @media (max-width: 980px) {
          .topbar { grid-template-columns: 1fr auto; }
          .topbar nav { display: none; }
          .topbar .brand { padding: 12px 16px; gap: 10px; }
          .topbar .brand .logo-img { height: 24px; }
          .topbar .actions a { padding: 12px 14px; font-size: 10px; }
        }
      `}</style>
    </div>
  );
}
