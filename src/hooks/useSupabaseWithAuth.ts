/**
 * Hook Supabase avec gestion automatique des erreurs JWT
 * Wrapper autour du client Supabase avec retry automatique pour les erreurs d'authentification
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthRefresh } from './useAuthRefresh';
import { logger } from '@/lib/logger';

interface UseSupabaseWithAuthOptions {
  maxRetries?: number;
  retryDelay?: number;
}

export const useSupabaseWithAuth = (options: UseSupabaseWithAuthOptions = {}) => {
  const { maxRetries = 2, retryDelay = 1000 } = options;
  const { withAuthRetry } = useAuthRefresh();

  // Wrapper pour les requêtes de base de données
  const from = useCallback((table: string) => {
    const originalFrom = supabase.from(table);

    return {
      select: (columns = '*') => ({
        ...originalFrom.select(columns),
        // Override des méthodes principales pour ajouter la gestion d'auth
        then: async (resolve: any, reject: any) => {
          try {
            const result = await withAuthRetry(
              () => originalFrom.select(columns),
              `select ${table}`
            );
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
      }),

      insert: (values: any) => ({
        ...originalFrom.insert(values),
        then: async (resolve: any, reject: any) => {
          try {
            const result = await withAuthRetry(
              () => originalFrom.insert(values),
              `insert ${table}`
            );
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
      }),

      update: (values: any) => ({
        ...originalFrom.update(values),
        then: async (resolve: any, reject: any) => {
          try {
            const result = await withAuthRetry(
              () => originalFrom.update(values),
              `update ${table}`
            );
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
      }),

      delete: () => ({
        ...originalFrom.delete(),
        then: async (resolve: any, reject: any) => {
          try {
            const result = await withAuthRetry(
              () => originalFrom.delete(),
              `delete ${table}`
            );
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
      }),

      // Pour les queries plus complexes (eq, neq, etc.)
      eq: (column: string, value: any) => ({
        ...originalFrom.select().eq(column, value),
        then: async (resolve: any, reject: any) => {
          try {
            const result = await withAuthRetry(
              () => originalFrom.select().eq(column, value),
              `select ${table} where ${column} = ${value}`
            );
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
      }),

      // Méthode générique pour exécuter des queries
      execute: async (queryBuilder: any, context?: string) => {
        return withAuthRetry(queryBuilder, context || `query ${table}`);
      }
    };
  }, [withAuthRetry]);

  // Wrapper pour les fonctions RPC
  const rpc = useCallback((functionName: string, params?: any) => {
    return withAuthRetry(
      () => supabase.rpc(functionName, params),
      `rpc ${functionName}`
    );
  }, [withAuthRetry]);

  // Wrapper pour l'authentification
  const auth = {
    getSession: () => supabase.auth.getSession(),
    getUser: () => supabase.auth.getUser(),
    signOut: () => supabase.auth.signOut(),
    refreshSession: () => supabase.auth.refreshSession(),
  };

  // Wrapper pour le storage
  const storage = {
    from: (bucket: string) => supabase.storage.from(bucket),
  };

  return {
    from,
    rpc,
    auth,
    storage,
    // Accès direct au client si nécessaire
    client: supabase,
  };
};