/**
 * Epic 6.4 — Évaluation risque fraude checkout
 */
import { supabase } from '@/integrations/supabase/client';

export type CheckoutFraudAssessment = {
  score: number;
  level: 'low' | 'medium' | 'high' | 'blocked';
  flags: string[];
  block: boolean;
};

export async function assessCheckoutFraudRisk(params: {
  email: string;
  amount: number;
  currency?: string;
}): Promise<CheckoutFraudAssessment> {
  const { data, error } = await supabase.rpc('assess_checkout_fraud_risk', {
    p_email: params.email,
    p_amount: params.amount,
    p_currency: params.currency ?? 'XOF',
    p_ip_hint: null,
  });

  if (error) {
    return { score: 0, level: 'low', flags: [], block: false };
  }

  const raw = (data ?? {}) as Record<string, unknown>;
  return {
    score: Number(raw.score ?? 0),
    level: (raw.level as CheckoutFraudAssessment['level']) ?? 'low',
    flags: Array.isArray(raw.flags) ? (raw.flags as string[]) : [],
    block: Boolean(raw.block),
  };
}
