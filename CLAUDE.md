# CLAUDE.md

**@agentage/e2e** — Whole-product e2e for **agentage Memory**: Obsidian plugin, MCP endpoint, landing, dashboard. TRUE e2e only — no module-level integration.

**Repository:** `agentage/e2e`
**Default Branch:** `master`

## Commands

```bash
npm install
npm test                 # all projects
npm run test:obsidian    # plugin via Playwright + Electron + local CouchDB
npm run test:mcp         # MCP endpoint
npm run test:dashboard   # dashboard
npm run test:landing     # landing
npm run verify           # type-check + lint + format:check
```

## Layout

```
tests/
├── obsidian/    # Plugin: Playwright drives Electron Obsidian against a throwaway vault
├── mcp/         # memory__* tools over Streamable HTTP + OAuth/PKCE
├── dashboard/   # Memory dashboard
└── landing/     # Waitlist landing

helpers/
├── gates.ts        # env-var test gates (obsidian, couchdb, mcp, dashboard, landing)
├── constants.ts    # shared timeouts — no magic numbers in tests
└── wait-for.ts     # poll helper
```

Each tier gates on env vars (see `.env.example`). Missing vars skip the tier — keeps `verify` runnable anywhere.

## Standards

Root [CLAUDE.md](../../CLAUDE.md). Legacy CLI+Hub e2e: [`agentage/e2e-legacy`](https://github.com/agentage/e2e-legacy).
