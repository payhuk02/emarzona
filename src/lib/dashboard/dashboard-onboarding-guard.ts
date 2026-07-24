/**
 * Règle d'affichage onboarding vs skeleton vs dashboard (évite flash « pas de boutique »).
 */

export type DashboardShellView = 'onboarding' | 'skeleton' | 'dashboard';

export function resolveDashboardShellView(input: {
  contextLoading: boolean;
  storeLoading: boolean;
  hasStores: boolean;
  storesCount: number;
  store: unknown | null;
  /** Erreur de chargement des boutiques : ne jamais conclure « 0 boutique ». */
  storesError?: string | null;
}): DashboardShellView {
  const awaitingStoreResolution =
    input.contextLoading ||
    input.storeLoading ||
    Boolean(input.storesError) ||
    ((input.hasStores || input.storesCount > 0) && !input.store);

  if (!awaitingStoreResolution && !input.hasStores && input.storesCount === 0) {
    return 'onboarding';
  }

  if (awaitingStoreResolution && !input.store) {
    return 'skeleton';
  }

  return 'dashboard';
}
