export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
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
              <a
                href="#how-it-works"
                className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                How it works
              </a>
              <a
                href="#features"
                className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Pricing
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <a
                href="/auth/login"
                className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Sign in
              </a>
              <a
                href="/api/auth/google"
                className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors"
              >
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
