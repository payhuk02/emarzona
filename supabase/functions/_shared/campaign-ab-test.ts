/**
 * A/B test helpers for campaign sends
 */
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';
import type { MarketingTemplate } from './resend-send-utils.ts';

export interface ABVariantConfig {
  name?: string;
  subject?: string;
  template_id?: string;
  send_percentage?: number;
}

export interface ActiveABTest {
  id: string;
  variant_a: ABVariantConfig;
  variant_b: ABVariantConfig;
}

export function pickABVariant(
  email: string,
  campaignId: string,
  variantAPercent: number
): 'variant_a' | 'variant_b' {
  const pct = Math.min(100, Math.max(0, variantAPercent));
  let hash = 0;
  const key = `${campaignId}:${email.trim().toLowerCase()}`;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % 100 < pct ? 'variant_a' : 'variant_b';
}

export async function getActiveABTestForCampaign(
  supabase: SupabaseClient,
  campaignId: string
): Promise<ActiveABTest | null> {
  const { data, error } = await supabase
    .from('email_ab_tests')
    .select('id, variant_a, variant_b')
    .eq('campaign_id', campaignId)
    .is('winner', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('getActiveABTestForCampaign:', error.message);
    return null;
  }

  return {
    id: data.id,
    variant_a: (data.variant_a || {}) as ABVariantConfig,
    variant_b: (data.variant_b || {}) as ABVariantConfig,
  };
}

export async function incrementABTestSent(
  supabase: SupabaseClient,
  abTestId: string,
  variant: 'variant_a' | 'variant_b'
): Promise<void> {
  const column = variant === 'variant_a' ? 'variant_a_results' : 'variant_b_results';
  const { data: row } = await supabase
    .from('email_ab_tests')
    .select(column)
    .eq('id', abTestId)
    .single();

  if (!row) return;

  const current = (row[column] as Record<string, number>) || {};
  const next = {
    sent: (current.sent || 0) + 1,
    delivered: current.delivered || 0,
    opened: current.opened || 0,
    clicked: current.clicked || 0,
    revenue: current.revenue || 0,
  };

  await supabase
    .from('email_ab_tests')
    .update({ [column]: next, updated_at: new Date().toISOString() })
    .eq('id', abTestId);
}

export function applySubjectOverride(
  template: MarketingTemplate,
  subjectOverride: string,
  language = 'fr'
): MarketingTemplate {
  return {
    ...template,
    subject: {
      ...template.subject,
      [language]: subjectOverride,
      fr: subjectOverride,
    },
  };
}
