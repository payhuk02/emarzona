#!/usr/bin/env node
/**
 * Génère une paire de clés VAPID pour Web Push.
 * Usage: node scripts/generate-vapid-keys.mjs
 */
import { webcrypto } from 'node:crypto';

function toBase64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function generateVapidKeys() {
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

  const privateKey = privateJwk.d;

  console.log('# Ajoutez à Vercel (.env production + preview):');
  console.log(`VITE_VAPID_PUBLIC_KEY=${publicKey}`);
  console.log('');
  console.log('# Ajoutez à Supabase Edge Functions secrets:');
  console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
}

generateVapidKeys().catch(err => {
  console.error(err);
  process.exit(1);
});
