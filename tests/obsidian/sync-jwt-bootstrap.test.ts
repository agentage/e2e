/**
 * Sync bootstrap — the per-tenant CouchDB JWT credential the backend's
 * POST /api/sync/bootstrap mints. The Basic-creds round-trip is covered by
 * sync.test.ts; this exercises the NEW authed path's substrate directly against
 * a JWT-configured CouchDB: a short-lived bearer authenticates as its `sub`,
 * is scoped to its own tenant db, and is rejected once expired.
 *
 * Requires: COUCHDB_URL (+ COUCHDB_USER/PASS) pointing at a CouchDB whose
 * jwt_authentication_handler is engaged (locally: `docker compose up` mounts
 * scripts/e2e/sync-jwt.ini). SYNC_JWT_SECRET must equal the raw secret whose
 * base64 is CouchDB's hmac:_default (default: the e2e fixture value). Skips
 * cleanly when CouchDB is absent or JWT auth isn't engaged.
 */
import { test, expect } from '@playwright/test';
import { gates } from '../../helpers/gates.js';
import {
  couchDbFromEnv,
  waitForCouchDb,
  ensureDatabase,
  dropDatabase,
} from '../../helpers/couchdb.js';
import { mintCouchJwt } from '../../helpers/couch-jwt.js';

const SECRET = process.env['SYNC_JWT_SECRET'] ?? 'e2e-sync-jwt-secret';
const couch = couchDbFromEnv();
const ADMIN = 'Basic ' + Buffer.from(`${couch.username}:${couch.password}`).toString('base64');

const bearer = (sub: string, ttlSeconds = 3600): string =>
  `Bearer ${mintCouchJwt({ sub, secret: SECRET, ttlSeconds })}`;

const jwtEngaged = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${couch.url}/_session`);
    const body = (await res.json()) as { info?: { authentication_handlers?: string[] } };
    return body.info?.authentication_handlers?.includes('jwt') ?? false;
  } catch {
    return false;
  }
};

const putSecurity = async (db: string, member: string): Promise<void> => {
  const res = await fetch(`${couch.url}/${db}/_security`, {
    method: 'PUT',
    headers: { Authorization: ADMIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      admins: { names: [], roles: ['_admin'] },
      members: { names: [member], roles: [] },
    }),
  });
  if (!res.ok) throw new Error(`PUT /${db}/_security -> ${res.status}: ${await res.text()}`);
};

test.describe('sync bootstrap — per-tenant CouchDB JWT', () => {
  test.beforeAll(async () => {
    test.skip(!gates.couchdb, 'COUCHDB_URL not set');
    await waitForCouchDb(couch);
    test.skip(
      !(await jwtEngaged()),
      'CouchDB jwt_authentication_handler not engaged (mount scripts/e2e/sync-jwt.ini)'
    );
    // Provision two tenants exactly as the bootstrap would: db + _security grant.
    for (const [db, user] of [
      ['mem_alice', 'alice'],
      ['mem_bob', 'bob'],
    ]) {
      await dropDatabase(couch, db);
      await ensureDatabase(couch, db);
      await putSecurity(db, user);
    }
  });

  test.afterAll(async () => {
    await dropDatabase(couch, 'mem_alice');
    await dropDatabase(couch, 'mem_bob');
  });

  test('a minted JWT authenticates as its sub', async () => {
    const res = await fetch(`${couch.url}/_session`, {
      headers: { Authorization: bearer('alice') },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { userCtx?: { name?: string } };
    expect(body.userCtx?.name).toBe('alice');
  });

  test('the tenant reads + writes its own db', async () => {
    const read = await fetch(`${couch.url}/mem_alice`, {
      headers: { Authorization: bearer('alice') },
    });
    expect(read.status).toBe(200);
    const write = await fetch(`${couch.url}/mem_alice/note-1`, {
      method: 'PUT',
      headers: { Authorization: bearer('alice'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'hello from alice' }),
    });
    expect(write.status).toBe(201);
  });

  test('a tenant cannot read another tenant db (403)', async () => {
    const res = await fetch(`${couch.url}/mem_bob`, {
      headers: { Authorization: bearer('alice') },
    });
    expect(res.status).toBe(403);
  });

  test('an expired token is rejected (401)', async () => {
    const res = await fetch(`${couch.url}/_session`, {
      headers: { Authorization: bearer('alice', -10) },
    });
    expect(res.status).toBe(401);
  });
});
