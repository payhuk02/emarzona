/**
 * Journal observabilité audit œuvre (table artist_fulfillment_events).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type ArtistFulfillmentSeverity = 'info' | 'warn' | 'error';

export interface ArtistFulfillmentEventInput {
  event_type: string;
  severity?: ArtistFulfillmentSeverity;
  order_id?: string;
  product_id?: string;
  artist_product_id?: string;
  auction_id?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export async function logArtistFulfillmentEvent(
  supabase: SupabaseClient,
  event: ArtistFulfillmentEventInput
): Promise<void> {
  try {
    const { error } = await supabase.rpc('log_artist_fulfillment_event', {
      p_event_type: event.event_type,
      p_severity: event.severity ?? 'info',
      p_order_id: event.order_id ?? null,
      p_product_id: event.product_id ?? null,
      p_artist_product_id: event.artist_product_id ?? null,
      p_auction_id: event.auction_id ?? null,
      p_message: event.message ?? null,
      p_metadata: event.metadata ?? {},
    });

    if (error) {
      console.error('log_artist_fulfillment_event:', error.message, event.event_type);
    }
  } catch (err) {
    console.error('logArtistFulfillmentEvent:', err);
  }
}
