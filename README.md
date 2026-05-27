# @agentage/e2e

End-to-end tests for the **agentage Memory** product — Obsidian plugin, MCP endpoint, landing, dashboard.

> Whole-product e2e only. Module-level integration tests live with the code they cover.

## Tiers

| Project     | Env var(s) to enable | Covers                                              |
| ----------- | -------------------- | --------------------------------------------------- |
| `obsidian`  | `OBSIDIAN_BIN`       | Plugin loads, settings tab, push current note       |
| `mcp`       | `MCP_URL`            | `memory__*` tools over Streamable HTTP + OAuth/PKCE |
| `dashboard` | `DASHBOARD_URL`      | Memory dashboard surfaces                           |
| `landing`   | `LANDING_URL`        | Waitlist landing page                               |

Tests gate via `test.skip(!gates.X, '...')` in `beforeAll`. Missing env vars skip the tier — `npm run verify` runs anywhere.

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
