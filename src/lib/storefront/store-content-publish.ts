/**
 * Brouillon / publication contenu boutique (SEO, marketing, legal) — Sprint 5.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Store, StoreLegalPages, StoreMarketingContent } from '@/hooks/useStores';

export type StoreContentDomain = 'seo' | 'marketing' | 'legal';

export type StoreSeoDraft = {
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
};

type UntypedRpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

function asRpc() {
  return supabase as unknown as UntypedRpcClient;
}

export function getStoreSeoDraft(store: Store): StoreSeoDraft | null {
  const raw = (store as Store & { seo_draft?: unknown }).seo_draft;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as StoreSeoDraft;
}

export function getStoreMarketingDraft(store: Store): StoreMarketingContent | null {
  const raw = (store as Store & { marketing_content_draft?: unknown }).marketing_content_draft;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as StoreMarketingContent;
}

export function getStoreLegalDraft(store: Store): StoreLegalPages | null {
  const raw = (store as Store & { legal_pages_draft?: unknown }).legal_pages_draft;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as StoreLegalPages;
}

export function hasUnpublishedContentDraft(store: Store, domain: StoreContentDomain): boolean {
  if (domain === 'seo') return getStoreSeoDraft(store) != null;
  if (domain === 'marketing') return getStoreMarketingDraft(store) != null;
  return getStoreLegalDraft(store) != null;
}

export async function saveStoreContentDraft(
  storeId: string,
  domain: StoreContentDomain,
  draft: StoreSeoDraft | StoreMarketingContent | StoreLegalPages | null
): Promise<void> {
  const { error } = await asRpc().rpc('save_store_content_draft', {
    p_store_id: storeId,
    p_domain: domain,
    p_draft: draft as never,
  });

  if (error) {
    // Fallback si migration pas encore déployée : écriture live (comportement historique)
    const column =
      domain === 'seo' ? null : domain === 'marketing' ? 'marketing_content' : 'legal_pages';

    if (domain === 'seo' && draft && typeof draft === 'object') {
      const seo = draft as StoreSeoDraft;
      const { error: legacyError } = await supabase
        .from('stores')
        .update({
          meta_title: seo.meta_title ?? null,
          meta_description: seo.meta_description ?? null,
          meta_keywords: seo.meta_keywords ?? null,
          og_title: seo.og_title ?? null,
          og_description: seo.og_description ?? null,
          og_image: seo.og_image ?? null,
        } as never)
        .eq('id', storeId);
      if (legacyError) throw legacyError;
      return;
    }

    if (column) {
      const { error: legacyError } = await supabase
        .from('stores')
        .update({ [column]: draft } as never)
        .eq('id', storeId);
      if (legacyError) throw legacyError;
      return;
    }

    throw error;
  }
}

export async function publishStoreContent(
  storeId: string,
  domain: StoreContentDomain
): Promise<Store> {
  const { data, error } = await asRpc().rpc('publish_store_content', {
    p_store_id: storeId,
    p_domain: domain,
  });

  if (error) throw error;
  return data as Store;
}
