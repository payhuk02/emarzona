/**
 * Génération de clés VAPID (Web Push) — module partagé.
 */
import { webcrypto } from 'node:crypto';

function toBase64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function generateVapidKeyPair() {
  const keyPair = await webcrypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );

  const publicJwk = await webcrypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateJwk = await webcrypto.subtle.exportKey('jwk', keyPair.privateKey);

  if (!publicJwk.x || !publicJwk.y || !privateJwk.d) {
    throw new Error('Failed to export VAPID keys');
  }

  const publicKey = toBase64Url(
    Buffer.concat([
      Buffer.from([0x04]),
      Buffer.from(publicJwk.x, 'base64url'),
      Buffer.from(publicJwk.y, 'base64url'),
    ])
  );

  return { publicKey, privateKey: privateJwk.d };
}
