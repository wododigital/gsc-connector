import type { Metadata } from "next";
import "./globals.css";
import { Preloader } from "@/components/preloader";

export const metadata: Metadata = {
  title: "OMG / Bridge - Talk to your data, in any AI",
  description:
    "Connect Google Analytics, Search Console and Business Profile to ChatGPT, Claude or Gemini in 90 seconds. Ask anything. Get the answer in plain English.",
};

// Inline script runs before paint to apply the persisted theme,
// avoiding a flash of dark-on-light (or vice-versa).
const themeInitScript = `(function(){try{var s=localStorage.getItem('omg-bridge-theme');var p=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches;var t=s||(p?'light':'dark');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&family=Inter+Tight:wght@300..700&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <Preloader />
        {children}
      </body>
    </html>
  );
}
