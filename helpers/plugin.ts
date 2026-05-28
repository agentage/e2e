import { type Page } from '@playwright/test';
import { TIMEOUTS } from './constants.js';
import { PLUGIN_ID } from './vault.js';

export const PUSH_COMMAND = `${PLUGIN_ID}:push-current-note`;

interface ObsidianGlobal {
  app?: {
    plugins?: { enabledPlugins?: Set<string> };
    commands?: { executeCommandById(id: string): unknown };
    workspace?: { getLeaf(): { openFile(file: unknown): Promise<void> } };
    vault?: {
      getAbstractFileByPath(path: string): unknown;
      adapter: { read(path: string): Promise<string>; exists(path: string): Promise<boolean> };
    };
  };
}

export const waitForPluginEnabled = (page: Page, timeout = TIMEOUTS.obsidianBoot): Promise<void> =>
  page
    .waitForFunction(
      (id: string) => {
        const plugins = (globalThis as ObsidianGlobal).app?.plugins?.enabledPlugins;
        return plugins instanceof Set && plugins.has(id);
      },
      PLUGIN_ID,
      { timeout }
    )
    .then(() => undefined);

export const openNote = (page: Page, path: string): Promise<void> =>
  page.evaluate(async (p: string) => {
    const a = (globalThis as ObsidianGlobal).app;
    const file = a?.vault?.getAbstractFileByPath(p);
    if (!file) throw new Error(`note not found: ${p}`);
    await a!.workspace!.getLeaf().openFile(file);
  }, path);

export const runCommand = (page: Page, commandId: string): Promise<void> =>
  page.evaluate((id: string) => {
    (globalThis as ObsidianGlobal).app?.commands?.executeCommandById(id);
  }, commandId);

export const readVaultFile = (page: Page, path: string): Promise<string | null> =>
  page.evaluate(async (p: string) => {
    const adapter = (globalThis as ObsidianGlobal).app?.vault?.adapter;
    if (!adapter || !(await adapter.exists(p))) return null;
    return adapter.read(p);
  }, path);

/** `data-status` on the plugin's status-bar icon: idle | active | synced | error. */
export const statusState = (page: Page): Promise<string | null> =>
  page.locator('.agentage-memory-status-icon').first().getAttribute('data-status');
