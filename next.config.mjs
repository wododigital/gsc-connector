/** @type {import('next').NextConfig} */
const nextConfig = {
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
