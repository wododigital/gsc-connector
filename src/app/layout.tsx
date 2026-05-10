import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OMG / Bridge - Talk to your data, in any AI",
  description:
    "Connect Google Analytics, Search Console and Business Profile to ChatGPT, Claude or Gemini in 90 seconds. Ask anything. Get the answer in plain English.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&family=Inter+Tight:wght@300..700&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
