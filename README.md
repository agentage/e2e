# @agentage/e2e

End-to-end tests for the **agentage Memory** product — Obsidian plugin, MCP endpoint, landing, dashboard.

> Whole-product e2e only. Module-level integration tests live with the code they cover.

## Tiers

**Always-on — deployed-site smoke.** No secret needed; targets a live URL, so the nightly is never vacuous. Pick the target with `SITE_ENV` / `LANDING_ENV` (`dev` | `prod`, default `dev`) or an explicit `SITE_URL` / `LANDING_URL`.

| Project     | Target               | Covers                                        |
| ----------- | -------------------- | --------------------------------------------- |
| `landing`   | `landingUrl()`       | SSR hero, waitlist form, header/footer, /docs |
| `backend`   | `siteUrl()` + `/api` | `/api/health` envelope                        |
| `dashboard` | `siteUrl()`          | `/dashboard` + login form (unauthenticated)   |

**Gated — needs a backing service.** Skips via `test.skip(!gates.X, '...')` when the env var is absent, so `npm run verify` and the nightly still run everywhere.

| Project       | Gate (env var)                     | Covers                                              |
| ------------- | ---------------------------------- | --------------------------------------------------- |
| `obsidian`    | `OBSIDIAN_BIN` (+ `COUCHDB_URL`)   | Plugin loads + push/pull/status round-trip          |
| `mcp`         | `MCP_URL`                          | `memory__*` tools over Streamable HTTP + OAuth/PKCE |
| `integration` | all of the above + `DASHBOARD_URL` | Golden-path: write anywhere → read everywhere       |

## Run the obsidian tier locally

Needs the Obsidian `.deb` (or an extracted AppImage; **snap won't work**), a checkout of `agentage/obsidian-memory` with the plugin built, and an X display.

```bash
npm install

# 1. Bring up Obsidian + window manager + Xvfb
./scripts/e2e/install-obsidian.sh
./scripts/e2e/start-display.sh

# 2. Build the plugin elsewhere, then point setup-vault at it
( cd ../obsidian-memory && npm ci && npm run build )
PLUGIN_ROOT=$(pwd)/../obsidian-memory ./scripts/e2e/setup-vault.sh

# 3. Run
OBSIDIAN_BIN=/opt/Obsidian/obsidian \
OBSIDIAN_VAULT=/tmp/obsidian-test-vault \
DISPLAY=:99 \
  npm run test:obsidian
```

## Verify

```bash
npm run verify   # type-check + lint + format:check
```

## Standards

Root [CLAUDE.md](../CLAUDE.md). Memory product spec: `~/agentage-memory/onepager.md`.
