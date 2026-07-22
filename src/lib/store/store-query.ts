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

export const STORE_FIELDS = `id, user_id, name, slug, subdomain, description, default_currency, custom_domain, domain_status, domain_verification_token, domain_verified_at, domain_error_message, info_message, info_message_color, info_message_font, metadata, commerce_type, created_at, updated_at, marketing_content, legal_pages, meta_title, meta_description, meta_keywords, og_title, og_description, og_image, seo_draft, marketing_content_draft, legal_pages_draft, seo_published_at, marketing_published_at, legal_published_at, ${STORE_APPEARANCE_EMBED_SELECT}`;

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

const fetchWithTimeout = async <T>(promise: Promise<T>, ms: number = 8000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Supabase request timeout')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

export async function fetchStoreById(userId: string, storeId: string): Promise<Store | null> {
  logger.debug('[store-query] fetchStoreById', { userId, storeId });

  try {
    // Embed store_appearance hors schéma types.ts → cast pour éviter TS2589
    const query = (
      supabase.from('stores') as unknown as {
        select: (columns: string) => {
          eq: (
            column: string,
            value: string
          ) => {
            single: () => Promise<{ data: Record<string, unknown> | null; error: Error | null }>;
          };
        };
      }
    )
      .select(STORE_FIELDS)
      .eq('id', storeId)
      .single();

    const { data, error } = await fetchWithTimeout(query, 8000);

    if (error) {
      logger.error('[store-query] fetchStoreById failed', { storeId, error });
      throw error;
    }

    return mapStoreRow(data);
  } catch (err) {
    logger.error('[store-query] fetchStoreById exception', { storeId, err });
    throw err;
  }
}

export async function fetchFirstStoreForUser(userId: string): Promise<Store | null> {
  logger.debug('[store-query] fetchFirstStoreForUser', { userId });

  try {
    const query = (
      supabase.from('stores') as unknown as {
        select: (columns: string) => {
          eq: (
            column: string,
            value: string
          ) => {
            order: (
              column: string,
              opts: { ascending: boolean }
            ) => {
              limit: (
                count: number
              ) => Promise<{ data: Record<string, unknown>[] | null; error: Error | null }>;
            };
          };
        };
      }
    )
      .select(STORE_FIELDS)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1);

    const { data, error } = await fetchWithTimeout(query, 8000);

    if (error) {
      logger.error('[store-query] fetchFirstStoreForUser failed', { error });
      throw error;
    }

    if (!data?.length) return null;
    return mapStoreRow(data[0]);
  } catch (err) {
    logger.error('[store-query] fetchFirstStoreForUser exception', { err });
    throw err;
  }
}
