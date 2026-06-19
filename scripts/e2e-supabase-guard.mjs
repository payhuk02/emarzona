/**
 * Garde-fou E2E — empêche les tests/scripts destructifs sur le projet Supabase prod.
 * Garder en sync avec tests/e2e/helpers/e2e-supabase-guard.ts
 */

/** Projet Supabase production Emarzona (cf. .env.example / setup-commerce-e2e-github-secret.mjs) */
export const DEFAULT_PRODUCTION_SUPABASE_PROJECT_REF = 'hbdnzajbyjakdhuavrvb';

/** Emails créés par les specs E2E (commerce-gating, vertical-paid, artist RPC, etc.) */
export const E2E_ORPHAN_EMAIL_PATTERN = /^e2e[-_].*@example\.com$/i;

export function extractSupabaseProjectRef(url) {
  const match = url?.trim().match(/^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/i);
  return match?.[1] ?? null;
}

export function getProductionProjectRefs() {
  return (process.env.E2E_PRODUCTION_SUPABASE_PROJECT_REF ?? DEFAULT_PRODUCTION_SUPABASE_PROJECT_REF)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * true si l'URL pointe vers un projet considéré comme production (écritures E2E interdites).
 */
export function isProductionSupabaseUrl(url) {
  if (process.env.E2E_ALLOW_PRODUCTION_SUPABASE === '1') {
    return false;
  }

  const ref = extractSupabaseProjectRef(url);
  if (!ref) {
    return true;
  }

  const productionRefs = getProductionProjectRefs();
  return productionRefs.includes(ref);
}

export function assertSafeE2ESupabaseUrl(url, context = 'E2E') {
  if (!url?.trim()) {
    throw new Error(`${context}: VITE_SUPABASE_URL manquante.`);
  }

  if (isProductionSupabaseUrl(url)) {
    const ref = extractSupabaseProjectRef(url) ?? url;
    throw new Error(
      [
        `${context} bloqué : le projet Supabase « ${ref} » est la production.`,
        'Configurez VITE_SUPABASE_TEST_URL vers un projet Supabase dédié (ref différente de la prod),',
        'ou créez un projet test isolé.',
        'Override dangereux : E2E_ALLOW_PRODUCTION_SUPABASE=1',
      ].join(' ')
    );
  }
}

/**
 * Pour cleanup sur prod : exige un flag explicite si l'URL cible la production.
 */
export function assertCleanupTargetAllowed(url, { confirmProduction = false } = {}) {
  if (!url?.trim()) {
    throw new Error('cleanup:e2e-orphans : VITE_SUPABASE_URL manquante.');
  }

  if (!isProductionSupabaseUrl(url)) {
    return;
  }

  if (confirmProduction || process.env.E2E_ALLOW_PRODUCTION_SUPABASE === '1') {
    return;
  }

  const ref = extractSupabaseProjectRef(url) ?? url;
  throw new Error(
    [
      `cleanup:e2e-orphans bloqué : « ${ref} » est la production.`,
      'Relancez avec --confirm-production pour purger les orphelins E2E sur ce projet.',
    ].join(' ')
  );
}

export function isE2EOrphanEmail(email) {
  return Boolean(email && E2E_ORPHAN_EMAIL_PATTERN.test(email));
}

export function isE2EOrphanStore(record) {
  if (!record) return false;
  const name = String(record.name ?? '');
  const slug = String(record.slug ?? '');
  const description = String(record.description ?? '');
  return (
    /^E2E\s/i.test(name) ||
    /^e2e[-_]/i.test(slug) ||
    /^E2E\s/i.test(description) ||
    /E2E store for/i.test(description)
  );
}
