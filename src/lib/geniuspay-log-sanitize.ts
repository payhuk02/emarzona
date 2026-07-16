/**
 * Redaction PII / secrets for GeniusPay client logs and DB audit payloads.
 */
import type { Json } from '@/integrations/supabase/types';

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function maskEmail(email?: string | null): string | undefined {
  if (!email || typeof email !== 'string') return undefined;
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  if (at < 2) return '***@***';
  return `${trimmed.slice(0, 2)}***${trimmed.slice(at)}`;
}

export function maskPhone(phone?: string | null): string | undefined {
  if (!phone || typeof phone !== 'string') return undefined;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***${digits.slice(-4)}`;
}

export function sanitizeGeniusPayCheckoutLog(data: {
  amount?: number;
  currency?: string;
  description?: string;
  customer_email?: string;
  customer_name?: string;
  return_url?: string;
  cancel_url?: string;
  metadata?: Record<string, unknown>;
  productId?: string;
  storeId?: string;
  orderId?: string;
}): Record<string, unknown> {
  return {
    amount: data.amount,
    currency: data.currency,
    hasDescription: !!data.description,
    customerEmailMasked: maskEmail(data.customer_email),
    hasCustomerName: !!data.customer_name,
    hasReturnUrl: !!data.return_url,
    hasCancelUrl: !!data.cancel_url,
    metadataKeys: data.metadata ? Object.keys(data.metadata) : [],
    hasProductId: !!data.productId,
    hasStoreId: !!data.storeId,
    hasOrderId: !!data.orderId,
  };
}

export function sanitizeGeniusPayApiResponse(response: unknown): Record<string, unknown> | null {
  if (!response || typeof response !== 'object') {
    return { hasResponse: !!response };
  }
  const r = response as Record<string, unknown>;
  const nested = r.data as Record<string, unknown> | undefined;
  return {
    hasData: !!nested,
    transactionId: nested?.id ?? nested?.transaction_id ?? null,
    hasCheckoutUrl: !!(nested?.checkout_url ?? r.checkout_url),
    message: typeof r.message === 'string' ? r.message.slice(0, 120) : undefined,
  };
}

/** Safe JSON for transaction_logs (no raw customer PII). */
export function sanitizePaymentOptionsForAudit(options: Record<string, unknown>): Json {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options)) {
    if (key === 'customerEmail' || key === 'customer_email') {
      out[key] = maskEmail(String(value));
      continue;
    }
    if (key === 'customerPhone' || key === 'customer_phone') {
      out[key] = maskPhone(String(value));
      continue;
    }
    if (key === 'customerName' || key === 'customer_name') {
      out[key] = value ? '[redacted]' : value;
      continue;
    }
    if (key === 'metadata' && value && typeof value === 'object') {
      out.metadataKeys = Object.keys(value as object);
      continue;
    }
    if (typeof value === 'string' && EMAIL_RE.test(value)) {
      out[key] = value.replace(EMAIL_RE, m => maskEmail(m) ?? '***');
      continue;
    }
    out[key] = value;
  }
  return out as Json;
}
