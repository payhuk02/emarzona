/**
 * JSON passed to create/update_service_product_tx as p_affiliate.
 * Accepts wizard `enabled` and course-style `affiliate_enabled`.
 */

export type ServiceAffiliateInput = {
  enabled?: boolean | null;
  affiliate_enabled?: boolean | null;
  commission_rate?: number | null;
  commission_type?: string | null;
  fixed_commission_amount?: number | null;
  cookie_duration_days?: number | null;
  max_commission_per_sale?: number | null;
  min_order_amount?: number | null;
  allow_self_referral?: boolean | null;
  require_approval?: boolean | null;
  terms_and_conditions?: string | null;
};

export function isServiceAffiliateEnabled(
  input: ServiceAffiliateInput | null | undefined
): boolean {
  return Boolean(input?.enabled ?? input?.affiliate_enabled);
}

export function toServiceAffiliateRpcPayload(
  input: ServiceAffiliateInput | null | undefined,
  options?: { includeWhenDisabled?: boolean }
): Record<string, unknown> | null {
  if (!input) {
    return options?.includeWhenDisabled ? { enabled: false } : null;
  }

  const enabled = isServiceAffiliateEnabled(input);
  if (!enabled && !options?.includeWhenDisabled) return null;

  return {
    enabled,
    affiliate_enabled: enabled,
    commission_rate: input.commission_rate ?? 10,
    commission_type: input.commission_type || 'percentage',
    fixed_commission_amount: input.fixed_commission_amount ?? 0,
    cookie_duration_days: input.cookie_duration_days ?? 30,
    max_commission_per_sale: input.max_commission_per_sale ?? null,
    min_order_amount: input.min_order_amount ?? 0,
    allow_self_referral: input.allow_self_referral ?? false,
    require_approval: input.require_approval ?? false,
    terms_and_conditions: input.terms_and_conditions ?? '',
  };
}
