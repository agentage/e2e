/**
 * Dashboard smoke — the deployed dashboard at /dashboard (auth-gated).
 *
 * Unauthenticated smoke: confirm the app + login surface render. Authenticated
 * flows (Overview, panels) come later once test creds exist.
 *
 * Target: SITE_URL / SITE_ENV (dev|prod) base, default dev. Nightly tests dev.
 */
import { test, expect } from '@playwright/test';

test('dashboard root responds', async ({ page }) => {
  const res = await page.goto('/dashboard');
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle(/Agentage Memory/);
});

test('login page renders the sign-in form', async ({ page }) => {
  await page.goto('/dashboard/login');
  await expect(page.getByText(/sign in/i).first()).toBeVisible();
  await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
});
