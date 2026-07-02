#!/usr/bin/env node
/**
 * Génère une paire de clés VAPID pour Web Push.
 * Usage: node scripts/generate-vapid-keys.mjs
 */
import { generateVapidKeyPair } from './vapid-keygen.mjs';

async function main() {
  const { publicKey, privateKey } = await generateVapidKeyPair();
  console.log('# Ajoutez à Vercel (.env production + preview):');
  console.log(`VITE_VAPID_PUBLIC_KEY=${publicKey}`);
  console.log('');
  console.log('# Ajoutez à Supabase Edge Functions secrets:');
  console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
  console.log('');
  console.log('# Ou automatique : npm run setup:vapid-secrets');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
