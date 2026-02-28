# GSC Connect - MCP Server Scaffold

This is the technical scaffold for the GSC Connect MCP server. It contains:

## Structure

```
src/
  server.ts              # MCP server with all 13 tool definitions
  oauth-provider.ts      # OAuth2 authorization server for Claude/ChatGPT
  lib/
    google-api.ts        # Google Search Console API helper functions
    encryption.ts        # AES-256-GCM encryption for token storage
prisma/
  schema.prisma          # Complete database schema
package.json             # Dependencies
```

## What's Implemented

- All 13 MCP tool definitions with Zod parameter schemas
- Complete Google Search Console API helper functions
- OAuth2 Provider endpoints (metadata, DCR, authorize, token, revoke)
- AES-256-GCM encryption utilities for secure token storage
- Full Prisma database schema (7 tables)

## What Needs Implementation

Each tool has a `TODO` marker where the actual logic needs to be wired up:
1. Extract user identity from the OAuth bearer token
2. Look up the user's GSC credentials from the database
3. Refresh the Google access token if expired
4. Call the appropriate Google API
5. Format and return the response

## Getting Started

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

## Key Dependencies

- `@modelcontextprotocol/sdk` - Official MCP SDK for protocol compliance
- `googleapis` - Google API client (alternative to raw fetch calls)
- `jose` - JWT handling for OAuth tokens
- `zod` - Schema validation for tool parameters
- `prisma` - Database ORM

## Environment Variables Required

See the PRD document Section 13 for the complete list.
