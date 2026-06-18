import type { CartItem } from '@/types/cart';

export const CART_PRODUCT_TYPE_LABELS: Record<string, string> = {
  digital: 'Digital',
  physical: 'Physique',
  service: 'Service',
  course: 'Cours',
  artist: 'Artiste',
};

export function getCartProductTypeLabel(productType: string): string {
  return CART_PRODUCT_TYPE_LABELS[productType] ?? productType;
}

export function summarizeCartProductTypes(
  items: CartItem[]
): Array<{ type: string; label: string; count: number }> {
  const counts = new Map<string, number>();

  items.forEach(item => {
    counts.set(item.product_type, (counts.get(item.product_type) ?? 0) + 1);
  });

  return Array.from(counts.entries()).map(([type, count]) => ({
    type,
    label: getCartProductTypeLabel(type),
    count,
  }));
}

export function countDistinctCartProductTypes(items: CartItem[]): number {
  return new Set(items.map(item => item.product_type)).size;
}
