import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800/50 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-50">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/OMG Rectangle LOGO Dark BG.svg" alt="OMG AI" className="h-7" />
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/features" className="text-zinc-400 hover:text-white transition-colors">Features</Link>
            <Link href="/pricing" className="text-zinc-400 hover:text-white transition-colors">Pricing</Link>
            <Link href="/guides" className="text-zinc-400 hover:text-white transition-colors">Guides</Link>
            <Link href="/faq" className="text-zinc-400 hover:text-white transition-colors">FAQ</Link>
            <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-colors">
              Dashboard
            </Link>
          </div>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="border-t border-zinc-800/50 mt-24">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between gap-8">
          <div>
            <img src="/OMG Rectangle LOGO Dark BG.svg" alt="OMG AI" className="h-7 mb-3" />
            <p className="text-sm text-zinc-500 max-w-xs">
              Connect Google Search Console and GA4 to your AI assistants via MCP.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="text-zinc-300 font-semibold mb-3">Product</p>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-zinc-500 hover:text-zinc-300">Features</Link></li>
                <li><Link href="/pricing" className="text-zinc-500 hover:text-zinc-300">Pricing</Link></li>
                <li><Link href="/guides" className="text-zinc-500 hover:text-zinc-300">Setup Guides</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-zinc-300 font-semibold mb-3">Support</p>
              <ul className="space-y-2">
                <li><Link href="/faq" className="text-zinc-500 hover:text-zinc-300">FAQ</Link></li>
                <li><Link href="/dashboard/tickets" className="text-zinc-500 hover:text-zinc-300">Support Tickets</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-800 py-4">
          <p className="text-center text-xs text-zinc-600">2026 OMG AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
