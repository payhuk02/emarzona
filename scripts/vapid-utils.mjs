/**
 * Utilitaires VAPID (Node) — validation clés Emarzona base64url ou JWK JSON.
 * Miroir de supabase/functions/_shared/vapid-utils.ts
 */

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = Buffer.from(base64, 'base64');
  return new Uint8Array(rawData);
}

export function uint8ArrayToBase64Url(bytes) {
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * @param {string} publicKeyBase64Url
 * @param {string} privateKeyOrJwk
 * @returns {Record<string, unknown>}
 */
export function resolveVapidPrivateJWK(publicKeyBase64Url, privateKeyOrJwk) {
  const trimmed = privateKeyOrJwk.trim();
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }

  const pubBytes = urlBase64ToUint8Array(publicKeyBase64Url);
  if (pubBytes.length !== 65 || pubBytes[0] !== 0x04) {
    throw new Error('VAPID_PUBLIC_KEY invalid: expected 65-byte uncompressed P-256 point');
  }

  const dBytes = urlBase64ToUint8Array(trimmed);
  if (dBytes.length !== 32) {
    throw new Error('VAPID_PRIVATE_KEY invalid: expected 32-byte scalar');
  }

  return {
    kty: 'EC',
    crv: 'P-256',
    x: uint8ArrayToBase64Url(pubBytes.slice(1, 33)),
    y: uint8ArrayToBase64Url(pubBytes.slice(33, 65)),
    d: uint8ArrayToBase64Url(dBytes),
    ext: true,
  };
}

/**
 * @param {string} publicKey
 * @param {string} [privateKey]
 */
export function validateVapidKeyPair(publicKey, privateKey) {
  if (!publicKey?.trim()) {
    return { ok: false, error: 'VAPID_PUBLIC_KEY missing' };
  }
  if (publicKey.trim().length < 80) {
    return { ok: false, error: 'VAPID_PUBLIC_KEY too short' };
  }
  if (!privateKey?.trim()) {
    return { ok: true, publicOnly: true };
  }
  try {
    const jwk = resolveVapidPrivateJWK(publicKey.trim(), privateKey.trim());
    if (jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.d) {
      return { ok: false, error: 'Resolved JWK is not EC P-256' };
    }
    return { ok: true, jwk: { kty: jwk.kty, crv: jwk.crv, hasPrivate: Boolean(jwk.d) } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * @param {string | undefined | null} a
 * @param {string | undefined | null} b
 */
export function vapidPublicKeysMatch(a, b) {
  if (!a?.trim() || !b?.trim()) return null;
  return a.trim() === b.trim();
}
