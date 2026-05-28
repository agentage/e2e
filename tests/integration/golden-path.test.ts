/**
 * Golden-path integration e2e — confirms ALL parts share one memory.
 *
 * One chained flow; each step asserts on a DIFFERENT surface. Passing = the
 * whole product is wired together through the per-tenant CouchDB + FTS hub.
 *
 *   1. CLI       — write a memory
 *   2. MCP       — memory__search returns it (store + index seam)
 *   3. Plugin    — file materializes in the Obsidian vault on disk
 *   4. Dashboard — shows in list/search
 *   5. edit in Obsidian → propagates back to MCP + dashboard + CLI read
 *   6. delete in dashboard → tombstone removes it from vault + MCP + CLI
 *
 * STATUS: skipped until the surfaces land. Known blockers (2026-05-29):
 *   - CLI: `agentage vault` is LOCAL-FTS5-ONLY — no CouchDB bridge, so a CLI
 *     write is not yet visible to MCP/plugin (product gap, not a test gap).
 *   - MCP: needs a `helpers/mcp.ts` client + a live mcp.agentage.io.
 *   - Dashboard: write actions not deployed.
 * Full design + caveats: ~/projects/projects/work/tasks/memory-integration-e2e.md
 *
 * Requires (all): OBSIDIAN_BIN, COUCHDB_URL, MCP_URL, DASHBOARD_URL.
 */
import { test } from '@playwright/test';
import { gates } from '../../helpers/gates.js';

const ready = gates.obsidian && gates.couchdb && gates.mcp && gates.dashboard;

test.describe('golden path — write anywhere, read everywhere', () => {
  test.skip(
    !ready,
    'integration surfaces not all available (MCP/dashboard not deployed; CLI vault→CouchDB bridge missing)'
  );

  test('CLI write → MCP/plugin/dashboard read → edit → delete converges everywhere', async () => {
    // Wire each numbered step as its surface lands; until then this is a
    // placeholder so the gate + project exist and CI stays green.
    test.fixme(true, 'surface APIs unconfirmed — see task memory-integration-e2e');
  });
});
