import { existsSync } from 'node:fs';
import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import { TIMEOUTS } from './constants.js';
import { PLUGIN_ID } from './vault.js';
import { waitFor } from './wait-for.js';

const CANDIDATE_BIN_PATHS = [
  '/opt/Obsidian/obsidian',
  '/opt/obsidian/obsidian',
  '/usr/bin/obsidian',
  '/Applications/Obsidian.app/Contents/MacOS/Obsidian',
  'C:\\Program Files\\Obsidian\\Obsidian.exe',
];

export const findObsidianBinary = (): string => {
  const fromEnv = process.env['OBSIDIAN_BIN'];
  if (fromEnv) {
    if (!existsSync(fromEnv)) {
      throw new Error(`OBSIDIAN_BIN does not exist: ${fromEnv}`);
    }
    return fromEnv;
  }
  for (const p of CANDIDATE_BIN_PATHS) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    `Could not locate Obsidian. Set OBSIDIAN_BIN. Snap-confined Obsidian is not usable — extract an AppImage. Searched:\n  ${CANDIDATE_BIN_PATHS.join('\n  ')}`
  );
};

export interface ObsidianApp {
  app: ElectronApplication;
  window: Page;
  close: () => Promise<void>;
}

export const launchObsidian = async (vaultPath: string): Promise<ObsidianApp> => {
  const app = await electron.launch({
    executablePath: findObsidianBinary(),
    args: [
      vaultPath,
      '--no-sandbox',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-dev-shm-usage',
    ],
    timeout: TIMEOUTS.obsidianBoot,
  });

  const proc = app.process();
  proc.stdout?.on('data', (d: Buffer) => process.stdout.write(`[obsidian] ${d}`));
  proc.stderr?.on('data', (d: Buffer) => process.stderr.write(`[obsidian!] ${d}`));

  const window = await app.firstWindow({ timeout: TIMEOUTS.obsidianBoot });
  await window.waitForLoadState('domcontentloaded');

  await waitFor(
    async () =>
      window.evaluate((id) => {
        const plugins = (globalThis as { app?: { plugins?: { enabledPlugins?: Set<string> } } }).app
          ?.plugins?.enabledPlugins;
        return plugins instanceof Set && plugins.has(id);
      }, PLUGIN_ID),
    { timeout: TIMEOUTS.obsidianBoot, label: `plugin '${PLUGIN_ID}' enabled` }
  );

  return { app, window, close: () => app.close() };
};
