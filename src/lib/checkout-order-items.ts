/**
 * Construction des lignes order_items depuis le panier (checkout unifié).
 * Aligné sur validate_order_item_product_type (Supabase).
 */

import { supabase } from '@/integrations/supabase/client';
import type { CartItem } from '@/types/cart';
import { validateCheckoutCart } from '@/lib/checkout/cart-validation';
import { resolveCheckoutCartItemsAsync } from '@/lib/checkout/resolve-checkout-cart';

function cartMetadata(item: CartItem): Record<string, unknown> {
  if (item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)) {
    return item.metadata as Record<string, unknown>;
  }
  return {};
}

/** Métadonnées JSONB + champs spécialisés pour triggers (cours, artiste, digital, service). */
export function orderItemInsertExtras(item: CartItem): {
  item_metadata?: Record<string, unknown>;
  digital_product_id?: string;
  physical_product_id?: string;
  service_product_id?: string;
  booking_id?: string;
} {
  const meta = cartMetadata(item);

  if (item.product_type === 'course') {
    const courseId = meta.course_id ?? meta.courseId;
    return {
      item_metadata: {
        ...meta,
        ...(courseId != null ? { course_id: courseId } : {}),
        auto_enroll: true,
      },
    };
  }

  if (item.product_type === 'artist') {
    const artistProductId = meta.artist_product_id ?? meta.artistProductId;
    return {
      item_metadata: {
        ...meta,
        ...(artistProductId != null ? { artist_product_id: artistProductId } : {}),
      },
    };
  }

  if (item.product_type === 'digital') {
    const digitalProductId = meta.digital_product_id ?? meta.digitalProductId;
    return {
      ...(typeof digitalProductId === 'string' ? { digital_product_id: digitalProductId } : {}),
      item_metadata: {
        ...meta,
        ...(typeof digitalProductId === 'string' ? { digital_product_id: digitalProductId } : {}),
        auto_generate_license: meta.auto_generate_license ?? true,
      },
    };
  }

  if (item.product_type === 'physical') {
    const physicalProductId = meta.physical_product_id ?? meta.physicalProductId;
    return typeof physicalProductId === 'string' ? { physical_product_id: physicalProductId } : {};
  }

  if (item.product_type === 'service') {
    const bookingId = meta.booking_id ?? meta.service_booking_id;
    const serviceProductId = meta.service_product_id ?? meta.serviceProductId;
    const scheduledAt = meta.scheduled_at ?? meta.booking_date;
    return {
      ...(typeof bookingId === 'string' ? { booking_id: bookingId } : {}),
      ...(typeof serviceProductId === 'string' ? { service_product_id: serviceProductId } : {}),
      item_metadata: {
        ...meta,
        ...(typeof bookingId === 'string' ? { booking_id: bookingId } : {}),
        ...(typeof serviceProductId === 'string' ? { service_product_id: serviceProductId } : {}),
        ...(scheduledAt != null ? { scheduled_at: scheduledAt } : {}),
      },
    };
  }

  return {};
}

export type OrderItemInsertRow = {
  order_id: string;
  product_id: string;
  product_type: CartItem['product_type'];
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variant_id?: string | null;
  item_metadata?: Record<string, unknown>;
  digital_product_id?: string;
  physical_product_id?: string;
  service_product_id?: string;
  booking_id?: string;
};

/** DB test E2E : schéma order_items minimal (sans item_metadata ni FKs étendues). */
export function stripOrderItemForE2EInsert(row: OrderItemInsertRow): OrderItemInsertRow {
  if (!(import.meta.env.DEV && import.meta.env.VITE_E2E_PAYMENT_STUB === 'true')) {
    return row;
  }
  const stripped: OrderItemInsertRow = {
    order_id: row.order_id,
    product_id: row.product_id,
    product_type: row.product_type,
    product_name: row.product_name,
    quantity: row.quantity,
    unit_price: row.unit_price,
    total_price: row.total_price,
  };
  if (row.variant_id != null) stripped.variant_id = row.variant_id;
  return stripped;
}

function buildOrderItemRowsSync(orderId: string, items: CartItem[]): OrderItemInsertRow[] {
  return items.map(item => {
    const extras = orderItemInsertExtras(item);
    return {
      order_id: orderId,
      product_id: item.product_id,
      product_type: item.product_type,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: (item.unit_price - (item.discount_amount || 0)) * item.quantity,
      variant_id: item.variant_id ?? null,
      ...extras,
    };
  });
}

/** Complète digital_product_id / physical_product_id si absents du metadata panier. */
export async function buildOrderItemRows(
  orderId: string,
  items: CartItem[]
): Promise<OrderItemInsertRow[]> {
  const { validation } = await resolveCheckoutCartItemsAsync(items);
  if (!validation.canCheckout) {
    throw new Error(validation.message ?? 'Panier incompatible avec le checkout unifié');
  }

  const rows = buildOrderItemRowsSync(orderId, validation.checkoutItems);

  await Promise.all(
    rows.map(async (row, index) => {
      const item = validation.checkoutItems[index];
      if (item.product_type === 'physical' && !row.physical_product_id) {
        const { data } = await supabase
          .from('physical_products')
          .select('id')
          .eq('product_id', item.product_id)
          .maybeSingle();
        if (data?.id) row.physical_product_id = data.id;
      }
      if (item.product_type === 'digital' && !row.digital_product_id) {
        const { data } = await supabase
          .from('digital_products')
          .select('id')
          .eq('product_id', item.product_id)
          .maybeSingle();
        if (data?.id) {
          row.digital_product_id = data.id;
          row.item_metadata = {
            ...row.item_metadata,
            digital_product_id: data.id,
            auto_generate_license: true,
          };
        }
      }
      if (item.product_type === 'service') {
        const meta = cartMetadata(item);
        const bookingId = meta.booking_id ?? meta.service_booking_id;
        if (typeof bookingId === 'string' && !row.booking_id) {
          row.booking_id = bookingId;
        }
        if (!row.service_product_id) {
          const fromMeta = meta.service_product_id ?? meta.serviceProductId;
          if (typeof fromMeta === 'string') {
            row.service_product_id = fromMeta;
          } else {
            const { data } = await supabase
              .from('service_products')
              .select('id')
              .eq('product_id', item.product_id)
              .maybeSingle();
            if (data?.id) row.service_product_id = data.id;
          }
        }
        if (row.item_metadata && typeof bookingId === 'string' && !row.item_metadata.booking_id) {
          row.item_metadata = { ...row.item_metadata, booking_id: bookingId };
        }
      }
      if (item.product_type === 'artist' && row.item_metadata) {
        const meta = cartMetadata(item);
        const artistProductId = meta.artist_product_id ?? meta.artistProductId;
        if (artistProductId && !row.item_metadata.artist_product_id) {
          row.item_metadata = {
            ...row.item_metadata,
            artist_product_id: artistProductId,
          };
        } else if (!row.item_metadata.artist_product_id) {
          const { data } = await supabase
            .from('artist_products')
            .select('id')
            .eq('product_id', item.product_id)
            .maybeSingle();
          if (data?.id) {
            row.item_metadata = { ...row.item_metadata, artist_product_id: data.id };
          }
        }
      }
    })
  );

  const isE2eStub = import.meta.env.DEV && import.meta.env.VITE_E2E_PAYMENT_STUB === 'true';

  if (!isE2eStub) {
    const missingPhysical = rows.some(r => r.product_type === 'physical' && !r.physical_product_id);
    const missingDigital = rows.some(r => r.product_type === 'digital' && !r.digital_product_id);
    const missingService = rows.some(
      r => r.product_type === 'service' && (!r.service_product_id || !r.booking_id)
    );
    if (missingPhysical || missingDigital || missingService) {
      throw new Error(
        'Certains articles du panier sont incomplets. Retirez-les et ajoutez-les à nouveau depuis la fiche produit.'
      );
    }
  }

  return isE2eStub ? rows.map(stripOrderItemForE2EInsert) : rows;
}
