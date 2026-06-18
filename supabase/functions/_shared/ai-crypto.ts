/**
 * Chiffrement AES-GCM pour clés API (edge functions uniquement).
 */
const ENC_VERSION = 'v1';

function getMasterKey(): Uint8Array {
  const secret =
    Deno.env.get('AI_KEYS_ENCRYPTION_SECRET') ||
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
    'emarzona-ai-keys-fallback-change-me';
  const bytes = new TextEncoder().encode(secret);
  const key = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    key[i] = bytes[i % bytes.length] ^ bytes[(i * 7) % bytes.length];
  }
  return key;
}

async function importKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', getMasterKey(), { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function encryptApiKey(plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importKey();
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain)
  );
  const ivB64 = btoa(String.fromCharCode(...iv));
  const ctB64 = btoa(String.fromCharCode(...new Uint8Array(cipher)));
  return `${ENC_VERSION}:${ivB64}:${ctB64}`;
}

export async function decryptApiKey(payload: string): Promise<string> {
  const [version, ivB64, ctB64] = payload.split(':');
  if (version !== ENC_VERSION || !ivB64 || !ctB64) {
    throw new Error('Format de clé chiffrée invalide');
  }
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));
  const key = await importKey();
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(plain);
}

export function keyHint(plain: string): string {
  const t = plain.trim();
  if (t.length <= 4) return '****';
  return `…${t.slice(-4)}`;
}
