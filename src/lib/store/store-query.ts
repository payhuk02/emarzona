/**
 * Fetch + clés React Query partagées pour useStore (évite les fetchs DB dupliqués).
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { resolveStoreCommerceTypeFromStore } from '@/lib/commerce/store-capability-map';
import type { Store } from '@/hooks/useStore';
import {
  flattenStoreWithAppearance,
  STORE_APPEARANCE_EMBED_SELECT,
} from '@/lib/storefront/flatten-store-appearance';

export const STORE_FIELDS = `id, user_id, name, slug, subdomain, description, default_currency, custom_domain, domain_status, domain_verification_token, domain_verified_at, domain_error_message, info_message, info_message_color, info_message_font, metadata, commerce_type, created_at, updated_at, ${STORE_APPEARANCE_EMBED_SELECT}`;

export function mapStoreRow(row: Record<string, unknown> | null | undefined): Store | null {
  if (!row) return null;
  const flattened = flattenStoreWithAppearance(row);
  return {
    ...flattened,
    commerce_type: resolveStoreCommerceTypeFromStore(
      flattened as { commerce_type?: unknown; metadata?: Record<string, unknown> | null }
    ),
  } as Store;
}

export const storeQueryKeys = {
  all: ['store'] as const,
  detail: (userId: string, storeId: string) => [...storeQueryKeys.all, userId, storeId] as const,
  firstForUser: (userId: string) => [...storeQueryKeys.all, userId, '__first__'] as const,
};

export async function fetchStoreById(userId: string, storeId: string): Promise<Store | null> {
  logger.debug('[store-query] fetchStoreById', { userId, storeId });

  const { data, error } = await supabase
    .from('stores')
    .select(STORE_FIELDS)
    .eq('id', storeId)
    .single();

  if (error) {
    logger.error('[store-query] fetchStoreById failed', { storeId, error });
    throw error;
  }

  return mapStoreRow(data);
}

export async function fetchFirstStoreForUser(userId: string): Promise<Store | null> {
  logger.debug('[store-query] fetchFirstStoreForUser', { userId });

  const { data, error } = await supabase
    .from('stores')
    .select(STORE_FIELDS)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    logger.error('[store-query] fetchFirstStoreForUser failed', { error });
    throw error;
  }

  if (!data?.length) return null;
  return mapStoreRow(data[0]);
}
