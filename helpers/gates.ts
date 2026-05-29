/**
 * Gates for tiers that need a backing service present — a local Obsidian binary,
 * a reachable CouchDB, a deployed MCP endpoint, or a dashboard write API. A tier
 * reads the relevant gate in `test.skip(!gates.X, '...')` at the top of its
 * describe/beforeAll.
 *
 * The deployed-site tiers (landing, backend, dashboard smoke) do NOT gate here —
 * they always run against a target resolved by helpers/site.ts +
 * helpers/landing.ts (SITE_ENV / LANDING_ENV, default dev), so the nightly is
 * never vacuous. `dashboard` below is the integration golden-path's write-API
 * gate, distinct from that unauthenticated dashboard smoke.
 */
export const gates = {
  obsidian: !!process.env['OBSIDIAN_BIN'],
  couchdb: !!process.env['COUCHDB_URL'],
  mcp: !!process.env['MCP_URL'],
  dashboard: !!process.env['DASHBOARD_URL'],
};
