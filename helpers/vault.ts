import { mkdir, mkdtemp, writeFile, rm, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const PLUGIN_ID = 'agentage-memory';

const requireEnv = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
};

export interface VaultFixture {
  path: string;
  cleanup: () => Promise<void>;
}

export const createVault = async (
  opts: { note?: { name: string; body: string } } = {}
): Promise<VaultFixture> => {
  const pluginSource = requireEnv('OBSIDIAN_PLUGIN_DIR');
  const path = await mkdtemp(join(tmpdir(), 'agentage-vault-'));

  const obsidianDir = join(path, '.obsidian');
  const pluginDir = join(obsidianDir, 'plugins', PLUGIN_ID);
  await mkdir(pluginDir, { recursive: true });

  for (const f of ['main.js', 'manifest.json', 'styles.css']) {
    await cp(join(pluginSource, f), join(pluginDir, f));
  }

  await writeFile(
    join(obsidianDir, 'community-plugins.json'),
    JSON.stringify([PLUGIN_ID], null, 2)
  );
  await writeFile(
    join(obsidianDir, 'app.json'),
    JSON.stringify({ promptDelete: false, alwaysUpdateLinks: false }, null, 2)
  );

  if (opts.note) {
    await writeFile(join(path, `${opts.note.name}.md`), opts.note.body, 'utf8');
  }

  return {
    path,
    cleanup: () => rm(path, { recursive: true, force: true }),
  };
};
