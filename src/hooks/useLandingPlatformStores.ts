import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

async function fetchActiveStores(): Promise<LandingPlatformStore[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, slug, subdomain, logo_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as LandingPlatformStore[];
}

/** Boutiques réelles actives — mise à jour en temps réel à chaque création */
export function useLandingPlatformStores() {
  const queryClient = useQueryClient();
  const backendReady = isSupabaseBackendConfigured();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchActiveStores,
    enabled: backendReady,
    staleTime: 60_000,
    refetchOnWindowFocus: backendReady,
    retry: backendReady ? 2 : false,
  });

  useEffect(() => {
    if (!backendReady) return;

    const channel = supabase
      .channel('landing-stores-marquee')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [backendReady, queryClient]);

  return query;
}
