import { defineConfig, devices } from '@playwright/test';
import { landingUrl } from './helpers/landing.js';
import { siteUrl } from './helpers/site.js';

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
    // Deployed targets are slower than localhost; bound nav/actions so a stall
    // fails fast and legibly instead of consuming the whole 180s test timeout.
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
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
      name: 'backend',
      testDir: './tests/backend',
      use: { baseURL: siteUrl() },
    },
    {
      name: 'dashboard',
      testDir: './tests/dashboard',
      use: { ...devices['Desktop Chrome'], baseURL: siteUrl() },
    },
    {
      name: 'landing',
      testDir: './tests/landing',
      use: { ...devices['Desktop Chrome'], baseURL: landingUrl() },
    },
  ],
});
