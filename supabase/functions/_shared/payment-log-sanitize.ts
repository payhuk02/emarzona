/** Redact PII from payment edge function logs */

export function maskEmail(email?: string | null): string | undefined {
  if (!email || typeof email !== 'string') return undefined;
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  if (at < 2) return '***@***';
  return `${trimmed.slice(0, 2)}***${trimmed.slice(at)}`;
}

export function sanitizeMonerooRequestLog(
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

export function sanitizeMonerooApiResponseLog(
  status: number,
  isJson: boolean
): Record<string, unknown> {
  return { status, isJson };
}
