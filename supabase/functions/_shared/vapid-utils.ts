/**
 * Conversion clés VAPID Emarzona (base64url) → JWK pour @pushforge/builder.
 * Accepte aussi VAPID_PRIVATE_KEY déjà au format JWK JSON (PushForge CLI).
 */

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function resolveVapidPrivateJWK(
  publicKeyBase64Url: string,
  privateKeyOrJwk: string
): JsonWebKey {
  const trimmed = privateKeyOrJwk.trim();
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed) as JsonWebKey;
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
