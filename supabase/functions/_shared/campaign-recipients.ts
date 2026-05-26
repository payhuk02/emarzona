/**
 * Résolution des destinataires de campagnes email
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

export interface CampaignRecipient {
  email: string;
  name?: string;
  user_id?: string;
}

interface CampaignAudience {
  id: string;
  store_id: string;
  audience_type: string;
  segment_id?: string | null;
  audience_filters?: Record<string, unknown>;
}

function formatCustomerName(customer: {
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  full_name?: string | null;
  email?: string;
}): string | undefined {
  if (customer.full_name) return customer.full_name;
  if (customer.name) return customer.name;
  const combined = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
  return combined || undefined;
}

function mapCustomerRow(customer: {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  full_name?: string | null;
}): CampaignRecipient {
  return {
    email: customer.email,
    name: formatCustomerName(customer),
    user_id: customer.id,
  };
}

async function getStoreCustomersBatch(
  supabase: SupabaseClient,
  storeId: string,
  offset: number,
  limit: number
): Promise<CampaignRecipient[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('id, email, first_name, last_name, name, full_name')
    .eq('store_id', storeId)
    .not('email', 'is', null)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    console.error('getStoreCustomersBatch error:', error?.message);
    return [];
  }

  return data.filter(c => c.email).map(mapCustomerRow);
}

async function getSegmentRecipients(
  supabase: SupabaseClient,
  segmentId: string,
  storeId: string,
  offset: number,
  limit: number
): Promise<CampaignRecipient[]> {
  const { data: segment, error: segmentError } = await supabase
    .from('email_segments')
    .select('id, type, criteria, store_id')
    .eq('id', segmentId)
    .single();

  if (segmentError || !segment) {
    console.error('Segment not found:', segmentId, segmentError?.message);
    return [];
  }

  if (segment.type === 'dynamic') {
    const { data: members, error: rpcError } = await supabase.rpc(
      'calculate_dynamic_segment_members',
      { p_segment_id: segmentId }
    );

    if (rpcError) {
      console.error('calculate_dynamic_segment_members error:', rpcError.message);
      return [];
    }

    const slice = (members || []).slice(offset, offset + limit);
    const recipients: CampaignRecipient[] = [];

    for (const member of slice) {
      if (!member.email) continue;
      recipients.push({
        email: member.email,
        user_id: member.user_id || undefined,
        name: undefined,
      });
    }

    if (recipients.length > 0 && recipients.some(r => !r.name && r.user_id)) {
      const ids = recipients.map(r => r.user_id).filter(Boolean) as string[];
      if (ids.length > 0) {
        const { data: customers } = await supabase
          .from('customers')
          .select('id, email, first_name, last_name, name, full_name')
          .in('id', ids);
        const byId = new Map((customers || []).map(c => [c.id, c]));
        for (const r of recipients) {
          if (r.user_id && byId.has(r.user_id)) {
            r.name = formatCustomerName(byId.get(r.user_id)!);
          }
        }
      }
    }

    return recipients;
  }

  const criteria = (segment.criteria || {}) as Record<string, unknown>;
  const customerIds = criteria.customer_ids as string[] | undefined;

  if (customerIds?.length) {
    const slice = customerIds.slice(offset, offset + limit);
    const { data: customers } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name, name, full_name')
      .eq('store_id', storeId)
      .in('id', slice)
      .not('email', 'is', null);

    return (customers || []).map(mapCustomerRow);
  }

  return getStoreCustomersBatch(supabase, storeId, offset, limit);
}

async function getFilteredCustomersBatch(
  supabase: SupabaseClient,
  campaign: CampaignAudience,
  offset: number,
  limit: number
): Promise<CampaignRecipient[]> {
  const filters = campaign.audience_filters || {};

  if (filters.has_purchased === true) {
    const { data: orders } = await supabase
      .from('orders')
      .select('customer_id')
      .eq('store_id', campaign.store_id)
      .eq('payment_status', 'paid')
      .not('customer_id', 'is', null);

    const uniqueIds = [
      ...new Set((orders || []).map(o => o.customer_id).filter(Boolean) as string[]),
    ];
    const slice = uniqueIds.slice(offset, offset + limit);
    if (slice.length === 0) return [];

    const { data: customers } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name, name, full_name')
      .in('id', slice)
      .not('email', 'is', null);

    return (customers || []).map(mapCustomerRow);
  }

  return getStoreCustomersBatch(supabase, campaign.store_id, offset, limit);
}

export async function getCampaignRecipients(
  supabase: SupabaseClient,
  campaign: CampaignAudience,
  batchSize = 100,
  batchIndex = 0
): Promise<CampaignRecipient[]> {
  const offset = batchIndex * batchSize;

  switch (campaign.audience_type) {
    case 'segment':
      if (!campaign.segment_id) return [];
      return getSegmentRecipients(
        supabase,
        campaign.segment_id,
        campaign.store_id,
        offset,
        batchSize
      );
    case 'filter':
      return getFilteredCustomersBatch(supabase, campaign, offset, batchSize);
    case 'list':
    default:
      return getStoreCustomersBatch(supabase, campaign.store_id, offset, batchSize);
  }
}
