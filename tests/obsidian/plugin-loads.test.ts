/**
 * E2E smoke for the Obsidian plugin.
 *
 * Tests the plugin loads inside a real Obsidian instance and its status-bar
 * icon paints — proves the harness (Xvfb + WM, vault layout, plugin symlink,
 * CDP attach) all works end-to-end.
 *
 * Requires: OBSIDIAN_BIN, OBSIDIAN_VAULT (vault must have the plugin pre-installed
 * via `scripts/e2e/setup-vault.sh`).
 */
import { test, expect } from '@playwright/test';
import { gates } from '../../helpers/gates.js';
import { launchObsidian, type ObsidianApp } from '../../helpers/obsidian.js';
import { waitForPluginEnabled } from '../../helpers/plugin.js';

test.setTimeout(180_000);

let app: ObsidianApp;

test.beforeAll(async () => {
  test.skip(!gates.obsidian, 'OBSIDIAN_BIN not set — skipping obsidian e2e');
  app = await launchObsidian();
});

test.afterAll(async () => {
  await app?.close();
});

test('plugin loads and renders its status-bar icon', async () => {
  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');

  expect((await page.title()).toLowerCase()).toContain('obsidian');

  await waitForPluginEnabled(page);

  const icon = page.locator('.agentage-memory-status-icon').first();
  await expect(icon).toHaveAttribute('data-status', /idle|active|synced|error/);
});
