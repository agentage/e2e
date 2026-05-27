export const PLUGIN_ID = 'agentage-memory';

const requireEnv = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
};

export const vaultPath = (): string => process.env['OBSIDIAN_VAULT'] ?? '/tmp/obsidian-test-vault';

export const pluginDir = (): string => requireEnv('OBSIDIAN_PLUGIN_DIR');
