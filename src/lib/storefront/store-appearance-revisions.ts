/**
 * Historique / rollback apparence (store_appearance_revisions).
 */

import { supabase } from '@/integrations/supabase/client';
import type { Store } from '@/hooks/useStores';

export interface StoreAppearanceRevisionSummary {
  revision_number: number;
  published_at: string;
  published_by: string | null;
  primary_color: string | null;
}

export async function listStoreAppearanceRevisions(
  storeId: string,
  limit = 10
): Promise<StoreAppearanceRevisionSummary[]> {
  const { data, error } = await supabase.rpc('list_store_appearance_revisions', {
    p_store_id: storeId,
    p_limit: limit,
  });

  if (error) throw error;
  return (data ?? []) as StoreAppearanceRevisionSummary[];
}

export async function restoreStoreAppearanceRevision(
  storeId: string,
  revisionNumber: number
): Promise<Store> {
  const { data, error } = await supabase.rpc('restore_store_appearance_revision', {
    p_store_id: storeId,
    p_revision_number: revisionNumber,
  });

  if (error) throw error;
  return data as Store;
}
