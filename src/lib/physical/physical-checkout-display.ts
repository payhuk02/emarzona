import {
  DEFAULT_PHYSICAL_CHECKOUT_METHOD,
  DEFAULT_PHYSICAL_CTA_LABEL,
  PHYSICAL_CHECKOUT_METHOD_LABELS,
  type PhysicalCheckoutMethod,
} from '@/constants/physical-checkout-options';
import type { PhysicalProductPaymentOptions } from '@/types/physical-product';

export type ParsedPhysicalCheckoutOptions = {
  checkout_method: PhysicalCheckoutMethod;
  checkout_method_label: string;
  cta_button_label: string;
  payment_type: PhysicalProductPaymentOptions['payment_type'];
  percentage_rate: number;
};

function parsePaymentOptionsRaw(
  raw: PhysicalProductPaymentOptions | string | null | undefined
): PhysicalProductPaymentOptions | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as PhysicalProductPaymentOptions;
    } catch {
      return null;
    }
  }
  return raw;
}

export function parsePhysicalCheckoutOptions(
  paymentOptions?: PhysicalProductPaymentOptions | string | null,
  payment?: Partial<PhysicalProductPaymentOptions> | null
): ParsedPhysicalCheckoutOptions {
  const parsed = parsePaymentOptionsRaw(paymentOptions) ?? payment ?? {};
  const checkoutMethod =
    parsed.checkout_method === 'cash_on_delivery' ? 'cash_on_delivery' : 'online';

  return {
    checkout_method: checkoutMethod,
    checkout_method_label: PHYSICAL_CHECKOUT_METHOD_LABELS[checkoutMethod],
    cta_button_label: parsed.cta_button_label?.trim() || DEFAULT_PHYSICAL_CTA_LABEL,
    payment_type: parsed.payment_type ?? 'full',
    percentage_rate: parsed.percentage_rate ?? 30,
  };
}

export function buildPhysicalPaymentOptions(
  input: Partial<PhysicalProductPaymentOptions>
): PhysicalProductPaymentOptions {
  return {
    checkout_method:
      input.checkout_method === 'cash_on_delivery'
        ? 'cash_on_delivery'
        : DEFAULT_PHYSICAL_CHECKOUT_METHOD,
    cta_button_label: input.cta_button_label?.trim() || DEFAULT_PHYSICAL_CTA_LABEL,
    payment_type: input.payment_type ?? 'full',
    percentage_rate: input.percentage_rate ?? 30,
    min_percentage: input.min_percentage,
  };
}
