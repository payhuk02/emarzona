/**
 * MoneyFusion payout (retrait) — utilisé for seller refunds when payin has no refund API.
 * Doc: https://docs.moneyfusion.net/fr/payout
 */

import { moneyFusionFetch } from './moneyfusion-http.ts';

const WITHDRAW_URL = 'https://pay.moneyfusion.net/api/v1/withdraw';
const WITHDRAW_METHODS_URL = 'https://pay.moneyfusion.net/api/v1/withdraw/methods';

export function digitsOnlyPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** National MSISDN for MF withdraw (strip common WAEMU country codes). */
export function normalizeWithdrawPhone(phone: string): string {
  const digits = digitsOnlyPhone(phone);
  if (digits.startsWith('226') && digits.length >= 11) return digits.slice(3);
  if (digits.startsWith('225') && digits.length >= 12) return digits.slice(3);
  if (digits.startsWith('221') && digits.length >= 12) return digits.slice(3);
  if (digits.startsWith('0') && digits.length >= 9) return digits.slice(1);
  return digits;
}

export function inferCountryCodeFromPhone(phone: string): string {
  const digits = digitsOnlyPhone(phone);
  if (digits.startsWith('226')) return 'bf';
  if (digits.startsWith('225')) return 'ci';
  if (digits.startsWith('221')) return 'sn';
  // Default marketplace corridor
  return 'ci';
}

export function guessWithdrawMode(moyen: string | null | undefined, countryCode: string): string | null {
  const raw = String(moyen || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
  if (!raw) return null;
  if (raw.includes('-') && !raw.endsWith('-')) {
    // Already looks like orange-money-ci / mtn-bf
    if (/^(mtn|moov|wave|orange)/.test(raw)) return raw;
  }
  if (raw.includes('orange')) return `orange-money-${countryCode}`;
  if (raw.includes('mtn')) return `mtn-${countryCode}`;
  if (raw.includes('moov')) return `moov-${countryCode}`;
  if (raw.includes('wave')) return `wave-${countryCode}`;
  return null;
}

type WithdrawMethodCountry = {
  code?: string;
  paymentMethods?: Array<{ key?: string; name?: string }>;
};

export async function resolveWithdrawMode(
  moyen: string | null | undefined,
  countryCode: string,
  privateKey?: string
): Promise<string | null> {
  const guessed = guessWithdrawMode(moyen, countryCode);
  if (guessed) return guessed;

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (privateKey) headers['moneyfusion-private-key'] = privateKey;
    const res = await moneyFusionFetch(WITHDRAW_METHODS_URL, { method: 'GET', headers });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: WithdrawMethodCountry[] };
    const countries = Array.isArray(json.data) ? json.data : [];
    const country = countries.find(c => String(c.code || '').toLowerCase() === countryCode);
    const methods = country?.paymentMethods ?? [];
    const needle = String(moyen || '').toLowerCase();
    if (!needle) return methods[0]?.key ?? null;
    const match = methods.find(m => {
      const key = String(m.key || '').toLowerCase();
      const name = String(m.name || '').toLowerCase();
      return key.includes(needle) || name.includes(needle) || needle.includes(key);
    });
    return match?.key ?? methods[0]?.key ?? null;
  } catch {
    return null;
  }
}

export async function initiateMoneyFusionWithdraw(input: {
  privateKey: string;
  countryCode: string;
  phone: string;
  amount: number;
  withdrawMode: string;
  webhookUrl: string;
}): Promise<{ ok: true; tokenPay: string; message?: string } | { ok: false; message: string }> {
  const phone = normalizeWithdrawPhone(input.phone);
  if (phone.length < 8) {
    return { ok: false, message: 'Numéro client invalide pour le remboursement MoneyFusion' };
  }

  let res: Response;
  try {
    res = await moneyFusionFetch(WITHDRAW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'moneyfusion-private-key': input.privateKey,
      },
      body: JSON.stringify({
        countryCode: input.countryCode,
        phone,
        amount: Math.round(input.amount),
        withdraw_mode: input.withdrawMode,
        webhook_url: input.webhookUrl,
      }),
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }

  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = { raw: text.slice(0, 300) };
  }

  if (!res.ok || data.statut === false) {
    const message =
      (typeof data.message === 'string' && data.message) ||
      (typeof data.error === 'string' && data.error) ||
      `MoneyFusion withdraw HTTP ${res.status}`;
    return { ok: false, message };
  }

  const tokenPay = String(data.tokenPay || data.token || '').trim();
  if (!tokenPay) {
    return { ok: false, message: 'MoneyFusion withdraw sans tokenPay' };
  }

  return {
    ok: true,
    tokenPay,
    message: typeof data.message === 'string' ? data.message : undefined,
  };
}
