/**
 * Regroupement panier par boutique (checkout multi-vendeurs).
 */

import { getCartItemStoreId } from '@/lib/checkout/cart-validation';
import type { CartItem } from '@/types/cart';

export interface CartStoreGroup {
  storeId: string | null;
  storeName?: string;
  storeSlug?: string;
  items: CartItem[];
}

function cartMeta(item: CartItem): Record<string, unknown> {
  if (item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)) {
    return item.metadata as Record<string, unknown>;
  }
  return {};
}

function readMetaString(meta: Record<string, unknown>, key: string): string | undefined {
  const value = meta[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function getCartItemStoreName(item: CartItem): string | undefined {
  const meta = cartMeta(item);
  return readMetaString(meta, 'store_name') ?? readMetaString(meta, 'storeName');
}

export function getCartItemStorePlaceholder(item: CartItem): string | undefined {
  const meta = cartMeta(item);
  return (
    readMetaString(meta, 'store_placeholder_image_url') ??
    readMetaString(meta, 'storePlaceholderImageUrl')
  );
}

export function getCartItemStoreSlug(item: CartItem): string | undefined {
  const meta = cartMeta(item);
  return readMetaString(meta, 'store_slug') ?? readMetaString(meta, 'storeSlug');
}

export function groupCartItemsByStore(items: CartItem[]): CartStoreGroup[] {
  const groups = new Map<string, CartStoreGroup>();
  const unknownKey = '__unknown__';

  for (const item of items) {
    const storeId = getCartItemStoreId(item);
    const key = storeId ?? unknownKey;

    if (!groups.has(key)) {
      groups.set(key, {
        storeId,
        storeName: getCartItemStoreName(item),
        storeSlug: getCartItemStoreSlug(item),
        items: [],
      });
    }

    const group = groups.get(key)!;
    group.items.push(item);
    if (!group.storeName) {
      group.storeName = getCartItemStoreName(item);
    }
    if (!group.storeSlug) {
      group.storeSlug = getCartItemStoreSlug(item);
    }
  }

  return Array.from(groups.values());
}

export function isMultiStoreCart(items: CartItem[]): boolean {
  const storeIds = items.map(getCartItemStoreId).filter((id): id is string => Boolean(id));
  return new Set(storeIds).size > 1;
}
