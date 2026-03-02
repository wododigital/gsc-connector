import type { Metadata } from "next";
import "./globals.css";
import "./globals-glass.css";

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
      <body className="min-h-screen antialiased">
        <div className="app-background" />
        {children}
      </body>
    </html>
  );
}
