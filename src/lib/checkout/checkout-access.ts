/**
 * Guest checkout session helpers (Epic 1.4).
 * Orders receive a one-time `checkout_token` in metadata at insert time.
 */

export function extractCheckoutToken(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }
  const token = (metadata as Record<string, unknown>).checkout_token;
  return typeof token === 'string' && token.length > 0 ? token : undefined;
}

export function withCheckoutTokenMetadata(
  metadata: Record<string, unknown> | undefined,
  checkoutToken?: string
): Record<string, unknown> {
  if (!checkoutToken) {
    return metadata ?? {};
  }
  return {
    ...(metadata ?? {}),
    checkout_token: checkoutToken,
  };
}
