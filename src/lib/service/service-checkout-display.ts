import {
  DEFAULT_SERVICE_CTA_LABEL,
  isServiceCtaButtonPreset,
} from '@/constants/service-checkout-options';

export type ServiceCheckoutPaymentOptions = {
  payment_type?: string;
  percentage_rate?: number;
  cta_button_label?: string;
  use_project_milestones?: boolean;
  project_milestones?: unknown[];
  [key: string]: unknown;
};

export type ParsedServiceCheckoutOptions = {
  cta_button_label: string;
};

function parsePaymentOptionsObject(
  paymentOptions?: ServiceCheckoutPaymentOptions | string | null
): ServiceCheckoutPaymentOptions | null {
  if (!paymentOptions) return null;
  if (typeof paymentOptions === 'string') {
    try {
      const parsed = JSON.parse(paymentOptions) as ServiceCheckoutPaymentOptions;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }
  return paymentOptions;
}

export function parseServiceCheckoutOptions(
  paymentOptions?: ServiceCheckoutPaymentOptions | string | null
): ParsedServiceCheckoutOptions {
  const parsed = parsePaymentOptionsObject(paymentOptions);
  const rawLabel = parsed?.cta_button_label?.trim();

  if (rawLabel && rawLabel.length > 0) {
    return { cta_button_label: rawLabel.slice(0, 40) };
  }

  return { cta_button_label: DEFAULT_SERVICE_CTA_LABEL };
}

export function normalizeServiceCtaButtonLabel(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_SERVICE_CTA_LABEL;
  const trimmed = value.trim().slice(0, 40);
  return trimmed.length > 0 ? trimmed : DEFAULT_SERVICE_CTA_LABEL;
}

export function isKnownServiceCtaPreset(value: string): boolean {
  return isServiceCtaButtonPreset(value);
}
