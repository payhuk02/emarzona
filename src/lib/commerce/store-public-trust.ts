import type { Store } from '@/hooks/useStores';

export type StorePublicTrust = {
  isVerified: boolean;
  activeClients?: number;
};

export function resolveStoreIsVerified(
  store: Pick<Store, 'domain_status' | 'domain_verified_at' | 'metadata'> | null | undefined
): boolean {
  if (!store) return false;

  if (store.domain_status === 'verified' || Boolean(store.domain_verified_at)) {
    return true;
  }

  const meta =
    store.metadata && typeof store.metadata === 'object'
      ? (store.metadata as Record<string, unknown>)
      : null;

  if (meta?.verified === true || meta?.kyc_status === 'verified') {
    return true;
  }

  return false;
}

export function resolveStoreActiveClients(
  storedCount?: number | null,
  computedDistinctCustomers?: number | null
): number | undefined {
  if (typeof storedCount === 'number' && storedCount > 0) {
    return storedCount;
  }
  if (typeof computedDistinctCustomers === 'number' && computedDistinctCustomers > 0) {
    return computedDistinctCustomers;
  }
  return undefined;
}

export function resolveStorePublicTrust(
  store:
    | (Pick<Store, 'domain_status' | 'domain_verified_at' | 'metadata'> & {
        active_clients?: number | null;
      })
    | null
    | undefined,
  computedDistinctCustomers?: number | null
): StorePublicTrust {
  return {
    isVerified: resolveStoreIsVerified(store),
    activeClients: resolveStoreActiveClients(store?.active_clients, computedDistinctCustomers),
  };
}
