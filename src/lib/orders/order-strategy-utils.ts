/**
 * Types et helpers partagés pour les stratégies de commande (commerce-core).
 */
import type { Json } from '@/integrations/supabase/types';
import type { Database } from '@/integrations/supabase/types';

export interface OrderProductRecord {
  id: string;
  name: string;
  price: number;
  promotional_price?: number | null;
  currency: string;
  product_type?: string;
  payment_options?: Record<string, unknown> | Json | null;
}

export interface ShippingAddress {
  street: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface PaymentOptionsParsed {
  payment_type: string;
  percentage_rate: number;
}

export interface OrderStrategyOptions {
  shippingAddress?: ShippingAddress;
  variantId?: string;
  inventoryLocationId?: string;
  giftCardId?: string;
  giftCardAmount?: number;
  checkoutMethod?: string;
  artistProductId?: string;
  courseId?: string;
  digitalProductId?: string;
  serviceProductId?: string;
  bookingDateTime?: string;
  durationMinutes?: number;
  staffId?: string;
  numberOfParticipants?: number;
  notes?: string;
  checkoutMode?: string;
  generateLicense?: boolean;
  licenseType?: string;
  maxActivations?: number;
  licenseExpiryDays?: number;
  couponCode?: string;
  couponDiscountAmount?: number;
  promotionId?: string;
}

export type OrderItemExtendedInsert = Database['public']['Tables']['order_items']['Insert'] & {
  physical_product_id?: string | null;
  digital_product_id?: string | null;
  service_product_id?: string | null;
  variant_id?: string | null;
  license_id?: string | null;
  booking_id?: string | null;
  item_metadata?: Json | Record<string, unknown> | null;
};

export type OrderItemExtendedRow = Database['public']['Tables']['order_items']['Row'] & {
  physical_product_id?: string | null;
  digital_product_id?: string | null;
  service_product_id?: string | null;
  variant_id?: string | null;
  license_id?: string | null;
  booking_id?: string | null;
  item_metadata?: Record<string, unknown> | null;
};

export function asOrderProduct(
  record: OrderProductRecord | Record<string, unknown>
): OrderProductRecord {
  const r = record as Record<string, unknown>;
  const promo =
    r.promotional_price != null && r.promotional_price !== '' ? Number(r.promotional_price) : null;
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    price: Number(r.price ?? 0),
    promotional_price: promo != null && !Number.isNaN(promo) ? promo : null,
    currency: String(r.currency ?? 'XOF'),
    product_type: r.product_type != null ? String(r.product_type) : undefined,
    payment_options: r.payment_options as OrderProductRecord['payment_options'],
  };
}

export function resolveUnitPrice(product: OrderProductRecord): number {
  return product.promotional_price ?? product.price;
}

export function parsePaymentOptions(
  raw: OrderProductRecord['payment_options']
): PaymentOptionsParsed {
  const opts =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    payment_type: String(opts.payment_type ?? 'full'),
    percentage_rate: Number(opts.percentage_rate ?? 30),
  };
}

export function asString(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  return String(value);
}

export function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isNaN(n) ? fallback : n;
  }
  return fallback;
}

export function asOptionalString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value);
  return s || undefined;
}

export function parseShippingAddress(raw: unknown): ShippingAddress {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Adresse de livraison invalide');
  }
  const a = raw as Record<string, unknown>;
  return {
    street: asString(a.street),
    city: asString(a.city),
    postal_code: asString(a.postal_code),
    country: asString(a.country),
  };
}

export function parseStrategyOptions(
  raw?: Record<string, unknown> | OrderStrategyOptions
): OrderStrategyOptions {
  if (!raw) return {};
  return raw as OrderStrategyOptions;
}

export function toOrderItemInsert(row: OrderItemExtendedInsert) {
  return row as Database['public']['Tables']['order_items']['Insert'];
}

export function asOrdersInsert(
  row: Database['public']['Tables']['orders']['Insert'] & { customer_email?: string }
): Database['public']['Tables']['orders']['Insert'] {
  return row as Database['public']['Tables']['orders']['Insert'];
}

export function getPromotionValidationError(
  validation:
    | { valid: true; promotion: { discountAmount: number; promotionId: string } }
    | { valid: false; message: string }
): string | null {
  if ('message' in validation) return validation.message;
  return null;
}
