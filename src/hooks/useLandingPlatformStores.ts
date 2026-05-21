import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchActiveStores,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const channel = supabase
      .channel('landing-stores-marquee')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stores' }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
