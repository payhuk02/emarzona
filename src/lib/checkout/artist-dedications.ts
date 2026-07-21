/**
 * Persistance des dédicaces artiste après création de commande.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { CartItem } from '@/types/cart';

export type CartDedicationPayload = {
  dedication_text: string;
  recipient_name?: string;
  font_style?: 'standard' | 'elegant' | 'casual' | 'formal';
  text_position?: 'top' | 'center' | 'bottom';
  notes?: string;
};

function readDedicationFromItem(item: CartItem): CartDedicationPayload | null {
  const metadata =
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : null;

  const dedication = metadata?.dedication;
  if (!dedication || typeof dedication !== 'object' || Array.isArray(dedication)) {
    return null;
  }

  const row = dedication as Record<string, unknown>;
  const text = typeof row.dedication_text === 'string' ? row.dedication_text.trim() : '';
  if (!text) return null;

  return {
    dedication_text: text,
    recipient_name: typeof row.recipient_name === 'string' ? row.recipient_name : undefined,
    font_style:
      row.font_style === 'standard' ||
      row.font_style === 'elegant' ||
      row.font_style === 'casual' ||
      row.font_style === 'formal'
        ? row.font_style
        : 'standard',
    text_position:
      row.text_position === 'top' ||
      row.text_position === 'center' ||
      row.text_position === 'bottom'
        ? row.text_position
        : 'center',
    notes: typeof row.notes === 'string' ? row.notes : undefined,
  };
}

function readArtistProductId(item: CartItem): string | null {
  const metadata =
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : null;

  const artistProductId = metadata?.artist_product_id;
  return typeof artistProductId === 'string' ? artistProductId : null;
}

export async function persistArtistDedication(
  orderId: string,
  params: {
    artistProductId: string;
    productId: string;
    dedication: CartDedicationPayload;
  }
): Promise<void> {
  const { error } = await supabase.from('artist_product_dedications').insert({
    artist_product_id: params.artistProductId,
    product_id: params.productId,
    order_id: orderId,
    dedication_text: params.dedication.dedication_text,
    recipient_name: params.dedication.recipient_name ?? null,
    font_style: params.dedication.font_style ?? 'standard',
    text_position: params.dedication.text_position ?? 'center',
    notes: params.dedication.notes ?? null,
    status: 'pending',
  });

  if (error) {
    logger.error('Failed to persist artist dedication', {
      orderId,
      productId: params.productId,
      error,
    });
  }
}

export async function persistArtistDedicationsFromCartItems(
  orderId: string,
  items: CartItem[]
): Promise<void> {
  for (const item of items) {
    if (item.product_type !== 'artist') continue;

    const dedication = readDedicationFromItem(item);
    const artistProductId = readArtistProductId(item);
    if (!dedication || !artistProductId) continue;

    const { error } = await supabase.from('artist_product_dedications').insert({
      artist_product_id: artistProductId,
      product_id: item.product_id,
      order_id: orderId,
      dedication_text: dedication.dedication_text,
      recipient_name: dedication.recipient_name ?? null,
      font_style: dedication.font_style ?? 'standard',
      text_position: dedication.text_position ?? 'center',
      notes: dedication.notes ?? null,
      status: 'pending',
    });

    if (error) {
      logger.error('Failed to persist artist dedication', {
        orderId,
        productId: item.product_id,
        error,
      });
    }
  }
}

export function cartHasArtistDedications(items: CartItem[]): boolean {
  return items.some(item => item.product_type === 'artist' && readDedicationFromItem(item) != null);
}

export function getCartDedicationPreview(item: CartItem): CartDedicationPayload | null {
  return readDedicationFromItem(item);
}
