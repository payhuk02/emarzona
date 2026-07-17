/**
 * Hash stable pour clés de rate-limit auth (email → clé opaque, sans PII en logs).
 */
export function hashAuthIdentifier(identifier: string): string {
  const normalized = identifier.trim().toLowerCase();
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 33) ^ normalized.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

export function buildAuthRateLimitEndpoint(authAction: string, identifier: string): string {
  return `auth:${authAction}:${hashAuthIdentifier(identifier)}`;
}
