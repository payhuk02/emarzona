/**
 * MoneyFusion HTTPS helper.
 * MF cert often fails Deno peer-name validation from Supabase Edge
 * (NotValidForName). Prefer Vercel proxy /api/moneyfusion-status when configured.
 */

const MF_INSECURE_HOSTS = [
  'www.pay.moneyfusion.net',
  'pay.moneyfusion.net',
  'api.moneyfusion.net',
];

function statusProxyBase(): string | null {
  const explicit = (Deno.env.get('MONEYFUSION_STATUS_PROXY_URL') || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const site = (Deno.env.get('SITE_URL') || 'https://www.emarzona.com').trim().replace(/\/$/, '');
  return site ? `${site}/api/moneyfusion-status` : null;
}

async function fetchViaStatusProxy(token: string): Promise<Response | null> {
  const base = statusProxyBase();
  const secret = (Deno.env.get('EDGE_INTERNAL_SECRET') || Deno.env.get('CRON_SECRET') || '').trim();
  if (!base || !secret) return null;

  return await fetch(`${base}?token=${encodeURIComponent(token)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-internal-secret': secret,
    },
  });
}

export async function moneyFusionFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  // Route paiementNotif through Node TLS-tolerant proxy when possible
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
    // fall through to direct fetch
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
