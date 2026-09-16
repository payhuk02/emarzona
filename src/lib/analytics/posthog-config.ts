/**
 * Config PostHog légère — sans import de posthog-js (évite de gonfler app-core).
 */

export function isPostHogConfigured(): boolean {
  if (import.meta.env.VITE_POSTHOG_ENABLED === 'false') return false;
  const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN;
  return typeof token === 'string' && token.startsWith('phc_') && token.length > 10;
}
