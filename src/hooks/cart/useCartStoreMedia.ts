import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCartItemStoreId } from '@/lib/checkout/cart-validation';
import type { CartItem } from '@/types/cart';

export type CartStoreMedia = {
  storeId: string;
  storeName?: string;
  storeSlug?: string;
  placeholderImageUrl?: string | null;
};

function readMetaString(meta: Record<string, unknown>, key: string): string | undefined {
  const value = meta[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function itemMeta(item: CartItem): Record<string, unknown> {
  if (item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)) {
    return item.metadata as Record<string, unknown>;
  }
  return {};
}

export function resolveCartItemPlaceholderFromMetadata(item: CartItem): string | null {
  const meta = itemMeta(item);
  return (
    readMetaString(meta, 'store_placeholder_image_url') ??
    readMetaString(meta, 'storePlaceholderImageUrl') ??
    null
  );
}

export function useCartStoreMedia(items: CartItem[]) {
  const storeIds = useMemo(() => {
    const ids = items.map(getCartItemStoreId).filter((id): id is string => Boolean(id));
    return [...new Set(ids)];
  }, [items]);

  return useQuery({
    queryKey: ['cart-store-media', storeIds],
    enabled: storeIds.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Map<string, CartStoreMedia>> => {
      if (storeIds.length === 0) return new Map();

      const { data, error } = await supabase
        .from('stores_public')
        .select('id, name, slug, placeholder_image_url')
        .in('id', storeIds);

      if (error) throw error;

      const map = new Map<string, CartStoreMedia>();
      for (const row of data ?? []) {
        map.set(row.id, {
          storeId: row.id,
          storeName: row.name ?? undefined,
          storeSlug: row.slug ?? undefined,
          placeholderImageUrl: row.placeholder_image_url,
        });
      }
      return map;
    },
  });
}

export function resolveCartItemPlaceholder(
  item: CartItem,
  storeMedia: Map<string, CartStoreMedia> | undefined
): string | null {
  const fromMeta = resolveCartItemPlaceholderFromMetadata(item);
  if (fromMeta) return fromMeta;

  const storeId = getCartItemStoreId(item);
  if (!storeId || !storeMedia) return null;
  return storeMedia.get(storeId)?.placeholderImageUrl ?? null;
}
