/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    // Allow TypeScript files to be imported using .js extensions (ESM style).
    // Shared lib files (error-logger, usage-logger) use ./db.js which webpack
    // needs to resolve to ./db.ts.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // RFC 8414 - Claude.ai fetches /.well-known/oauth-authorization-server at the root.
      // Next.js serves our route at /api/.well-known/... so we rewrite it here.
      {
        source: "/.well-known/oauth-authorization-server",
        destination: "/api/.well-known/oauth-authorization-server",
      },
      // Path-aware discovery: when the user pastes the MCP endpoint URL
      // (e.g. https://host/api/mcp), Claude.ai also tries:
      // https://host/api/mcp/.well-known/oauth-authorization-server
      {
        source: "/api/mcp/.well-known/oauth-authorization-server",
        destination: "/api/.well-known/oauth-authorization-server",
      },
    ];
  },
};

export default nextConfig;
