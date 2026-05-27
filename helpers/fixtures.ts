import { test as base } from '@playwright/test';
import { couchDbFromEnv, type CouchDbConfig, waitForCouchDb } from './couchdb.js';
import { launchObsidian, type ObsidianApp } from './obsidian.js';

interface ObsidianFixtures {
  couchdb: CouchDbConfig;
  obsidian: ObsidianApp;
}

export const test = base.extend<ObsidianFixtures>({
  couchdb: async ({}, use) => {
    const cfg = couchDbFromEnv();
    await waitForCouchDb(cfg);
    await use(cfg);
  },

  obsidian: async ({}, use) => {
    const app = await launchObsidian();
    await use(app);
    await app.close();
  },
});

export { expect } from '@playwright/test';
