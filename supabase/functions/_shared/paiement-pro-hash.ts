/**
 * Hash + helpers Paiement Pro (Edge Deno — node:crypto).
 */
import { createHash } from 'node:crypto';

export function md5Hex(input: string): string {
  return createHash('md5').update(input, 'utf8').digest('hex');
}

export async function verifyPaiementProHashcode(params: {
  hashcode: string;
  secretKey: string;
  merchantId: string;
  referenceNumber: string;
  amount: string | number;
  customerId?: string;
  transactiondt?: string;
}): Promise<{ ok: boolean; matchedFormula?: string }> {
  const hash = String(params.hashcode || '').trim().toLowerCase();
  if (!hash || !params.secretKey) return { ok: false };

  const merchantId = String(params.merchantId || '');
  const referenceNumber = String(params.referenceNumber || '');
  const amount = String(params.amount ?? '');
  const customerId = String(params.customerId || '');
  const transactiondt = String(params.transactiondt || '');
  const secret = params.secretKey;

  const candidates: Array<[string, string]> = [
    ['merchant+ref+amount+secret', `${merchantId}${referenceNumber}${amount}${secret}`],
    ['amount+ref+secret', `${amount}${referenceNumber}${secret}`],
    ['ref+amount+secret', `${referenceNumber}${amount}${secret}`],
    ['merchant+amount+ref+secret', `${merchantId}${amount}${referenceNumber}${secret}`],
    [
      'merchant+ref+amount+customer+secret',
      `${merchantId}${referenceNumber}${amount}${customerId}${secret}`,
    ],
    [
      'merchant+ref+amount+dt+secret',
      `${merchantId}${referenceNumber}${amount}${transactiondt}${secret}`,
    ],
  ];

  for (const [name, raw] of candidates) {
    if (md5Hex(raw).toLowerCase() === hash) return { ok: true, matchedFormula: name };
  }
  return { ok: false };
}

export function isPaiementProSuccessCode(responsecode: unknown): boolean {
  const c = String(responsecode ?? '').trim();
  return c === '0' || c === '00' || c.toLowerCase() === 'success';
}

export const PAIEMENT_PRO_CURRENCY_XOF = '952';

export function currencyToPaiementProCode(currency: string): string {
  const c = currency.toUpperCase();
  if (c === 'XOF' || c === 'XAF') return PAIEMENT_PRO_CURRENCY_XOF;
  return PAIEMENT_PRO_CURRENCY_XOF;
}

export function getPaiementProInitUrl(): string {
  const explicit = (Deno.env.get('PAIEMENT_PRO_API_URL') || '').trim();
  if (explicit.startsWith('https://')) return explicit;
  const mode = (Deno.env.get('PAIEMENT_PRO_MODE') || 'live').toLowerCase();
  if (mode === 'sandbox' || mode === 'test') {
    return 'https://sandbox.paiementpro.net/webservice/onlinepayment/init/curl-init.php';
  }
  return 'https://www.paiementpro.net/webservice/onlinepayment/init/curl-init.php';
}

export function getPaiementProCredentials(): { merchantId: string; secretKey: string } {
  const merchantId = (
    Deno.env.get('PAIEMENT_PRO_MERCHANT_ID') ||
    Deno.env.get('ID_MARCHAND') ||
    ''
  ).trim();
  const secretKey = (Deno.env.get('PAIEMENT_PRO_SECRET_KEY') || Deno.env.get('SECRET_KEY') || '').trim();
  return { merchantId, secretKey };
}
