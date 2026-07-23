/**
 * MoneyFusion HTTPS helper.
 * MF cert often fails Deno peer-name validation from Supabase Edge
 * (NotValidForName). Prefer Vercel proxies under /api/moneyfusion-*.
 */

const MF_INSECURE_HOSTS = [
  'www.pay.moneyfusion.net',
  'pay.moneyfusion.net',
  'api.moneyfusion.net',
  'payin.moneyfusion.net',
];

function siteBase(): string {
  return (Deno.env.get('SITE_URL') || 'https://www.emarzona.com').trim().replace(/\/$/, '');
}

function internalSecret(): string {
  return (Deno.env.get('EDGE_INTERNAL_SECRET') || Deno.env.get('CRON_SECRET') || '').trim();
}

function statusProxyBase(): string | null {
  const explicit = (Deno.env.get('MONEYFUSION_STATUS_PROXY_URL') || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  return `${siteBase()}/api/moneyfusion-status`;
}

function payProxyBase(): string | null {
  const explicit = (Deno.env.get('MONEYFUSION_PAY_PROXY_URL') || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  return `${siteBase()}/api/moneyfusion-pay`;
}

async function fetchViaStatusProxy(token: string): Promise<Response | null> {
  const base = statusProxyBase();
  const secret = internalSecret();
  if (!base || !secret) return null;

  return await fetch(`${base}?token=${encodeURIComponent(token)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-internal-secret': secret,
    },
  });
}

/** Initiate payin via Vercel TLS-tolerant proxy (preferred from Edge). */
export async function moneyFusionPayInitiate(
  apiUrl: string,
  payload: Record<string, unknown>
): Promise<Response> {
  const base = payProxyBase();
  const secret = internalSecret();
  if (base && secret) {
    try {
      const proxied = await fetch(base, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-internal-secret': secret,
        },
        body: JSON.stringify({ apiUrl, payload }),
      });
      // If proxy is not deployed yet (404/405), fall through to direct.
      if (proxied.status !== 404 && proxied.status !== 405) {
        return proxied;
      }
    } catch (err) {
      console.warn('[MoneyFusion] pay proxy failed, falling back to direct', err);
    }
  }

  return await moneyFusionFetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

/** Build checkout URL when MF returns token without url. */
export function moneyFusionCheckoutUrlFromToken(
  token: string,
  amount?: number,
  clientName?: string
): string {
  const t = token.trim();
  if (!t) return '';
  const amt = amount != null && Number.isFinite(amount) ? String(amount) : '';
  const name = (clientName || 'Client').trim().replace(/\s+/g, ' ').slice(0, 80);
  if (amt && name) {
    return `https://payin.moneyfusion.net/payment/${encodeURIComponent(t)}/${encodeURIComponent(amt)}/${encodeURIComponent(name)}`;
  }
  return `https://payin.moneyfusion.net/payment/${encodeURIComponent(t)}`;
}

export async function moneyFusionFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  try {
    const parsed = new URL(url);
    if (parsed.pathname.includes('/paiementNotif/')) {
      const token = decodeURIComponent(parsed.pathname.split('/').pop() || '');
      if (token) {
        const proxied = await fetchViaStatusProxy(token);
        if (proxied) return proxied;
      }
    }
  } catch {
    // fall through
  }

  const createHttpClient = (
    Deno as unknown as {
      createHttpClient?: (opts: {
        unsafelyIgnoreCertificateErrors?: boolean | string[];
      }) => { close: () => void };
    }
  ).createHttpClient;

  if (typeof createHttpClient === 'function') {
    const client = createHttpClient({
      unsafelyIgnoreCertificateErrors: MF_INSECURE_HOSTS,
    });
    try {
      return await fetch(url, { ...init, client } as RequestInit & { client: unknown });
    } finally {
      try {
        client.close();
      } catch {
        // ignore
      }
    }
  }

  return await fetch(url, init);
}

/** Montant + frais = amount the buyer paid (MF often splits them). */
export function moneyFusionPaidAmount(inner: Record<string, unknown>): number | undefined {
  const amountRaw = inner.Montant ?? inner.montant ?? inner.amount;
  const feesRaw = inner.frais ?? inner.fee ?? inner.fees;
  const base =
    amountRaw != null && amountRaw !== ''
      ? typeof amountRaw === 'string'
        ? parseFloat(amountRaw)
        : Number(amountRaw)
      : undefined;
  const fees =
    feesRaw != null && feesRaw !== ''
      ? typeof feesRaw === 'string'
        ? parseFloat(feesRaw)
        : Number(feesRaw)
      : 0;
  if (base == null || !Number.isFinite(base)) return undefined;
  return base + (Number.isFinite(fees) ? fees : 0);
}
