/**
 * FULLY e2e for the Obsidian plugin's CouchDB sync — the product round-trip.
 *
 * Push:  edit a note → run "push current note" → doc lands in CouchDB.
 * Pull:  write a doc straight to CouchDB → continuous sync materializes it as
 *        a vault file.
 * Status: after a clean sync the status-bar icon reports `synced`.
 *
 * The plugin syncs to plain CouchDB (`${serverUrl}/${dbName}`), so this runs
 * fully against the local docker/service CouchDB today; the real cloud backend
 * only swaps COUCHDB_URL later.
 *
 * Requires: OBSIDIAN_BIN, OBSIDIAN_VAULT, COUCHDB_URL (+ COUCHDB_USER/PASS).
 * The vault's data.json must point the plugin at COUCHDB_URL — seeded by
 * `scripts/e2e/setup-vault.sh`.
 */
import { test, expect } from '@playwright/test';
import { gates } from '../../helpers/gates.js';
import { launchObsidian, type ObsidianApp } from '../../helpers/obsidian.js';
import { couchDbFromEnv, waitForCouchDb, putDoc, waitForDoc } from '../../helpers/couchdb.js';
import {
  waitForPluginEnabled,
  openNote,
  runCommand,
  readVaultFile,
  PUSH_COMMAND,
} from '../../helpers/plugin.js';
import { waitFor } from '../../helpers/wait-for.js';
import { TIMEOUTS } from '../../helpers/constants.js';
import { type Page } from '@playwright/test';

const DB = process.env['COUCHDB_DB'] ?? 'agentage-memory';

test.setTimeout(180_000);

let app: ObsidianApp;
let page: Page;
const couch = couchDbFromEnv();

test.beforeAll(async () => {
  test.skip(!gates.obsidian || !gates.couchdb, 'OBSIDIAN_BIN / COUCHDB_URL not set');
  await waitForCouchDb(couch);
  app = await launchObsidian();
  page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  await waitForPluginEnabled(page);
});

test.afterAll(async () => {
  await app?.close();
});

test('push: running the command lands the note in CouchDB', async () => {
  await openNote(page, 'Welcome.md');
  await runCommand(page, PUSH_COMMAND);
  await waitForDoc(couch, DB, 'Welcome.md');
});

test('pull: a doc written to CouchDB syncs down to a vault file', async () => {
  const id = 'from-couch.md';
  const body = `# From CouchDB\n\nsynced at ${Date.now()}\n`;
  await putDoc(couch, DB, { _id: id, content: body, mtime: Date.now() });

  await waitFor(async () => (await readVaultFile(page, id)) !== null, {
    timeout: TIMEOUTS.replication,
    label: `vault file '${id}'`,
  });

  expect(await readVaultFile(page, id)).toBe(body);
});

test('status: settles to synced after a clean round-trip', async () => {
  const icon = page.locator('.agentage-memory-status-icon').first();
  await expect(icon).toHaveAttribute('data-status', /synced|active/, { timeout: 30_000 });
});
