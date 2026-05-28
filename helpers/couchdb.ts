import { TIMEOUTS } from './constants.js';
import { waitFor } from './wait-for.js';

export interface CouchDbConfig {
  url: string;
  username: string;
  password: string;
}

export const couchDbFromEnv = (): CouchDbConfig => ({
  url: process.env['COUCHDB_URL'] ?? 'http://localhost:5984',
  username: process.env['COUCHDB_USER'] ?? 'admin',
  password: process.env['COUCHDB_PASS'] ?? 'agentage',
});

const authHeader = ({ username, password }: CouchDbConfig): string =>
  'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

export const waitForCouchDb = (cfg: CouchDbConfig): Promise<void> =>
  waitFor(
    async () => {
      try {
        const res = await fetch(`${cfg.url}/_up`);
        return res.ok;
      } catch {
        return false;
      }
    },
    { timeout: TIMEOUTS.couchdbReady, label: 'CouchDB /_up' }
  );

export const ensureDatabase = async (cfg: CouchDbConfig, name: string): Promise<void> => {
  const res = await fetch(`${cfg.url}/${name}`, {
    method: 'PUT',
    headers: { Authorization: authHeader(cfg) },
  });
  if (!res.ok && res.status !== 412) {
    throw new Error(`CouchDB PUT /${name} -> ${res.status}: ${await res.text()}`);
  }
};

export const dropDatabase = async (cfg: CouchDbConfig, name: string): Promise<void> => {
  const res = await fetch(`${cfg.url}/${name}`, {
    method: 'DELETE',
    headers: { Authorization: authHeader(cfg) },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`CouchDB DELETE /${name} -> ${res.status}: ${await res.text()}`);
  }
};

export interface AllDocsResponse {
  total_rows: number;
  rows: Array<{ id: string; key: string; value: { rev: string } }>;
}

export const allDocs = async (cfg: CouchDbConfig, name: string): Promise<AllDocsResponse> => {
  const res = await fetch(`${cfg.url}/${name}/_all_docs`, {
    headers: { Authorization: authHeader(cfg) },
  });
  if (!res.ok) {
    throw new Error(`CouchDB GET /${name}/_all_docs -> ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as AllDocsResponse;
};

export const putDoc = async (
  cfg: CouchDbConfig,
  name: string,
  doc: { _id: string } & Record<string, unknown>
): Promise<void> => {
  const res = await fetch(`${cfg.url}/${name}/${encodeURIComponent(doc._id)}`, {
    method: 'PUT',
    headers: { Authorization: authHeader(cfg), 'Content-Type': 'application/json' },
    body: JSON.stringify(doc),
  });
  if (!res.ok) {
    throw new Error(`CouchDB PUT /${name}/${doc._id} -> ${res.status}: ${await res.text()}`);
  }
};

export const waitForDoc = (cfg: CouchDbConfig, name: string, id: string): Promise<void> =>
  waitFor(
    async () => {
      try {
        const { rows } = await allDocs(cfg, name);
        return rows.some((r) => r.id === id);
      } catch {
        return false;
      }
    },
    { timeout: TIMEOUTS.replication, label: `CouchDB doc '${id}'` }
  );
