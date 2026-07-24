/**
 * MoneyFusion payout (retrait) — used for seller refunds when payin has no refund API.
 * Doc: https://docs.moneyfusion.net/fr/payout
 *
 * Prefer Vercel /api/moneyfusion-withdraw so MoneyFusion sees Vercel egress IP
 * (Supabase Edge IP is often not whitelisted → "Adresse IP server non autorisée").
 */

import { moneyFusionFetch } from './moneyfusion-http.ts';

const WITHDRAW_URL = 'https://pay.moneyfusion.net/api/v1/withdraw';
const WITHDRAW_METHODS_URL = 'https://pay.moneyfusion.net/api/v1/withdraw/methods';

function siteBase(): string {
  return (Deno.env.get('SITE_URL') || 'https://www.emarzona.com').trim().replace(/\/$/, '');
}

function internalSecret(): string {
  return (Deno.env.get('EDGE_INTERNAL_SECRET') || Deno.env.get('CRON_SECRET') || '').trim();
}

function withdrawProxyBase(): string | null {
  const explicit = (Deno.env.get('MONEYFUSION_WITHDRAW_PROXY_URL') || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  return `${siteBase()}/api/moneyfusion-withdraw`;
}

async function fetchViaWithdrawProxy(input: {
  action: 'withdraw' | 'methods';
  privateKey: string;
  payload?: Record<string, unknown>;
}): Promise<Response | null> {
  const base = withdrawProxyBase();
  const secret = internalSecret();
  if (!base || !secret) return null;

  try {
    const proxied = await fetch(base, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-internal-secret': secret,
      },
      body: JSON.stringify({
        action: input.action,
        privateKey: input.privateKey,
        ...(input.payload ? { payload: input.payload } : {}),
      }),
    });

    if (proxied.status === 404 || proxied.status === 405) {
      console.warn('[MoneyFusion] withdraw proxy not available', proxied.status);
      return null;
    }
    if (proxied.status === 401 || proxied.status === 403) {
      console.warn(
        '[MoneyFusion] withdraw proxy unauthorized — check EDGE_INTERNAL_SECRET on Vercel; falling back to direct'
      );
      return null;
    }

    const text = await proxied.text();
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = text ? (JSON.parse(text) as Record<string, unknown>) : null;
    } catch {
      parsed = null;
    }
    const proxyErr =
      parsed &&
      typeof parsed.error === 'string' &&
      (parsed.error === 'Unauthorized' ||
        parsed.error === 'MoneyFusion withdraw proxy failed' ||
        String(parsed.error).includes('proxy'));

    if (proxyErr && proxied.status >= 400) {
      console.warn('[MoneyFusion] withdraw proxy error envelope, falling back to direct', {
        status: proxied.status,
        error: parsed?.error,
      });
      return null;
    }

    return new Response(text, {
      status: proxied.status,
      headers: {
        'Content-Type': proxied.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (err) {
    console.warn('[MoneyFusion] withdraw proxy failed, falling back to direct', err);
    return null;
  }
}

/** Enrichit le message MF « IP non autorisée » (retrait = API KEY, pas l’app payin). */
export function formatMoneyFusionIpError(message: string): string {
  const ipMatch = message.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
  if (!/ip|autoris/i.test(message) || !ipMatch) return message;
  const ip = ipMatch[1];
  return (
    `${message}. Emarzona sort bien via ${ip} (Fixie pin). Si cette IP est déjà dans API KEY → Adresses IP : ` +
    `(1) supprimez-la puis re-ajoutez-la, (2) mettez aussi ${ip} dans API de Paiement → Modifier Emarzona, ` +
    `(3) ajoutez la 2ᵉ IP Fixie 54.217.142.99, (4) sinon régénérez la clé API et mettez à jour MONEYFUSION_PRIVATE_KEY. ` +
    `0.0.0.0 est refusé. Contactez le support MoneyFusion si ça persiste (clé valide mais IP refusée).`
  );
}

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
    let res: Response | null = null;
    if (privateKey) {
      res = await fetchViaWithdrawProxy({ action: 'methods', privateKey });
    }
    if (!res) {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (privateKey) headers['moneyfusion-private-key'] = privateKey;
      res = await moneyFusionFetch(WITHDRAW_METHODS_URL, { method: 'GET', headers });
    }
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

  const payload = {
    countryCode: input.countryCode,
    phone,
    amount: Math.round(input.amount),
    withdraw_mode: input.withdrawMode,
    webhook_url: input.webhookUrl,
  };

  let res: Response;
  try {
    // Never call MF withdraw directly from Edge: that uses a different egress IP
    // and breaks MoneyFusion whitelist (Vercel IPs ≠ Supabase IPs).
    const proxied = await fetchViaWithdrawProxy({
      action: 'withdraw',
      privateKey: input.privateKey,
      payload,
    });
    if (!proxied) {
      return {
        ok: false,
        message:
          'Proxy retrait MoneyFusion indisponible. Vérifiez /api/moneyfusion-withdraw sur Vercel et EDGE_INTERNAL_SECRET.',
      };
    }
    res = proxied;
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
    const raw =
      (typeof data.message === 'string' && data.message) ||
      (typeof data.error === 'string' && data.error) ||
      `MoneyFusion withdraw HTTP ${res.status}`;
    return { ok: false, message: formatMoneyFusionIpError(raw) };
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
