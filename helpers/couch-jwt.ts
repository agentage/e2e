import { createHmac } from 'node:crypto';

/**
 * Mint a CouchDB JWT exactly as the backend's `/api/sync/bootstrap` does —
 * HS256, header `kid:_default`, signed with the RAW secret, carrying `sub`
 * (the CouchDB user name) and a required `exp`. Mirrors
 * `agentage/web` packages/backend/src/utils/couch-jwt.ts so the e2e can exercise
 * the live JWT-auth substrate without standing up the backend.
 */
const base64url = (input: Buffer | string): string =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export interface MintOptions {
  sub: string;
  secret: string;
  ttlSeconds: number;
  nowSeconds?: number;
}

export const mintCouchJwt = (opts: MintOptions): string => {
  const iat = opts.nowSeconds ?? Math.floor(Date.now() / 1000);
  const exp = iat + opts.ttlSeconds;
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: '_default' }));
  const payload = base64url(JSON.stringify({ sub: opts.sub, iat, exp }));
  const signature = base64url(
    createHmac('sha256', opts.secret).update(`${header}.${payload}`).digest()
  );
  return `${header}.${payload}.${signature}`;
};
