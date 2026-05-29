export const SITE_TARGETS = {
  dev: 'https://dev.agentage.io',
  prod: 'https://agentage.io',
} as const;

export type SiteEnv = keyof typeof SITE_TARGETS;

// Base host shared by backend (/api/*) and dashboard (/dashboard) tiers.
// Nightly tests dev. Resolves from SITE_URL, else SITE_ENV (dev|prod), else dev.
export const siteUrl = (): string => {
  const override = process.env['SITE_URL'];
  if (override) return override;
  const env = (process.env['SITE_ENV'] as SiteEnv | undefined) ?? 'dev';
  return SITE_TARGETS[env] ?? SITE_TARGETS.dev;
};
