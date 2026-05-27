import { test, type TestInfo } from '@playwright/test';

export const gates = {
  obsidian: !!process.env['OBSIDIAN_BIN'],
  couchdb: !!process.env['COUCHDB_URL'],
  mcp: !!process.env['MCP_URL'],
  dashboard: !!process.env['DASHBOARD_URL'],
  landing: !!process.env['LANDING_URL'],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlaywrightTestFn = (args: any, testInfo: TestInfo) => void | Promise<void>;

export const testIf = (condition: boolean, title: string, fn: PlaywrightTestFn) => {
  if (condition) {
    test(title, fn);
  } else {
    test.skip(title, () => {});
  }
};

export const describeIf = (condition: boolean, title: string, fn: () => void) => {
  if (condition) {
    test.describe(title, fn);
  } else {
    test.describe(title, () => {
      test.skip();
    });
  }
};
