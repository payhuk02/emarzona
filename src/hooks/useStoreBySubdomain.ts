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
import { STOREFRONT_STORE_PUBLIC_SELECT } from '@/lib/storefront/store-public-fields';

interface StoreBySubdomainResponse {
  success: boolean;
  store: Store;
  subdomain: string;
}

function storeHasThemeFields(store: Store): boolean {
  return store.primary_color != null || store.heading_font != null || store.header_style != null;
}

/**
 * Complète une boutique partielle (RPC / edge function) avec la projection `stores_public`.
 */
async function enrichStoreFromPublicView(store: Store): Promise<Store> {
  if (storeHasThemeFields(store)) {
    return store;
  }

  const { data, error } = await supabase
    .from('stores_public')
    .select(STOREFRONT_STORE_PUBLIC_SELECT)
    .eq('id', store.id)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      logger.warn('Could not enrich store from stores_public', { storeId: store.id, error });
    }
    return store;
  }

  return { ...store, ...data } as Store;
}

/**
 * Récupère une boutique via l'Edge Function store-by-domain.
 * Supporte les 2 modes: sous-domaine et domaine personnalisé.
 */
async function fetchStoreBySubdomain(
  subdomain?: string | null,
  customDomain?: string | null
): Promise<Store> {
  const normalizedSubdomain = subdomain?.trim().toLowerCase() || null;
  const normalizedCustomDomain = customDomain?.trim().toLowerCase() || null;
  const identifier = normalizedSubdomain || normalizedCustomDomain;
  if (!identifier) {
    throw new Error('Aucun identifiant de boutique fourni');
  }

  // Option 1: Utiliser l'Edge Function (recommandé pour la production)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
  const params = new URLSearchParams();
  if (normalizedSubdomain) params.set('subdomain', normalizedSubdomain);
  if (normalizedCustomDomain) params.set('domain', normalizedCustomDomain);
  const functionUrl = `${supabaseUrl}/functions/v1/store-by-domain?${params.toString()}`;

  try {
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(supabaseKey
          ? {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            }
          : {}),
        // Passer le sous-domaine dans un header personnalisé si nécessaire
        ...(normalizedSubdomain ? { 'x-subdomain': normalizedSubdomain } : {}),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Boutique non trouvée pour: ${identifier}`);
      }
      throw new Error(`Erreur lors de la récupération de la boutique: ${response.statusText}`);
    }

    const data: StoreBySubdomainResponse = await response.json();

    if (!data.success || !data.store) {
      throw new Error("Réponse invalide de l'API");
    }

    return enrichStoreFromPublicView(data.store);
  } catch (error) {
    logger.error('Error fetching store by subdomain via Edge Function', {
      error,
      subdomain: normalizedSubdomain,
      customDomain: normalizedCustomDomain,
    });

    // Option 2: Fallback - Utiliser directement Supabase RPC
    try {
      const rpcResult = normalizedSubdomain
        ? await supabase.rpc('get_store_by_subdomain', { store_subdomain: normalizedSubdomain })
        : await supabase.rpc('get_store_by_custom_domain', { p_domain: normalizedCustomDomain });
      const { data, error: rpcError } = rpcResult;

      if (rpcError) {
        throw rpcError;
      }

      if (!data || data.length === 0) {
        throw new Error(`Boutique non trouvée pour: ${identifier}`);
      }

      return enrichStoreFromPublicView(data[0] as Store);
    } catch (rpcError) {
      logger.error('Error fetching store by subdomain via RPC', {
        error: rpcError,
        subdomain: normalizedSubdomain,
        customDomain: normalizedCustomDomain,
      });

      // Option 3: lecture directe stores_public (thème complet)
      try {
        let query = supabase.from('stores_public').select(STOREFRONT_STORE_PUBLIC_SELECT);

        if (normalizedSubdomain) {
          query = query.eq('subdomain', normalizedSubdomain);
        } else if (normalizedCustomDomain) {
          query = query.eq('custom_domain', normalizedCustomDomain).eq('domain_status', 'verified');
        }

        const { data: publicStore, error: publicError } = await query.maybeSingle();

        if (publicError) {
          throw publicError;
        }

        if (!publicStore) {
          throw new Error(`Boutique non trouvée pour: ${identifier}`);
        }

        return publicStore as Store;
      } catch (publicViewError) {
        logger.error('Error fetching store from stores_public', {
          error: publicViewError,
          subdomain: normalizedSubdomain,
          customDomain: normalizedCustomDomain,
        });
        throw rpcError;
      }
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
    customDomain?: string | null;
  }
) {
  // Détecter le contexte courant une seule fois pour éviter les incohérences
  const currentHostInfo = detectSubdomain();
  const detectedSubdomain = subdomain ?? currentHostInfo.subdomain;

  const hasStoreIdentifier = !!detectedSubdomain || !!options?.customDomain;
  const enabled =
    (options?.enabled ?? true) && hasStoreIdentifier && !currentHostInfo.isPlatformDomain;

  return useQuery({
    queryKey: ['store-by-subdomain', detectedSubdomain, options?.customDomain || null],
    queryFn: () => {
      if (!detectedSubdomain && !options?.customDomain) {
        throw new Error('No subdomain or custom domain provided or detected');
      }
      return fetchStoreBySubdomain(detectedSubdomain, options?.customDomain);
    },
    enabled,
    retry: options?.retry ?? 2,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
  });
}

/**
 * Hook pour récupérer automatiquement la boutique depuis le sous-domaine actuel
 *
 * Version simplifiée qui détecte automatiquement le sous-domaine
 */
export function useCurrentStoreBySubdomain() {
  const subdomainInfo = detectSubdomain();
  const useStoreSubdomain =
    !subdomainInfo.isPlatformDomain && subdomainInfo.isStoreDomain && subdomainInfo.isSubdomain;
  const useCustomDomain = !subdomainInfo.isPlatformDomain && subdomainInfo.isCustomDomain;
  const shouldResolveStore = useStoreSubdomain || useCustomDomain;

  return useStoreBySubdomain(useStoreSubdomain ? subdomainInfo.subdomain : null, {
    enabled: shouldResolveStore,
    customDomain: useCustomDomain ? subdomainInfo.customDomain : null,
  });
}
