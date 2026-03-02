export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-50"
        style={{
          background: "rgba(10, 15, 24, 0.85)",
          backdropFilter: "blur(20px) saturate(1.5)",
          WebkitBackdropFilter: "blur(20px) saturate(1.5)",
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center">
              <img
                src="/OMG Rectangle LOGO Dark BG.svg"
                alt="OMG AI"
                className="h-8 w-auto"
              />
            </a>
            <nav className="hidden md:flex items-center gap-6">
              {[
                { href: "#how-it-works", label: "How it works" },
                { href: "/features", label: "Features" },
                { href: "/pricing", label: "Pricing" },
                { href: "/guides", label: "Guides" },
                { href: "/faq", label: "FAQ" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <a
                href="/auth/login"
                className="text-sm transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                Sign in
              </a>
              <a href="/api/auth/google" className="btn-primary btn-primary-sm">
                Get started free
              </a>
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
