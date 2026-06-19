/**
 * Garde-fou E2E — empêche les tests destructifs sur le projet Supabase prod.
 * Garder en sync avec scripts/e2e-supabase-guard.mjs
 */

export const DEFAULT_PRODUCTION_SUPABASE_PROJECT_REF = 'hbdnzajbyjakdhuavrvb';

export const E2E_ORPHAN_EMAIL_PATTERN = /^e2e[-_].*@example\.com$/i;

export function extractSupabaseProjectRef(url: string): string | null {
  const match = url?.trim().match(/^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/i);
  return match?.[1] ?? null;
}

export function getProductionProjectRefs(): string[] {
  return (
    process.env.E2E_PRODUCTION_SUPABASE_PROJECT_REF ?? DEFAULT_PRODUCTION_SUPABASE_PROJECT_REF
  )
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export function isProductionSupabaseUrl(url: string): boolean {
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

export function assertSafeE2ESupabaseUrl(url: string, context = 'E2E'): void {
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

export function resolveE2ESupabaseUrl(): string {
  return (
    process.env.VITE_SUPABASE_TEST_URL?.trim() ||
    process.env.VITE_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    ''
  );
}
