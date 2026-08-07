/**
 * Licences digitales visibles pour l'acheteur (user_id + emails multi-boutiques).
 * Prod : pas de colonne digital_licenses.customer_id.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  getBuyerOrderCustomerIds,
  resolveBuyerCustomerIds,
} from '@/lib/customer/resolve-buyer-customer-ids';

const LICENSE_SELECT = `
  *,
  digital_product:digital_products (
    id,
    digital_type,
    product:products (
      id,
      name,
      image_url
    )
  )
`;

export type BuyerDigitalProductRef = {
  id: string;
  digital_type?: string | null;
  product?: {
    id: string;
    name: string;
    image_url: string | null;
  } | null;
};

export type BuyerDigitalLicenseRow = {
  id: string;
  license_key: string;
  license_type: string;
  status: string;
  max_activations: number;
  current_activations: number;
  issued_at: string;
  activated_at: string | null;
  expires_at: string | null;
  last_used_at: string | null;
  allow_license_transfer?: boolean | null;
  digital_product?: BuyerDigitalProductRef | null;
};

async function resolveBuyerEmails(userId: string, email?: string | null): Promise<string[]> {
  const emails = new Set<string>();
  const normalizedAuthEmail = email?.trim().toLowerCase();
  if (normalizedAuthEmail) emails.add(normalizedAuthEmail);

  const customerIds = await resolveBuyerCustomerIds({ userId, email });
  const orderCustomerIds = getBuyerOrderCustomerIds(customerIds, userId).filter(
    id => id && id !== userId
  );

  if (orderCustomerIds.length > 0) {
    const { data: customerRows } = await supabase
      .from('customers')
      .select('email')
      .in('id', orderCustomerIds);

    for (const row of customerRows ?? []) {
      const customerEmail = row.email?.trim().toLowerCase();
      if (customerEmail) emails.add(customerEmail);
    }
  }

  return Array.from(emails);
}

export async function fetchBuyerDigitalLicenses(
  userId: string,
  email?: string | null
): Promise<BuyerDigitalLicenseRow[]> {
  const buyerEmails = await resolveBuyerEmails(userId, email);
  const orFilters: string[] = [`user_id.eq.${userId}`];

  for (const buyerEmail of buyerEmails) {
    orFilters.push(`customer_email.ilike.${buyerEmail}`);
  }

  let query = supabase
    .from('digital_licenses')
    .select(LICENSE_SELECT)
    .order('created_at', { ascending: false });

  if (orFilters.length === 1) {
    query = query.eq('user_id', userId);
  } else {
    query = query.or(orFilters.join(','));
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as BuyerDigitalLicenseRow[];
}
