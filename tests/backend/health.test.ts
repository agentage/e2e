/**
 * Backend smoke — the deployed API health endpoint.
 *
 * Target: SITE_URL / SITE_ENV (dev|prod) base, default dev. Nightly tests dev.
 */
import { test, expect } from '@playwright/test';

interface HealthBody {
  success?: boolean;
  data?: { status?: string; service?: string };
}

test('GET /api/health returns the ok envelope', async ({ request }) => {
  // A freshly-deployed/idle API can cold-start; poll briefly so the gate keys
  // on the steady state rather than one-shot failing on the first slow hit.
  let body: HealthBody = {};
  await expect
    .poll(
      async () => {
        const res = await request.get('/api/health');
        if (res.status() !== 200) return res.status();
        if (!res.headers()['content-type']?.includes('application/json')) return 'not-json';
        body = (await res.json()) as HealthBody;
        return 200;
      },
      { timeout: 30_000, intervals: [500, 1000, 2000, 5000] }
    )
    .toBe(200);

  expect(body.success).toBe(true);
  expect(body.data?.status).toBe('ok');
  expect(body.data?.service).toBe('@agentage/backend');
});
