const textEncoder = new TextEncoder();

function hexFromBuffer(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function normalizeSignature(signature: string): string {
  return signature.trim().toLowerCase();
}

export function extractProviderSignature(rawSignature: string): string {
  const normalized = rawSignature.trim();
  // Stripe-like format: t=123,v1=<hex>,v0=<hex>
  const v1Part = normalized
    .split(',')
    .map(part => part.trim())
    .find(part => part.startsWith('v1='));
  if (v1Part) return v1Part.replace('v1=', '').trim();

  // Flutterwave often prefixes with sha256=
  if (normalized.startsWith('sha256=')) {
    return normalized.replace('sha256=', '').trim();
  }

  return normalized;
}

export async function verifyHmacSha256Signature(
  payload: string,
  rawSignature: string,
  secret: string
): Promise<boolean> {
  if (!payload || !rawSignature || !secret) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, textEncoder.encode(payload));
  const expectedHex = hexFromBuffer(signatureBuffer);
  const providedHex = extractProviderSignature(rawSignature);

  return constantTimeEquals(normalizeSignature(expectedHex), normalizeSignature(providedHex));
}
