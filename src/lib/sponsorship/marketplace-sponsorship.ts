import { supabase } from '@/integrations/supabase/client';
import { initiateBillingCheckout } from '@/lib/billing/initiate-billing-payment';
import { logger } from '@/lib/logger';

export type SponsorshipSource = 'plan_entitlement' | 'paid_boost' | 'admin_grant';
export type SponsorshipStatus = 'pending_payment' | 'active' | 'expired' | 'cancelled' | 'rejected';

export type SponsorshipSku = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  duration_days: number;
  price_cents: number;
  currency: string;
  placement: string;
  is_active: boolean;
  sort_order: number;
};

export type MarketplaceSponsorship = {
  id: string;
  store_id: string;
  product_id: string;
  sku_id: string | null;
  source: SponsorshipSource;
  status: SponsorshipStatus;
  starts_at: string | null;
  ends_at: string | null;
  amount_paid_cents: number | null;
  currency: string | null;
  payment_ref: string | null;
  created_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export async function fetchSponsorshipSkus(): Promise<SponsorshipSku[]> {
  const { data, error } = await supabase
    .from('marketplace_sponsorship_products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as SponsorshipSku[];
}

export async function fetchStoreSponsorships(storeId: string): Promise<MarketplaceSponsorship[]> {
  const { data, error } = await supabase
    .from('marketplace_sponsorships')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as MarketplaceSponsorship[];
}

export async function fetchPlanSponsorQuota(storeId: string): Promise<number> {
  const { data, error } = await supabase.rpc('marketplace_sponsor_plan_quota', {
    p_store_id: storeId,
  });
  if (error) {
    logger.warn('marketplace_sponsor_plan_quota failed', { error, storeId });
    return 0;
  }
  return Number(data ?? 0);
}

export async function createPlanSponsorship(productId: string): Promise<MarketplaceSponsorship> {
  const { data, error } = await supabase.rpc('create_plan_sponsorship', {
    p_product_id: productId,
  });
  if (error) throw error;
  return data as MarketplaceSponsorship;
}

export async function createPaidSponsorship(
  productId: string,
  skuSlug: string
): Promise<MarketplaceSponsorship> {
  const { data, error } = await supabase.rpc('create_paid_sponsorship', {
    p_product_id: productId,
    p_sku_slug: skuSlug,
  });
  if (error) throw error;
  return data as MarketplaceSponsorship;
}

/** Platform admin: activate sponsorship immediately without payment. */
export async function adminGrantSponsorship(
  productId: string,
  skuSlug: string
): Promise<MarketplaceSponsorship> {
  const { data, error } = await supabase.rpc('admin_grant_marketplace_sponsorship', {
    p_product_id: productId,
    p_sku_slug: skuSlug,
  });
  if (error) throw error;
  return data as MarketplaceSponsorship;
}

export async function cancelSponsorship(sponsorshipId: string): Promise<MarketplaceSponsorship> {
  const { data, error } = await supabase.rpc('cancel_marketplace_sponsorship', {
    p_sponsorship_id: sponsorshipId,
  });
  if (error) throw error;
  return data as MarketplaceSponsorship;
}

export async function recordSponsorshipEvent(
  sponsorshipId: string,
  eventType: 'impression' | 'click' | 'purchase',
  meta: Record<string, unknown> = {}
): Promise<void> {
  const { error } = await supabase.rpc('record_sponsorship_event', {
    p_sponsorship_id: sponsorshipId,
    p_event_type: eventType,
    p_meta: meta,
  });
  if (error) {
    logger.debug('record_sponsorship_event failed', { error, sponsorshipId, eventType });
  }
}

export async function checkoutPaidSponsorship(options: {
  storeId: string;
  sponsorship: MarketplaceSponsorship;
  sku: SponsorshipSku;
  customerEmail: string;
  customerName?: string;
}): Promise<string> {
  const amount = options.sku.price_cents / 100;
  return initiateBillingCheckout({
    storeId: options.storeId,
    amount,
    currency: options.sku.currency,
    description: `Sponsorisation Marketplace — ${options.sku.name}`,
    customerEmail: options.customerEmail,
    customerName: options.customerName,
    purpose: 'marketplace_sponsorship',
    planSlug: options.sku.slug,
    sponsorshipId: options.sponsorship.id,
    returnPath: '/dashboard/sponsorships',
    successQuery: { sponsorship_id: options.sponsorship.id },
  });
}
