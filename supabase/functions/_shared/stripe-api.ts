const STRIPE_API = "https://api.stripe.com/v1";

export function getStripeSecretKey(): string {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return key;
}

/** Encode nested objects for Stripe form bodies (line_items[0][amount], etc.). */
export function flattenStripeParams(
  value: unknown,
  prefix = "",
): Record<string, string> {
  const out: Record<string, string> = {};
  if (value === null || value === undefined) return out;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const key = prefix ? `${prefix}[${index}]` : String(index);
      Object.assign(out, flattenStripeParams(item, key));
    });
    return out;
  }

  if (typeof value === "object") {
    for (
      const [key, nested] of Object.entries(value as Record<string, unknown>)
    ) {
      const fullKey = prefix ? `${prefix}[${key}]` : key;
      Object.assign(out, flattenStripeParams(nested, fullKey));
    }
    return out;
  }

  if (prefix) out[prefix] = String(value);
  return out;
}

export async function stripeRequest<T>(
  path: string,
  params: Record<string, string> | Record<string, unknown>,
): Promise<T> {
  const flat = flattenStripeParams(params);
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(flat).toString(),
  });
  const data = await response.json();
  if (!response.ok) {
    const message = typeof data?.error?.message === "string"
      ? data.error.message
      : response.statusText;
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
    const message = typeof data?.error?.message === "string"
      ? data.error.message
      : response.statusText;
    throw new Error(`Stripe API error: ${message}`);
  }
  return data as T;
}

/** Montant en unité mineure (centimes) */
const ZERO_DECIMAL_CURRENCIES = new Set(["xof", "xaf", "jpy", "krw", "vnd"]);

export function toStripeAmount(amountMajor: number, currency: string): number {
  const c = currency.toLowerCase();
  if (ZERO_DECIMAL_CURRENCIES.has(c)) {
    return Math.round(amountMajor);
  }
  return Math.round(amountMajor * 100);
}

/** Convertit un montant Stripe (unité mineure) vers l'unité majeure de la commande */
export function fromStripeAmount(
  amountMinor: number,
  currency: string,
): number {
  const c = currency.toLowerCase();
  if (ZERO_DECIMAL_CURRENCIES.has(c)) {
    return amountMinor;
  }
  return amountMinor / 100;
}

export function computeApplicationFee(
  amountMajor: number,
  currency: string,
  feePercent: number,
): number {
  const totalMinor = toStripeAmount(amountMajor, currency);
  return Math.max(0, Math.round((totalMinor * feePercent) / 100));
}
