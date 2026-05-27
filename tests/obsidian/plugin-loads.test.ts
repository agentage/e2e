/**
 * E2E smoke for the Obsidian plugin.
 *
 * Tests the plugin loads inside a real Obsidian instance and the status bar
 * paints — proves the harness (Xvfb + WM, vault layout, plugin symlink, CDP
 * attach) all works end-to-end.
 *
 * Requires: OBSIDIAN_BIN, OBSIDIAN_VAULT (vault must have the plugin pre-installed
 * via `scripts/e2e/setup-vault.sh`).
 */
import { test, expect } from '@playwright/test';
import { gates } from '../../helpers/gates.js';
import { launchObsidian, type ObsidianApp } from '../../helpers/obsidian.js';
import { PLUGIN_ID } from '../../helpers/vault.js';

test.setTimeout(180_000);

let app: ObsidianApp;

test.beforeAll(async () => {
  test.skip(!gates.obsidian, 'OBSIDIAN_BIN not set — skipping obsidian e2e');
  app = await launchObsidian();
});

test.afterAll(async () => {
  await app?.close();
});

test('plugin loads and status bar reports memory state', async () => {
  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');

  const title = (await page.title()).toLowerCase();
  expect(title).toContain('obsidian');

  await page.waitForFunction(
    (id: string) => {
      const a = globalThis as { app?: { plugins?: { enabledPlugins?: Set<string> } } };
      return a.app?.plugins?.enabledPlugins instanceof Set && a.app.plugins.enabledPlugins.has(id);
    },
    PLUGIN_ID,
    { timeout: 60_000 }
  );

  await expect(page.locator('.status-bar')).toContainText(/memory:/i);
});
