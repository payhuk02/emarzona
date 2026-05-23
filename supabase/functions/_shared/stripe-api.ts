const STRIPE_API = 'https://api.stripe.com/v1';

export function getStripeSecretKey(): string {
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return key;
}

export async function stripeRequest<T>(path: string, params: Record<string, string>): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });
  const data = await response.json();
  if (!response.ok) {
    const message =
      typeof data?.error?.message === 'string' ? data.error.message : response.statusText;
    throw new Error(`Stripe API error: ${message}`);
  }
  return data as T;
}

export async function stripeGet<T>(path: string): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${getStripeSecretKey()}` },
  });
  const data = await response.json();
  if (!response.ok) {
    const message =
      typeof data?.error?.message === 'string' ? data.error.message : response.statusText;
    throw new Error(`Stripe API error: ${message}`);
  }
  return data as T;
}

/** Montant en unité mineure (centimes) */
export function toStripeAmount(amountMajor: number, currency: string): number {
  const zeroDecimal = new Set(['xof', 'xaf', 'jpy', 'krw', 'vnd']);
  const c = currency.toLowerCase();
  if (zeroDecimal.has(c)) {
    return Math.round(amountMajor);
  }
  return Math.round(amountMajor * 100);
}

export function computeApplicationFee(
  amountMajor: number,
  currency: string,
  feePercent: number
): number {
  const totalMinor = toStripeAmount(amountMajor, currency);
  return Math.max(0, Math.round((totalMinor * feePercent) / 100));
}
