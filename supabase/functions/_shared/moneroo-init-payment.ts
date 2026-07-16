/**
 * Shared GeniusPay payment initialization for platform subscription renewals.
 * GeniusPay has no native recurring/mandate API — we reuse stored customer profile.
 */

const GENIUSPAY_METADATA_MAX_ITEMS = 10;
const GENIUSPAY_METADATA_PRIORITY = [
  'transaction_id',
  'store_id',
  'purpose',
  'plan_slug',
  'invoice_id',
  'product_id',
  'order_id',
  'userId',
  'order_number',
  'productType',
];

const COUNTRY_DIAL_CODES: Record<string, string> = {
  'burkina faso': '226',
  burkina: '226',
  "côte d'ivoire": '225',
  "cote d'ivoire": '225',
  'ivory coast': '225',
  senegal: '221',
  mali: '223',
  benin: '229',
  togo: '228',
  niger: '227',
  ghana: '233',
  nigeria: '234',
  cameroun: '237',
  cameroon: '237',
};

export function normalizePhoneForGeniusPay(phone: string, country?: string): string {
  const cleaned = phone.trim().replace(/\s/g, '');
  if (!cleaned) return cleaned;

  if (/^\+[1-9]\d{6,14}$/.test(cleaned)) {
    return cleaned;
  }

  const digits = cleaned.replace(/\D/g, '');
  const localDigits = digits.startsWith('0') ? digits.slice(1) : digits;
  const dialCode = COUNTRY_DIAL_CODES[(country || 'burkina faso').toLowerCase().trim()] || '226';

  if (localDigits.length >= 7) {
    return `+${dialCode}${localDigits}`;
  }

  return cleaned.startsWith('+') ? cleaned : `+${dialCode}${localDigits}`;
}

export function sanitizeGeniusPayMetadata(raw: Record<string, unknown>): Record<string, string> {
  const metadata: Record<string, string> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (value === null || value === undefined || value === '') continue;

    if (typeof value === 'string') {
      metadata[key] = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      metadata[key] = String(value);
    } else if (typeof value === 'object') {
      try {
        metadata[key] = JSON.stringify(value);
      } catch {
        // skip unserializable values
      }
    }
  }

  return metadata;
}

export function limitGeniusPayMetadata(metadata: Record<string, string>): Record<string, string> {
  const limited: Record<string, string> = {};

  for (const key of GENIUSPAY_METADATA_PRIORITY) {
    if (metadata[key] !== undefined) {
      limited[key] = metadata[key];
    }
    if (Object.keys(limited).length >= GENIUSPAY_METADATA_MAX_ITEMS) {
      return limited;
    }
  }

  for (const [key, value] of Object.entries(metadata)) {
    if (limited[key] !== undefined) continue;
    limited[key] = value;
    if (Object.keys(limited).length >= GENIUSPAY_METADATA_MAX_ITEMS) break;
  }

  return limited;
}

export function splitCustomerName(
  customerName: string,
  customerEmail?: string
): {
  firstName: string;
  lastName: string;
} {
  let name = customerName.trim();

  if (!name && customerEmail) {
    name = customerEmail.split('@')[0] || 'Client';
  }
  if (!name) name = 'Client';

  const parts = name.split(' ').filter(p => p.trim().length > 0);

  if (parts.length === 0) {
    return { firstName: 'Client', lastName: 'GeniusPay' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: 'Client' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

export interface InitializeGeniusPayPaymentInput {
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerCountry?: string | null;
  returnUrl: string;
  cancelUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export interface InitializeGeniusPayPaymentResult {
  checkoutUrl: string;
  geniuspayPaymentId: string | null;
  rawResponse: Record<string, unknown>;
}

export async function initializeGeniusPayPayment(
  apiKey: string,
  apiUrl: string,
  input: InitializeGeniusPayPaymentInput
): Promise<InitializeGeniusPayPaymentResult> {
  const { firstName, lastName } = splitCustomerName(input.customerName ?? '', input.customerEmail);

  const metadata = limitGeniusPayMetadata(sanitizeGeniusPayMetadata(input.metadata ?? {}));

  const customerPhone = input.customerPhone
    ? normalizePhoneForGeniusPay(input.customerPhone, input.customerCountry ?? undefined)
    : undefined;

  const body = {
    amount: Math.round(input.amount),
    currency: input.currency.toUpperCase(),
    description: input.description,
    customer: {
      email: input.customerEmail,
      first_name: firstName.trim() || 'Client',
      last_name: lastName.trim() || 'Client',
      ...(customerPhone && { phone: customerPhone }),
    },
    return_url: input.returnUrl,
    ...(input.cancelUrl && { cancel_url: input.cancelUrl }),
    metadata,
  };

  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/payments/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  let responseData: Record<string, unknown> = {};

  try {
    responseData = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(`GeniusPay API returned non-JSON response (${response.status})`);
  }

  if (!response.ok) {
    const message =
      (responseData.message as string | undefined) ||
      (responseData.error as string | undefined) ||
      `GeniusPay API error ${response.status}`;
    throw new Error(message);
  }

  const nested = (responseData.data as Record<string, unknown> | undefined) ?? responseData;
  const checkoutUrl =
    (nested.checkout_url as string | undefined) ||
    (nested.checkoutUrl as string | undefined) ||
    null;
  const geniuspayPaymentId =
    (nested.id as string | undefined) || (nested.transaction_id as string | undefined) || null;

  if (!checkoutUrl) {
    throw new Error('GeniusPay response missing checkout_url');
  }

  return {
    checkoutUrl,
    geniuspayPaymentId,
    rawResponse: responseData,
  };
}
