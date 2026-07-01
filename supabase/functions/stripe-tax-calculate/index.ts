/**
 * Stripe Tax — calcul TVA/sales tax au checkout (Phase 2.6).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import { fromStripeAmount, stripeRequest, toStripeAmount } from '../_shared/stripe-api.ts';

interface TaxLineItemInput {
  reference: string;
  amount: number;
  quantity: number;
  tax_code: string;
}

interface TaxCalculateBody {
  currency: string;
  country_code: string;
  state_province?: string;
  postal_code?: string;
  city?: string;
  shipping_amount: number;
  line_items: TaxLineItemInput[];
}

interface StripeTaxBreakdownItem {
  amount: number;
  tax_rate_details?: {
    percentage_decimal?: string;
    tax_type?: string;
  };
}

interface StripeTaxCalculation {
  id: string;
  tax_amount_exclusive: number;
  tax_breakdown?: StripeTaxBreakdownItem[];
}

function isStripeTaxConfigured(): boolean {
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  return !!key && key.length > 20;
}

serve(async req => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(origin) });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, origin);
  }

  if (!isStripeTaxConfigured()) {
    return jsonResponse(
      { error: 'Stripe Tax not configured', code: 'STRIPE_TAX_DISABLED' },
      503,
      origin
    );
  }

  try {
    const body = (await req.json()) as TaxCalculateBody;
    const currency = (body.currency ?? 'eur').toLowerCase();
    const country = (body.country_code ?? '').toUpperCase();

    if (!country || !body.line_items?.length) {
      return jsonResponse({ error: 'country_code and line_items required' }, 400, origin);
    }

    let subtotalMajor = 0;
    const lineItems = body.line_items.map(item => {
      const amountMajor = Number(item.amount) || 0;
      subtotalMajor += amountMajor;
      return {
        amount: toStripeAmount(amountMajor, currency),
        reference: item.reference,
        quantity: item.quantity ?? 1,
        tax_code: item.tax_code ?? 'txcd_99999999',
      };
    });

    const shippingMajor = Number(body.shipping_amount) || 0;
    const address: Record<string, string> = { country };
    if (body.state_province) address.state = body.state_province;
    if (body.postal_code) address.postal_code = body.postal_code;
    if (body.city) address.city = body.city;

    const requestBody: Record<string, unknown> = {
      currency,
      line_items: lineItems,
      customer_details: { address },
    };
    if (shippingMajor > 0) {
      requestBody.shipping_cost = { amount: toStripeAmount(shippingMajor, currency) };
    }

    const calc = await stripeRequest<StripeTaxCalculation>('/tax/calculations', requestBody);

    const taxAmountMajor = fromStripeAmount(calc.tax_amount_exclusive ?? 0, currency);
    const breakdown = (calc.tax_breakdown ?? []).map(row => {
      const rate = row.tax_rate_details?.percentage_decimal
        ? parseFloat(row.tax_rate_details.percentage_decimal)
        : 0;
      const taxType = row.tax_rate_details?.tax_type ?? 'tax';
      return {
        type: taxType,
        name: taxType === 'vat' ? 'VAT' : taxType === 'sales_tax' ? 'Sales tax' : 'Tax',
        rate,
        amount: fromStripeAmount(row.amount ?? 0, currency),
        applies_to_shipping: false,
        tax_inclusive: false,
        source: 'stripe_tax',
      };
    });

    const totalWithTax = subtotalMajor + shippingMajor + taxAmountMajor;

    return jsonResponse(
      {
        tax_amount: Math.round(taxAmountMajor * 100) / 100,
        tax_breakdown: breakdown,
        subtotal: subtotalMajor,
        shipping_amount: shippingMajor,
        total_with_tax: Math.round(totalWithTax * 100) / 100,
        source: 'stripe_tax',
        calculation_id: calc.id,
      },
      200,
      origin
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 502, origin);
  }
});
