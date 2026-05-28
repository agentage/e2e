# CLAUDE.md

**@agentage/e2e** — Whole-product e2e for **agentage Memory**: Obsidian plugin, MCP endpoint, landing, dashboard. TRUE e2e only — no module-level integration.

**Repository:** `agentage/e2e`
**Default Branch:** `master`

## Commands

```bash
npm install
npm test                 # all projects
npm run test:obsidian    # plugin via CDP-attached Obsidian + temp vault
npm run test:mcp         # MCP endpoint
npm run test:dashboard   # dashboard
npm run test:landing     # landing
npm run verify           # type-check + lint + format:check
```

## Layout

```
tests/
├── obsidian/    # plugin-loads (smoke) + sync (push/pull/status round-trip vs CouchDB)
├── mcp/         # memory__* tools over Streamable HTTP + OAuth/PKCE
├── dashboard/   # Memory dashboard
└── landing/     # Waitlist landing

helpers/
├── gates.ts        # env-var gates (obsidian, couchdb, mcp, dashboard, landing)
├── constants.ts    # shared timeouts — no magic numbers
├── wait-for.ts     # poll helper
├── couchdb.ts      # CouchDB client (_up, _all_docs, put/wait-for-doc, ensure/drop DB)
├── obsidian.ts     # Obsidian launcher: spawn + chromium.connectOverCDP
├── plugin.ts       # renderer drivers (run command, open/read note, status icon)
└── vault.ts        # PLUGIN_ID + path helpers

scripts/e2e/
├── install-obsidian.sh   # apt deps + Obsidian .deb (Ubuntu 24.04)
├── start-display.sh      # Xvfb :99 + herbstluftwm (with panel autostart disabled)
└── setup-vault.sh        # temp vault + plugin symlink + host-side obsidian.json
```

## Conventions (mirror agentage/e2e-legacy)

- One file per feature; kebab-case `<feature>.test.ts`
- `import { test, expect } from '@playwright/test'` — no fixtures wrapper
- File-level top comment: what it covers + required env vars
- Gate via `test.skip(!gates.X, '...')` in `beforeAll` — not `testIf`
- Per-file lifecycle: `let app; test.beforeAll/afterAll`
- Shared helpers in `helpers/<concern>.ts` (flat); page objects in `helpers/pages/<feature>.page.ts` with an `index.ts` re-export
- TID registry in `helpers/selectors.ts`; timeouts in `helpers/constants.ts`

## Obsidian tier — why this shape

- **Snap-confined Obsidian fails.** Install the `.deb` (or extract an AppImage).
- **`_electron.launch` hangs.** It waits for the node inspector Obsidian never opens — we spawn directly and attach via `chromium.connectOverCDP`.
- **GPU process crashes under Xvfb.** `--disable-gpu --disable-software-rasterizer --use-gl=swiftshader` forces software rendering.
- **No window manager → no renderer.** `herbstluftwm` runs against `Xvfb :99` with its panel autostart disabled (default panel.sh crashes on Xvfb).
- **Plugin source:** `PLUGIN_ROOT` env points at a checkout of `agentage/obsidian-memory` with `npm run build` already done; `scripts/e2e/setup-vault.sh` copies the built artifacts into the throwaway vault and seeds `data.json` pointed at `COUCHDB_URL`.
- **Sync target:** the plugin is a CouchDB replication client (`${serverUrl}/${dbName}`, doc `_id` = vault path), so the full push/pull round-trip runs against a local CouchDB — a `couchdb:3.4` service container in CI, `docker compose up` locally. The real cloud backend only swaps `COUCHDB_URL` later.

## Standards

Root [CLAUDE.md](../../CLAUDE.md). Legacy CLI+Hub e2e: [`agentage/e2e-legacy`](https://github.com/agentage/e2e-legacy).
