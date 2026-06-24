import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { physicalPlanLabel } from '@/lib/billing/physical-plan-display';
import {
  convertInvoiceAmountToCheckout,
  detectUserCheckoutCurrency,
} from '@/lib/billing/physical-subscription-checkout';
import { isSupportedCurrency } from '@/lib/currency-converter';
import { initiateBillingCheckout } from '@/lib/billing/initiate-billing-payment';

export type PlanChangePreview = {
  change_type: 'upgrade' | 'downgrade' | 'same';
  old_plan_slug: string;
  new_plan_slug: string;
  prorated_amount: number;
  currency: string;
  days_remaining: number;
  effective: 'immediate' | 'period_end' | 'none';
  requires_payment: boolean;
};

export type PlanChangeResult = {
  action: 'applied' | 'scheduled' | 'checkout_required';
  change_type: string;
  prorated_amount: number;
  invoice_id?: string;
  effective_at?: string;
  message?: string;
};

export async function previewPhysicalPlanChange(
  storeId: string,
  newPlanSlug: string
): Promise<PlanChangePreview> {
  const { data, error } = await supabase.rpc('calculate_physical_plan_proration', {
    p_store_id: storeId,
    p_new_plan_slug: newPlanSlug,
  });

  if (error) {
    logger.error('previewPhysicalPlanChange failed', { error, storeId, newPlanSlug });
    throw error;
  }

  return data as PlanChangePreview;
}

export async function initiatePhysicalPlanChange(
  storeId: string,
  newPlanSlug: string,
  customerEmail: string,
  customerName?: string
): Promise<{ action: string; checkoutUrl?: string; message?: string }> {
  const { data, error } = await supabase.rpc('change_physical_plan', {
    p_store_id: storeId,
    p_new_plan_slug: newPlanSlug,
  });

  if (error) {
    throw new Error(error.message);
  }

  const result = data as PlanChangeResult;

  if (result.action === 'checkout_required' && result.invoice_id) {
    const { data: invoice, error: fetchError } = await supabase
      .from('subscription_invoices' as never)
      .select('id, amount, currency')
      .eq('id', result.invoice_id)
      .single();

    if (fetchError || !invoice) {
      throw new Error('Facture de changement de plan introuvable');
    }

    const row = invoice as { id: string; amount: number; currency: string };
    const newLabel = physicalPlanLabel(newPlanSlug);
    const checkoutCurrency = detectUserCheckoutCurrency();
    const invoiceCurrency = isSupportedCurrency(row.currency) ? row.currency : 'USD';
    const checkoutAmount = convertInvoiceAmountToCheckout(
      Number(row.amount),
      invoiceCurrency,
      checkoutCurrency
    );

    const checkoutUrl = await initiateBillingCheckout({
      storeId,
      amount: checkoutAmount,
      currency: checkoutCurrency,
      description: `Upgrade abonnement — ${newLabel}`,
      customerEmail,
      customerName,
      purpose: 'physical_plan_change',
      planSlug: newPlanSlug,
      invoiceId: row.id,
      successQuery: { plan_change: '1' },
    });

    return { action: 'checkout_required', checkoutUrl };
  }

  return {
    action: result.action,
    message: result.message,
  };
}
