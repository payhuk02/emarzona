import type { SupabaseClient } from '@supabase/supabase-js';
import { buildWhatsAppClickUrl } from './whatsapp-url.ts';
import { generateGuestCustomerMagicLink } from './guest-customer-magic-link.ts';
import { createSupabaseAdmin } from './supabase-admin.ts';

type AddressLike = Record<string, unknown> | string | null | undefined;

function asAddressObject(value: AddressLike): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? { formatted: trimmed } : null;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function formatShippingAddress(order: Record<string, unknown>, item: Record<string, unknown>): string {
  const itemMeta = (item.item_metadata as Record<string, unknown> | null) ?? {};
  const orderMeta = (order.metadata as Record<string, unknown> | null) ?? {};

  const candidates: AddressLike[] = [
    order.shipping_address as AddressLike,
    itemMeta.shipping_address as AddressLike,
    orderMeta.shipping_address as AddressLike,
    (order.customer as Record<string, unknown> | undefined)?.address as AddressLike,
  ];

  for (const candidate of candidates) {
    const address = asAddressObject(candidate);
    if (!address) continue;

    if (typeof address.formatted === 'string' && address.formatted.trim()) {
      return address.formatted.trim();
    }

    const parts = [
      address.full_name,
      address.name,
      address.address,
      address.address_line1,
      address.line1,
      address.address_line2,
      address.line2,
      address.city,
      address.postal_code,
      address.zip,
      address.country,
    ]
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      .map(part => part.trim());

    if (parts.length > 0) return parts.join(', ');
  }

  return 'Non spécifiée';
}

export function formatOrderDateTime(
  createdAt: string | null | undefined,
  locale = 'fr-FR',
  timeZone = 'Africa/Abidjan'
): string {
  if (!createdAt) return '—';
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone,
    }).format(new Date(createdAt));
  } catch {
    return new Date(createdAt).toLocaleString(locale);
  }
}

export async function resolvePhysicalWhatsAppLink(
  supabase: SupabaseClient,
  options: {
    productId: string;
    productName: string;
    orderNumber: string;
  }
): Promise<string | null> {
  const { data: physicalProduct } = await supabase
    .from('physical_products')
    .select('whatsapp_number, whatsapp_enabled')
    .eq('product_id', options.productId)
    .maybeSingle();

  if (!physicalProduct?.whatsapp_enabled || !physicalProduct.whatsapp_number?.trim()) {
    return null;
  }

  const { data: config } = await supabase.rpc('get_public_whatsapp_config');
  const whatsappConfig = (config as { enabled?: boolean; click_url_base?: string } | null) ?? {};
  if (whatsappConfig.enabled === false) return null;

  return buildWhatsAppClickUrl(
    whatsappConfig.click_url_base ?? 'https://wa.me',
    physicalProduct.whatsapp_number,
    `Bonjour, je viens de passer commande pour « ${options.productName} » (commande ${options.orderNumber}).`
  );
}

export async function resolveCustomerPortalLink(
  _supabase: SupabaseClient,
  options: {
    email: string;
    siteUrl: string;
    productType?: string | null;
  }
): Promise<string | null> {
  const admin = createSupabaseAdmin();
  return generateGuestCustomerMagicLink(admin, {
    email: options.email,
    productType: options.productType ?? 'physical',
    siteUrl: options.siteUrl,
  });
}
