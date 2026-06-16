/**
 * Stale-While-Revalidate premium — garantit aucun écran vide.
 * Couche applicative au-dessus de React Query et marketplace-cache.
 */

export interface SwrEntry<T> {
  data: T;
  fetchedAt: number;
  expiresAt: number;
  source: 'memory' | 'localStorage' | 'indexeddb' | 'redis' | 'network';
}

export interface SwrOptions {
  /** Durée pendant laquelle les données sont considérées fraîches */
  freshMs: number;
  /** Durée max d'affichage stale avant expiration dure */
  maxStaleMs: number;
  /** En cas d'erreur réseau, servir stale jusqu'à */
  staleIfErrorMs: number;
}

export const DEFAULT_SWR_OPTIONS: SwrOptions = {
  freshMs: 90 * 1000,
  maxStaleMs: 10 * 60 * 1000,
  staleIfErrorMs: 60 * 60 * 1000,
};

export type SwrState = 'fresh' | 'stale' | 'expired' | 'error-fallback';

export function getSwrState<T>(
  entry: SwrEntry<T> | null,
  options: SwrOptions = DEFAULT_SWR_OPTIONS,
  hasNetworkError = false
): { state: SwrState; shouldRevalidate: boolean; canServe: boolean } {
  if (!entry) {
    return { state: 'expired', shouldRevalidate: true, canServe: false };
  }

  const now = Date.now();
  const age = now - entry.fetchedAt;

  if (hasNetworkError && age < options.staleIfErrorMs) {
    return { state: 'error-fallback', shouldRevalidate: true, canServe: true };
  }

  if (now >= entry.expiresAt) {
    return { state: 'expired', shouldRevalidate: true, canServe: false };
  }

  if (age <= options.freshMs) {
    return { state: 'fresh', shouldRevalidate: false, canServe: true };
  }

  return { state: 'stale', shouldRevalidate: true, canServe: true };
}

/** Crée une entrée SWR à partir de données fraîches */
export function createSwrEntry<T>(
  data: T,
  source: SwrEntry<T>['source'],
  options: SwrOptions = DEFAULT_SWR_OPTIONS
): SwrEntry<T> {
  const now = Date.now();
  return {
    data,
    fetchedAt: now,
    expiresAt: now + options.maxStaleMs,
    source,
  };
}

/**
 * Fetch avec SWR : retourne immédiatement le cache stale si disponible,
 * lance le refresh en arrière-plan.
 */
export async function fetchWithSwr<T>(params: {
  getCached: () => Promise<SwrEntry<T> | null> | SwrEntry<T> | null;
  fetchFresh: () => Promise<T>;
  setCached: (entry: SwrEntry<T>) => Promise<void> | void;
  options?: SwrOptions;
}): Promise<{ data: T; state: SwrState; fromCache: boolean }> {
  const options = params.options ?? DEFAULT_SWR_OPTIONS;
  const cached = await params.getCached();
  const swr = getSwrState(cached, options);

  if (swr.canServe && swr.state !== 'expired') {
    if (swr.shouldRevalidate) {
      void params
        .fetchFresh()
        .then(fresh => params.setCached(createSwrEntry(fresh, 'network', options)))
        .catch(() => {
          /* stale-if-error : garder le cache existant */
        });
    }
    return { data: cached!.data, state: swr.state, fromCache: true };
  }

  try {
    const fresh = await params.fetchFresh();
    const entry = createSwrEntry(fresh, 'network', options);
    await params.setCached(entry);
    return { data: fresh, state: 'fresh', fromCache: false };
  } catch (error) {
    if (cached && getSwrState(cached, options, true).canServe) {
      return { data: cached.data, state: 'error-fallback', fromCache: true };
    }
    throw error;
  }
}
