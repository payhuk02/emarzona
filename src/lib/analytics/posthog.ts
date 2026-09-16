/**
 * PostHog client (product analytics) — LOT A dual-write.
 *
 * - Init une seule fois (lazy)
 * - Clé publique projet uniquement (phc_…)
 * - Désactivable : VITE_POSTHOG_ENABLED=false ou token absent
 * - Ne jamais y envoyer tokens, secrets, paiement, KYC
 */

import posthog from 'posthog-js';
import { logger } from '@/lib/logger';

let initialized = false;

export function isPostHogConfigured(): boolean {
  if (import.meta.env.VITE_POSTHOG_ENABLED === 'false') return false;
  const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN;
  return typeof token === 'string' && token.startsWith('phc_') && token.length > 10;
}

export function getPostHog(): typeof posthog | null {
  if (typeof window === 'undefined') return null;
  if (!isPostHogConfigured()) return null;
  return initialized ? posthog : null;
}

/**
 * Initialise PostHog une seule fois. Idempotent.
 */
export function initPostHog(): typeof posthog | null {
  if (typeof window === 'undefined') return null;
  if (initialized) return posthog;
  if (!isPostHogConfigured()) {
    logger.debug('PostHog skipped — not configured or disabled');
    return null;
  }

  const apiKey = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN as string;
  const apiHost =
    (import.meta.env.VITE_POSTHOG_HOST as string | undefined)?.replace(/\/$/, '') ||
    'https://us.i.posthog.com';
  const uiHost = apiHost.includes('eu.') ? 'https://eu.posthog.com' : 'https://us.posthog.com';

  try {
    posthog.init(apiKey, {
      api_host: apiHost,
      ui_host: uiHost,
      person_profiles: 'identified_only',
      capture_pageview: false, // SPA : on capture manuellement / via tracker
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      loaded: ph => {
        if (import.meta.env.DEV) {
          logger.debug('PostHog loaded', { apiHost });
          // Avoid noisy autocapture spam in local logs if needed
          void ph;
        }
      },
    });
    initialized = true;
    return posthog;
  } catch (error) {
    logger.warn('PostHog init failed', { error });
    return null;
  }
}

/** Sanitize props: drop obvious secrets / PII blobs. */
function sanitizeProps(
  props?: Record<string, unknown>
): Record<string, string | number | boolean | null> | undefined {
  if (!props) return undefined;
  const blocked =
    /password|token|secret|authorization|card|iban|cvv|ssn|otp|refresh_token|access_token/i;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(props)) {
    if (blocked.test(key)) continue;
    if (value === null || value === undefined) {
      out[key] = null;
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = typeof value === 'string' ? value.slice(0, 500) : value;
    }
  }
  return out;
}

export function capturePostHogEvent(event: string, properties?: Record<string, unknown>): void {
  try {
    const ph = getPostHog() ?? initPostHog();
    if (!ph) return;
    ph.capture(event, sanitizeProps(properties));
  } catch (error) {
    logger.debug('PostHog capture failed', { event, error });
  }
}

export function identifyPostHogUser(userId: string, traits?: Record<string, unknown>): void {
  try {
    const ph = getPostHog() ?? initPostHog();
    if (!ph || !userId) return;
    ph.identify(userId, sanitizeProps(traits));
  } catch (error) {
    logger.debug('PostHog identify failed', { error });
  }
}

export function resetPostHogUser(): void {
  try {
    const ph = getPostHog();
    if (!ph) return;
    ph.reset();
  } catch (error) {
    logger.debug('PostHog reset failed', { error });
  }
}
