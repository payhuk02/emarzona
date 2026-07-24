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

/** Operator family from seller form values (orange_money, mtn_mobile_money, …). */
export function operatorFamily(moyen: string | null | undefined): string | null {
  const raw = String(moyen || '')
    .toLowerCase()
    .replace(/_/g, '-')
    .trim();
  if (!raw) return null;
  if (raw.includes('orange')) return 'orange';
  if (raw.includes('mtn')) return 'mtn';
  if (raw.includes('moov')) return 'moov';
  if (raw.includes('wave')) return 'wave';
  if (raw.includes('free')) return 'free';
  if (raw.includes('t-money') || raw.includes('tmoney') || raw === 't_money') return 't-money';
  return null;
}

/**
 * MoneyFusion withdraw_mode keys are NOT always `{op}-{iso}`.
 * BF → orange-money-burkina (not orange-money-bf). Prefer live /withdraw/methods.
 */
const MF_WITHDRAW_MODE_FALLBACK: Record<string, Partial<Record<string, string>>> = {
  ci: {
    orange: 'orange-money-ci',
    mtn: 'mtn-ci',
    moov: 'moov-ci',
    wave: 'wave-ci',
  },
  bf: {
    orange: 'orange-money-burkina',
    moov: 'moov-burkina-faso',
  },
  bj: {
    mtn: 'mtn-benin',
    moov: 'moov-benin',
  },
  tg: {
    't-money': 't-money-togo',
  },
  sn: {
    orange: 'orange-money-sn',
    wave: 'wave-sn',
    free: 'free-money-sn',
  },
  ml: {
    orange: 'orange-money-mali',
    moov: 'moov-ml',
  },
};

export function guessWithdrawMode(moyen: string | null | undefined, countryCode: string): string | null {
  const cc = String(countryCode || '')
    .toLowerCase()
    .trim();
  const raw = String(moyen || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-');
  if (!raw) return null;

  // Full MF key already (orange-money-burkina, mtn-ci, …) — keep unless known-bad ISO suffix
  if (/^(orange-money|mtn|moov|wave|free-money|t-money|airtel)(-[a-z0-9]+)+$/.test(raw)) {
    const badIso = /-(bf|bj|tg|ml)$/.test(raw) && !/(burkina|benin|togo|mali)/.test(raw);
    if (!badIso) return raw;
  }

  const family = operatorFamily(raw);
  if (!family) return null;
  const mapped = MF_WITHDRAW_MODE_FALLBACK[cc]?.[family];
  if (mapped) return mapped;

  // CI-style fallback only when we have no explicit map entry
  if (cc === 'ci') {
    if (family === 'orange') return 'orange-money-ci';
    if (family === 'mtn') return 'mtn-ci';
    if (family === 'moov') return 'moov-ci';
    if (family === 'wave') return 'wave-ci';
  }
  return null;
}

type WithdrawMethodCountry = {
  code?: string;
  paymentMethods?: Array<{ key?: string; name?: string }>;
};

async function fetchWithdrawMethods(privateKey?: string): Promise<WithdrawMethodCountry[]> {
  let res: Response | null = null;
  if (privateKey) {
    res = await fetchViaWithdrawProxy({ action: 'methods', privateKey });
  }
  if (!res) {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (privateKey) headers['moneyfusion-private-key'] = privateKey;
    res = await moneyFusionFetch(WITHDRAW_METHODS_URL, { method: 'GET', headers });
  }
  if (!res?.ok) return [];
  const json = (await res.json()) as { data?: WithdrawMethodCountry[] };
  return Array.isArray(json.data) ? json.data : [];
}

function matchMethodKey(
  methods: Array<{ key?: string; name?: string }>,
  moyen: string | null | undefined
): string | null {
  if (!methods.length) return null;
  const family = operatorFamily(moyen);
  const needle = String(moyen || '')
    .toLowerCase()
    .replace(/_/g, '-');
  if (family) {
    const byFamily = methods.find(m => {
      const key = String(m.key || '').toLowerCase();
      const name = String(m.name || '').toLowerCase();
      return key.includes(family) || name.includes(family);
    });
    if (byFamily?.key) return byFamily.key;
  }
  if (needle) {
    const match = methods.find(m => {
      const key = String(m.key || '').toLowerCase();
      const name = String(m.name || '').toLowerCase();
      return key.includes(needle) || name.includes(needle) || needle.includes(key);
    });
    if (match?.key) return match.key;
  }
  return methods[0]?.key ?? null;
}

export async function resolveWithdrawMode(
  moyen: string | null | undefined,
  countryCode: string,
  privateKey?: string
): Promise<string | null> {
  const cc = String(countryCode || '')
    .toLowerCase()
    .trim();

  // Prefer live MF catalog — ISO guesses are wrong for BF/BJ/TG/…
  try {
    const countries = await fetchWithdrawMethods(privateKey);
    const country = countries.find(c => String(c.code || '').toLowerCase() === cc);
    const methods = country?.paymentMethods ?? [];
    const fromApi = matchMethodKey(methods, moyen);
    if (fromApi) return fromApi;
  } catch {
    /* fall through to static map */
  }

  return guessWithdrawMode(moyen, cc);
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
