import { supabase } from '@/integrations/supabase/client';
import { initiateMonerooPayment } from '@/lib/moneroo-payment';
import { logger } from '@/lib/logger';
import {
  convertInvoiceAmountToCheckout,
  detectUserCheckoutCurrency,
} from '@/lib/billing/physical-subscription-checkout';
import { isSupportedCurrency } from '@/lib/currency-converter';

export interface SubscriptionInvoiceRow {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  period_start: string;
  period_end: string;
  due_at: string;
  paid_at: string | null;
  created_at: string;
}

export async function fetchSubscriptionInvoices(
  storeId: string
): Promise<SubscriptionInvoiceRow[]> {
  const { data, error } = await supabase
    .from('subscription_invoices' as never)
    .select(
      'id, invoice_number, amount, currency, status, period_start, period_end, due_at, paid_at, created_at'
    )
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(24);

  if (error) {
    logger.error('fetchSubscriptionInvoices failed', { error, storeId });
    throw error;
  }

  return (data ?? []) as SubscriptionInvoiceRow[];
}

export async function initiateSubscriptionRenewalCheckout(
  storeId: string,
  planSlug: string,
  customerEmail: string,
  customerName?: string
): Promise<string> {
  const { data: invoiceId, error: invoiceError } = await supabase.rpc(
    'get_or_create_renewal_invoice',
    { p_store_id: storeId }
  );

  if (invoiceError || !invoiceId) {
    throw new Error(invoiceError?.message ?? 'Impossible de créer la facture de renouvellement');
  }

  const { data: invoice, error: fetchError } = await supabase
    .from('subscription_invoices' as never)
    .select('id, amount, currency')
    .eq('id', invoiceId)
    .single();

  if (fetchError || !invoice) {
    throw new Error('Facture introuvable');
  }

  const row = invoice as { id: string; amount: number; currency: string };
  const checkoutCurrency = detectUserCheckoutCurrency();
  const invoiceCurrency = isSupportedCurrency(row.currency) ? row.currency : 'USD';
  const checkoutAmount = convertInvoiceAmountToCheckout(
    Number(row.amount),
    invoiceCurrency,
    checkoutCurrency
  );

  const result = await initiateMonerooPayment({
    storeId,
    amount: checkoutAmount,
    currency: checkoutCurrency,
    description: 'Renouvellement abonnement produits physiques',
    customerEmail,
    customerName,
    metadata: {
      purpose: 'physical_subscription_renewal',
      plan_slug: planSlug,
      invoice_id: row.id,
      product_type: 'physical',
    },
    returnUrl: `${window.location.origin}/dashboard/billing/physical?success=1`,
    cancelUrl: `${window.location.origin}/dashboard/billing/physical?cancel=1`,
  });

  if (!result?.checkout_url) {
    throw new Error("Impossible d'initier le paiement de renouvellement");
  }

  return result.checkout_url;
}
