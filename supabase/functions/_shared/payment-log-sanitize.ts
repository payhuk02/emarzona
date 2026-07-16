/** Redact PII from payment edge function logs */

export function maskEmail(email?: string | null): string | undefined {
  if (!email || typeof email !== 'string') return undefined;
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  if (at < 2) return '***@***';
  return `${trimmed.slice(0, 2)}***${trimmed.slice(at)}`;
}

export function sanitizeGeniusPayRequestLog(
  data: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!data) return {};
  return {
    actionKeys: Object.keys(data),
    amount: data.amount,
    currency: data.currency,
    hasDescription: !!data.description,
    customerEmailMasked: maskEmail(
      typeof data.customer_email === 'string' ? data.customer_email : undefined
    ),
    hasCustomerName: !!data.customer_name,
    metadataKeys:
      data.metadata && typeof data.metadata === 'object'
        ? Object.keys(data.metadata as object)
        : [],
    hasProductId: !!data.productId,
    hasStoreId: !!data.storeId,
  };
}

export function sanitizeGeniusPayApiResponseLog(
  status: number,
  isJson: boolean
): Record<string, unknown> {
  return { status, isJson };
}

/** Safe subset for payment_webhook_events.payload and transactions.last_webhook_payload */
export function sanitizePaymentWebhookPayload(
  provider: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    provider,
    event_type: payload.event_type ?? payload.type ?? null,
    id: payload.id ?? null,
    status: payload.status ?? payload.payment_status ?? null,
  };

  const amount = payload.amount as { value?: string; currency_code?: string } | undefined;
  if (amount?.value != null) {
    base.amount = amount.value;
    base.currency = amount.currency_code ?? null;
  } else if (payload.amount_total != null) {
    base.amount_total = payload.amount_total;
    base.currency = payload.currency ?? null;
  } else if (payload.amount != null) {
    base.amount = payload.amount;
    base.currency = payload.currency ?? null;
  }

  if (payload.metadata && typeof payload.metadata === 'object') {
    base.metadata_keys = Object.keys(payload.metadata as object);
  }

  return base;
}

export function extractPayPalCaptureAmount(
  resource: Record<string, unknown>
): { amount: number; currency: string } | null {
  const amount = resource.amount as { value?: string; currency_code?: string } | undefined;
  if (!amount?.value) return null;
  const parsed = parseFloat(amount.value);
  if (!Number.isFinite(parsed)) return null;
  return { amount: parsed, currency: amount.currency_code ?? 'USD' };
}
