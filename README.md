# @agentage/e2e

End-to-end tests for the **agentage Memory** product — Obsidian plugin, MCP endpoint, landing, dashboard.

> Whole-product e2e only. Module-level integration tests live with the code they cover.

## Tiers

| Project     | Env var(s) to enable          | Covers                                                     |
| ----------- | ----------------------------- | ---------------------------------------------------------- |
| `obsidian`  | `OBSIDIAN_BIN`, `COUCHDB_URL` | Plugin loads, settings tab, push current note, replication |
| `mcp`       | `MCP_URL`                     | `memory__*` tools over Streamable HTTP + OAuth/PKCE        |
| `dashboard` | `DASHBOARD_URL`               | Memory dashboard surfaces                                  |
| `landing`   | `LANDING_URL`                 | Waitlist landing page                                      |

## Run

```bash
npm install
OBSIDIAN_BIN=/usr/bin/obsidian COUCHDB_URL=http://localhost:5984 npm run test:obsidian
```

## Verify

```bash
npm run verify   # type-check + lint + format:check
```

## Standards

Root [CLAUDE.md](../CLAUDE.md) for conventions. Memory product spec: `~/agentage-memory/onepager.md`.
