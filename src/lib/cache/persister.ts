import { get, set, del } from 'idb-keyval';
import type { Persister, PersistedClient } from '@tanstack/react-query-persist-client';
import { logger } from '@/lib/logger';

/**
 * Creates an IndexedDB persister for React Query using idb-keyval.
 * This enables offline-first capabilities and instant load times.
 *
 * @param idbValidKey The key to use in IndexedDB
 */
export function createIDBPersister(idbValidKey: string = 'reactQuery'): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        await set(idbValidKey, client);
      } catch (error) {
        logger.error('Failed to persist React Query cache to IndexedDB', { error });
      }
    },
    restoreClient: async () => {
      try {
        return await get(idbValidKey);
      } catch (error) {
        logger.error('Failed to restore React Query cache from IndexedDB', { error });
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        await del(idbValidKey);
      } catch (error) {
        logger.error('Failed to remove React Query cache from IndexedDB', { error });
      }
    },
  };
}
