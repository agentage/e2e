import { expect } from '../../helpers/fixtures.js';
import { gates, testIf } from '../../helpers/gates.js';
import { PLUGIN_ID } from '../../helpers/vault.js';

testIf(gates.obsidian, 'plugin loads + status bar reports idle', async ({ obsidian }) => {
  const enabled = await obsidian.window.evaluate((id: string) => {
    const a = globalThis as { app?: { plugins?: { enabledPlugins?: Set<string> } } };
    return a.app?.plugins?.enabledPlugins?.has(id) ?? false;
  }, PLUGIN_ID);
  expect(enabled).toBe(true);

  await expect(obsidian.window.locator('.status-bar')).toContainText(/memory:/i);
});
