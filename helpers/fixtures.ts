import { test as base } from '@playwright/test';
import { couchDbFromEnv, type CouchDbConfig, waitForCouchDb } from './couchdb.js';
import { createVault, type VaultFixture } from './vault.js';
import { launchObsidian, type ObsidianApp } from './obsidian.js';

interface ObsidianFixtures {
  couchdb: CouchDbConfig;
  vault: VaultFixture;
  obsidian: ObsidianApp;
}

export const test = base.extend<ObsidianFixtures>({
  couchdb: async ({}, use) => {
    const cfg = couchDbFromEnv();
    await waitForCouchDb(cfg);
    await use(cfg);
  },

  vault: async ({}, use) => {
    const v = await createVault({
      note: { name: 'README', body: '# Hello from e2e\n\nFixture note.\n' },
    });
    await use(v);
    await v.cleanup();
  },

  obsidian: async ({ vault }, use) => {
    const app = await launchObsidian(vault.path);
    await use(app);
    await app.close();
  },
});

export { expect } from '@playwright/test';
