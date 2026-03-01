import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OMG AI - Google Search Console and Analytics for AI",
  description:
    "Connect Google Search Console and Google Analytics to Claude, ChatGPT, and Cursor via MCP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
