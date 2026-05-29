/**
 * Landing smoke — ports agentage/web's `packages/landing/e2e/smoke.spec.ts`
 * but runs against the DEPLOYED site instead of a local standalone server.
 *
 * Target resolves from LANDING_URL, else LANDING_ENV (dev|prod), else dev.
 * The nightly tests dev; a green dev run gates the dev→prod promotion, then the
 * same smoke verifies prod with LANDING_ENV=prod.
 */
import { test, expect } from '@playwright/test';
import { landingUrl } from '../../helpers/landing.js';

test.describe(`Landing @ ${landingUrl()} — SSR`, () => {
  test('home is server-rendered (hero in raw HTML, no JS)', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain('Every AI remembers');
    expect(html).toContain('npx @agentage/memory connect');
    expect(html).toContain('memory.agentage.io');
  });
});

test.describe('Landing — Home', () => {
  test('hero renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Connect once.');
    await expect(page.locator('h1')).toContainText('Every AI remembers');
    await expect(page.getByText('npx @agentage/memory connect')).toBeVisible();
    await expect(page.getByText('memory.agentage.io')).toBeVisible();
  });

  test('waitlist form is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input[type="email"][name="email"]').first()).toBeVisible();
    await expect(
      page.locator('button[type="submit"]', { hasText: 'Join the waitlist' }).first()
    ).toBeVisible();
  });
});

test.describe('Landing — Header', () => {
  test('logo links to home', async ({ page }) => {
    await page.goto('/');
    const logo = page.locator('header a').first();
    await expect(logo).toContainText('Age');
    await expect(logo).toHaveAttribute('href', '/');
  });

  test('desktop nav links are visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    const nav = page.locator('header nav').first();
    await expect(nav.locator('a', { hasText: 'Home' })).toBeVisible();
    await expect(nav.locator('a', { hasText: 'Docs' })).toBeVisible();
    await expect(nav.locator('a', { hasText: 'Dashboard' })).toBeVisible();
    await expect(nav.locator('a', { hasText: 'GitHub' })).toBeVisible();
  });

  test('GitHub link opens in a new tab', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    const gh = page.locator('header nav a', { hasText: 'GitHub' }).first();
    await expect(gh).toHaveAttribute('target', '_blank');
    await expect(gh).toHaveAttribute('rel', /noopener/);
  });

  test('mobile hamburger opens the menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const toggle = page.locator('button[aria-label="Toggle menu"]');
    await expect(toggle).toBeVisible();
    await toggle.click();
    // Scope to the header's second nav (mobile menu) so footer-nav changes can't
    // shift the index out from under this assertion.
    await expect(page.locator('header nav').nth(1).locator('a', { hasText: 'Docs' })).toBeVisible();
  });
});

test.describe('Landing — Footer', () => {
  test('footer shows the tagline copyright', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toContainText('Agentage');
    await expect(footer).toContainText('One memory. Every AI. Owned by you.');
  });

  test('footer Dashboard link uses a relative path', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer a', { hasText: 'Dashboard' })).toHaveAttribute(
      'href',
      '/dashboard'
    );
  });
});

test.describe('Landing — Routes', () => {
  test('/docs renders', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.locator('h1')).toContainText('Docs');
  });
  // NB: deployed /dashboard is the separate dashboard app (h1 "Overview"), not
  // landing's placeholder — it belongs to the dashboard tier, not this smoke.
});
