/** Client-side navigation feature flags (Phase 3). */
const DEFAULTS: Record<string, boolean> = {
  'nav.ai-chatbot': true,
  'nav.image-studio': true,
  'nav.recommendations': true,
};

function readEnvFlag(key: string): boolean | undefined {
  const envKey = `VITE_${key.toUpperCase().replace(/\./g, '_')}`;
  const value = import.meta.env[envKey];
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export function isNavFeatureEnabled(flag?: string): boolean {
  if (!flag) return true;
  const fromEnv = readEnvFlag(flag);
  if (fromEnv !== undefined) return fromEnv;
  return DEFAULTS[flag] ?? true;
}

export function getDisabledNavFeatureFlags(): string[] {
  return Object.keys(DEFAULTS).filter(flag => !isNavFeatureEnabled(flag));
}
