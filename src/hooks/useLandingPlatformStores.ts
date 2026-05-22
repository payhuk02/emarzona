import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isSupabaseBackendConfigured } from '@/lib/supabase-config';

export interface LandingPlatformStore {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  logo_url: string | null;
}

const QUERY_KEY = ['landing', 'platform-stores'] as const;

/** Rafraîchissement périodique (pas de Realtime sur toute la table `stores` à l'échelle). */
const LANDING_STORES_REFETCH_MS = 120_000;

async function fetchActiveStores(): Promise<LandingPlatformStore[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, slug, subdomain, logo_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as LandingPlatformStore[];
}

/** Boutiques actives pour le bandeau landing — cache + polling léger. */
export function useLandingPlatformStores() {
  const backendReady = isSupabaseBackendConfigured();

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchActiveStores,
    enabled: backendReady,
    staleTime: 60_000,
    refetchInterval: backendReady ? LANDING_STORES_REFETCH_MS : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: backendReady,
    retry: backendReady ? 2 : false,
  });
}
