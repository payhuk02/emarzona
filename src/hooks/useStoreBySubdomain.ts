/**
 * Hook pour récupérer une boutique par son sous-domaine
 *
 * Utilisé dans le système multi-tenant pour charger automatiquement
 * la boutique correspondante au sous-domaine depuis lequel l'application est accédée
 *
 * Date: 1 Février 2025
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { detectSubdomain } from '@/lib/subdomain-detector';
import { logger } from '@/lib/logger';
import type { Store } from '@/hooks/useStores';

interface StoreBySubdomainResponse {
  success: boolean;
  store: Store;
  subdomain: string;
}

/**
 * Récupère une boutique par son sous-domaine via l'Edge Function
 */
async function fetchStoreBySubdomain(subdomain: string): Promise<Store> {
  // Option 1: Utiliser l'Edge Function (recommandé pour la production)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const functionUrl = `${supabaseUrl}/functions/v1/store-by-domain`;

  try {
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Passer le sous-domaine dans un header personnalisé si nécessaire
        'x-subdomain': subdomain,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Boutique non trouvée pour le sous-domaine: ${subdomain}`);
      }
      throw new Error(`Erreur lors de la récupération de la boutique: ${response.statusText}`);
    }

    const data: StoreBySubdomainResponse = await response.json();

    if (!data.success || !data.store) {
      throw new Error("Réponse invalide de l'API");
    }

    return data.store;
  } catch (error) {
    logger.error('Error fetching store by subdomain via Edge Function', { error, subdomain });

    // Option 2: Fallback - Utiliser directement Supabase RPC
    try {
      const { data, error: rpcError } = await supabase.rpc('get_store_by_subdomain', {
        store_subdomain: subdomain,
      });

      if (rpcError) {
        throw rpcError;
      }

      if (!data || data.length === 0) {
        throw new Error(`Boutique non trouvée pour le sous-domaine: ${subdomain}`);
      }

      return data[0] as Store;
    } catch (rpcError) {
      logger.error('Error fetching store by subdomain via RPC', { error: rpcError, subdomain });
      throw rpcError;
    }
  }
}

/**
 * Hook pour récupérer une boutique par sous-domaine
 *
 * @param subdomain - Le sous-domaine à rechercher (optionnel, détecté automatiquement si non fourni)
 * @param options - Options de configuration du hook
 */
export function useStoreBySubdomain(
  subdomain?: string | null,
  options?: {
    enabled?: boolean;
    retry?: boolean;
    refetchOnWindowFocus?: boolean;
  }
) {
  // Détecter le sous-domaine si non fourni
  const detectedSubdomain = subdomain ?? detectSubdomain().subdomain;

  const enabled = (options?.enabled ?? true) && !!detectedSubdomain;

  return useQuery({
    queryKey: ['store-by-subdomain', detectedSubdomain],
    queryFn: () => {
      if (!detectedSubdomain) {
        throw new Error('No subdomain provided or detected');
      }
      return fetchStoreBySubdomain(detectedSubdomain);
    },
    enabled,
    retry: options?.retry ?? 2,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
    onError: error => {
      logger.error('Error in useStoreBySubdomain', { error, subdomain: detectedSubdomain });
    },
  });
}

/**
 * Hook pour récupérer automatiquement la boutique depuis le sous-domaine actuel
 *
 * Version simplifiée qui détecte automatiquement le sous-domaine
 */
export function useCurrentStoreBySubdomain() {
  const subdomainInfo = detectSubdomain();

  // Activer UNIQUEMENT si on est sur le domaine des boutiques (myemarzona.shop)
  return useStoreBySubdomain(subdomainInfo.subdomain, {
    enabled: subdomainInfo.isStoreDomain && subdomainInfo.isSubdomain,
  });
}
