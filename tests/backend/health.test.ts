/**
 * Backend smoke — the deployed API health endpoint.
 *
 * Target: SITE_URL / SITE_ENV (dev|prod) base, default dev. Nightly tests dev.
 */
import { test, expect } from '@playwright/test';

test('GET /api/health returns the ok envelope', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/json');

  const body = await res.json();
  expect(body.success).toBe(true);
  expect(body.data.status).toBe('ok');
  expect(body.data.service).toBe('@agentage/backend');
});
