import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 180_000,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'integration',
      testDir: './tests/integration',
    },
    {
      name: 'obsidian',
      testDir: './tests/obsidian',
    },
    {
      name: 'mcp',
      testDir: './tests/mcp',
    },
    {
      name: 'dashboard',
      testDir: './tests/dashboard',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'landing',
      testDir: './tests/landing',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
