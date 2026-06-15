/**
 * Epic 6.5 — Organisations multi-boutiques Enterprise
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type OrganizationStoreLink = {
  store_id: string;
  store_name: string;
  store_slug: string;
  role: string;
};

export type StoreOrganization = {
  id: string;
  name: string;
  slug: string | null;
  store_count: number;
  stores: OrganizationStoreLink[];
};

async function fetchOrganizations(): Promise<StoreOrganization[]> {
  const { data, error } = await supabase.rpc('list_user_store_organizations');
  if (error) throw error;
  return (data ?? []) as StoreOrganization[];
}

export function useStoreOrganizations() {
  return useQuery({
    queryKey: ['store-organizations'],
    queryFn: fetchOrganizations,
    staleTime: 60_000,
  });
}

export async function createStoreOrganization(name: string, storeId?: string) {
  const { data, error } = await supabase.rpc('create_store_organization', {
    p_name: name,
    p_store_id: storeId ?? null,
  });
  if (error) throw error;
  return data as string;
}
