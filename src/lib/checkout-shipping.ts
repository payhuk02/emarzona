/**
 * Calcul des frais de livraison au checkout (physique, artiste).
 * Utilise le calculateur artiste dédié ; FedEx/mock pour le physique si adresse complète.
 */

import type { CartItem } from '@/types/cart';
import { calculateArtistShipping } from '@/lib/shipping/artist-shipping';
import { fetchCheapestCarrierShippingCost } from '@/lib/shipping/shipping-provider';
import { resolveStoreZoneShippingAmount } from '@/lib/checkout/shipping-zones';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface CheckoutShippingInput {
  country: string;
  city?: string;
  postal_code?: string;
}

const FLAT_PHYSICAL_BF = 5000;
const FLAT_PHYSICAL_INTL = 15000;

function cartMeta(item: CartItem): Record<string, unknown> {
  if (item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)) {
    return item.metadata as Record<string, unknown>;
  }
  return {};
}

function needsShipping(items: CartItem[]): boolean {
  return items.some(i => i.product_type === 'physical' || i.product_type === 'artist');
}

/**
 * Estime les frais de port pour le panier courant.
 */
export async function resolveCheckoutShippingAmount(
  items: CartItem[],
  address: CheckoutShippingInput
): Promise<number> {
  if (!needsShipping(items)) return 0;

  const country = address.country?.trim() || '';
  if (!country) return 0;

  const physicalItems = items.filter(i => i.product_type === 'physical');
  const artistItems = items.filter(i => i.product_type === 'artist');

  let total = 0;

  if (artistItems.length > 0) {
    for (const item of artistItems) {
      const meta = cartMeta(item);
      const artworkValue = item.unit_price * item.quantity;
      try {
        const quote = await calculateArtistShipping(
          item.product_id,
          {
            country,
            city: address.city,
            postal_code: address.postal_code,
          },
          artworkValue
        );
        total += quote.total_shipping;
      } catch (error) {
        logger.warn('Artist shipping fallback to flat rate', { productId: item.product_id, error });
        total += country === 'BF' ? 15000 : 35000;
      }
    }
  }

  if (physicalItems.length > 0) {
    const physicalShipping = await resolvePhysicalShippingAmount(physicalItems, address);
    total += physicalShipping;
  }

  return Math.round(total);
}

async function resolvePhysicalShippingAmount(
  items: CartItem[],
  address: CheckoutShippingInput
): Promise<number> {
  const country = address.country;
  const postalCode = address.postal_code?.trim();

  const subtotal = items.reduce(
    (sum, item) => sum + (item.unit_price - (item.discount_amount || 0)) * item.quantity,
    0
  );

  const productIds = [...new Set(items.map(i => i.product_id))];
  const { data: products } = await supabase
    .from('products')
    .select('id, store_id')
    .in('id', productIds);

  const storeByProduct = new Map((products ?? []).map(p => [p.id, p.store_id]));
  const byStore = new Map<string, CartItem[]>();
  for (const item of items) {
    const storeId = storeByProduct.get(item.product_id);
    if (!storeId) continue;
    const list = byStore.get(storeId) ?? [];
    list.push(item);
    byStore.set(storeId, list);
  }

  let zoneTotal = 0;
  let zoneApplied = false;
  for (const [storeId, storeItems] of byStore) {
    const storeSubtotal = storeItems.reduce(
      (sum, item) => sum + (item.unit_price - (item.discount_amount || 0)) * item.quantity,
      0
    );
    const zoneAmount = await resolveStoreZoneShippingAmount(
      storeId,
      storeItems,
      address,
      storeSubtotal
    );
    if (zoneAmount != null) {
      zoneTotal += zoneAmount;
      zoneApplied = true;
    }
  }
  if (zoneApplied) {
    return zoneTotal;
  }

  if (postalCode && country.length >= 2) {
    try {
      const totalWeightKg = Math.max(
        0.5,
        items.reduce((sum, item) => sum + item.quantity * 0.5, 0)
      );

      return await fetchCheapestCarrierShippingCost({
        ship_from: { country: 'BF', postal_code: '01', city: 'Ouagadougou' },
        ship_to: {
          country,
          postal_code: postalCode,
          city: address.city,
        },
        weight_kg: totalWeightKg,
      });
    } catch (error) {
      logger.warn('FedEx rate quote failed, using flat physical shipping', { error });
    }
  }

  return country === 'BF' ? FLAT_PHYSICAL_BF : FLAT_PHYSICAL_INTL;
}
