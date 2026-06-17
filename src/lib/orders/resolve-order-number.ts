/**
 * Numéro de commande à partir de `generate_order_number()`.
 * Fallback : TEST-ORDER-* en E2E (check constraint DB test), sinon ORD-*.
 */
export function resolveOrderNumber(
  rpcResult: unknown,
  rpcError?: unknown | null,
  options?: { suffix?: string }
): string {
  const candidate = typeof rpcResult === 'string' ? rpcResult.trim() : '';
  if (!rpcError && candidate) {
    return candidate;
  }

  const prefix =
    import.meta.env.DEV && import.meta.env.VITE_E2E_PAYMENT_STUB === 'true' ? 'TEST-ORDER' : 'ORD';
  const base = `${prefix}-${Date.now()}`;
  return options?.suffix ? `${base}-${options.suffix}` : base;
}
