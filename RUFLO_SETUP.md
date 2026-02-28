# Ruflo Setup Guide for GSC Connect

## Prerequisites

1. **Claude Code** installed globally:
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **Ruflo** installed:
   ```bash
   npm install -g ruflo@latest
   # Or use npx (no install needed):
   npx ruflo@latest --version
   ```

3. Node.js 20+ (check: `node --version`)

---

## Step 1: Initialize Ruflo in the Project

From inside the `gsc-connect/` directory:

```bash
npx ruflo@latest init --wizard
```

This will:
- Generate `.claude/settings.json` with hook configuration
- Create `.claude/helpers/statusline.cjs` for live status bar
- Set up `.claude/agents/` directory with 60+ agent templates
- Create `.claude/commands/` with slash commands
- Update `CLAUDE.md` (merge carefully — don't lose our custom content)

After init, restore our CLAUDE.md if it gets overwritten:
```bash
git checkout CLAUDE.md  # if using git
```

---

## Step 2: Verify Setup

```bash
npx ruflo doctor --fix
```

Expected output:
```
✓ node: v20.x.x
✓ npm: x.x.x
✓ git: x.x.x
✓ config: ruflo.config.json found
✓ daemon: Running
✓ memory: AgentDB initialized
```

---

## Step 3: Start Claude Code with MCP

Add Ruflo as an MCP server to Claude Code:
```bash
claude mcp add ruflo npx ruflo@latest mcp start
```

Then open the project in Claude Code:
```bash
claude code .
```

---

## Step 4: Initialize the Development Swarm

Inside Claude Code, run this command to start the GSC Connect swarm:

```
/swarm init --topology hierarchical --max-agents 6 --strategy specialized
```

Then spawn all agents in ONE message (Ruflo rule — always parallel):

```
spawn architect: Read CLAUDE.md, PRD, and scaffold files. Map all module 
interfaces, define TypeScript types for the 8 DB tables, document the 
two OAuth flows with sequence diagrams, store in AgentDB.

spawn coder-mcp: Implement all 13 MCP tools in src/mcp/tools/. 
Wire up google-api.ts helper functions. Add auth middleware that 
validates OAuth bearer tokens against oauth_tokens table. 
Reference AgentDB for architect's type definitions.

spawn coder-oauth: Complete all TODO items in oauth-provider.ts. 
Implement DB calls for DCR registration, auth code generation, 
PKCE verification, token issuance, token rotation. 
Reference AgentDB for architect's type definitions.

spawn coder-frontend: Build the Next.js dashboard (property selector, 
API key management, usage stats, setup instructions tabs). 
Build the landing page. Build the OAuth consent page.

spawn tester: After coder-mcp completes each tool, test with 
MCP Inspector. Validate OAuth flow end-to-end manually. 
Document failures in AgentDB.

spawn reviewer: Security review of all token handling, encryption, 
SQL query patterns. Verify no secrets in logs. 
Review PKCE implementation.
```

---

## Step 5: Monitor Swarm Activity

```bash
# Real-time status
npx ruflo swarm status

# View agent memory
npx ruflo memory list --namespace gsc-connect

# Check what's been stored
npx ruflo memory search "oauth"
npx ruflo memory search "mcp tools"

# View verification scores
npx ruflo truth --report
```

---

## Phase 1 Commands (First Session Focus)

Phase 1 is foundation — run these first before spawning the full swarm:

```bash
# 1. Generate Prisma client from schema
npx prisma generate

# 2. Create initial migration
npx prisma migrate dev --name init

# 3. Install all dependencies
npm install

# 4. Verify TypeScript compilation
npx tsc --noEmit
```

---

## How Ruflo Accelerates GSC Connect Specifically

### Parallel Development Tracks

The project has 4 largely independent modules:

```
MCP Tools ──────────────────────────────────► coder-mcp
OAuth2 Provider ─────────────────────────────► coder-oauth  
Next.js Frontend ────────────────────────────► coder-frontend
Infra (Nginx, PM2, deployment) ──────────────► coder-infra
```

Without Ruflo: sequential development, one track at a time.
With Ruflo: all 4 run in parallel, sharing architect's type definitions.

### Memory-Driven Consistency

The architect agent stores all type definitions once:
```typescript
// Stored in AgentDB by architect, retrieved by all coder agents
interface UserContext {
  userId: string;
  propertyId: string;
  siteUrl: string;
  googleRefreshToken: string; // encrypted
}
```

All subsequent agents retrieve this — no inconsistency between MCP tool implementations and OAuth token structures.

### Verification Hooks

Ruflo's verification hooks run automatically after every file save:
- No hardcoded secrets
- TypeScript compiles cleanly
- No console.log with token data
- Tests pass at 0.95 threshold

---

## Common Swarm Commands for This Project

```bash
# Ask the swarm a question
/swarm query "What's the correct PKCE verification flow for the token endpoint?"

# Store a decision in shared memory
/swarm memory store "scope_decision" "Using gsc:read and gsc:write. write scope only for add_site, delete_site, submit_sitemap, delete_sitemap"

# Check swarm progress
/swarm status --verbose

# If an agent gets stuck on a specific file
npx ruflo agent spawn coder --task "Complete the authorization code generation in oauth-provider.ts POST /oauth/authorize route"
```

---

## MCP Inspector Testing (Phase 2)

After the coder-mcp agent completes tools, test each one:

```bash
# Start your MCP server locally
node dist/mcp/server.js

# Run MCP Inspector against it
npx @modelcontextprotocol/inspector http://localhost:3001/mcp

# Test each tool in the inspector UI
# Start with get_top_keywords (simplest)
# End with get_search_analytics (most complex)
```

---

## Known Complexity Points (Share with Agents)

1. **SSE through Nginx** — needs `proxy_buffering off` and `proxy_set_header Connection ''`
2. **DCR for Claude** — must return `client_id` AND `client_secret` in registration response
3. **PKCE verification** — `base64url` encode the SHA-256 hash of code_verifier, compare to stored code_challenge
4. **Google token 401 handling** — detect when refresh token is revoked, notify user to re-authenticate
5. **Multi-property MCP context** — when user has multiple properties, the active property is determined by which OAuth token was used in the connection (property_id on oauth_tokens table)
