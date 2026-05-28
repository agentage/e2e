export const LANDING_TARGETS = {
  dev: 'https://dev.agentage.io',
  prod: 'https://agentage.io',
} as const;

export type LandingEnv = keyof typeof LANDING_TARGETS;

// Nightly tests dev; a green dev run gates the dev→prod promotion. prod is the
// promotion target — point the smoke at it (LANDING_ENV=prod) to verify after.
export const landingUrl = (): string => {
  const override = process.env['LANDING_URL'];
  if (override) return override;
  const env = (process.env['LANDING_ENV'] as LandingEnv | undefined) ?? 'dev';
  return LANDING_TARGETS[env] ?? LANDING_TARGETS.dev;
};
