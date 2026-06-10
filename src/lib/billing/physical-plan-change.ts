import { supabase } from '@/integrations/supabase/client';
import { initiateMonerooPayment } from '@/lib/moneroo-payment';
import { logger } from '@/lib/logger';
import { physicalPlanLabel } from '@/lib/billing/physical-plan-display';

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

    const payment = await initiateMonerooPayment({
      storeId,
      amount: Number(row.amount),
      currency: row.currency === 'XOF' ? 'XOF' : 'XOF',
      description: `Upgrade abonnement — ${newLabel}`,
      customerEmail,
      customerName,
      metadata: {
        purpose: 'physical_plan_change',
        plan_slug: newPlanSlug,
        invoice_id: row.id,
        product_type: 'physical',
      },
      returnUrl: `${window.location.origin}/dashboard/billing/physical?success=1&plan_change=1`,
      cancelUrl: `${window.location.origin}/dashboard/billing/physical?cancel=1`,
    });

    if (!payment?.checkout_url) {
      throw new Error("Impossible d'initier le paiement");
    }

    return { action: 'checkout_required', checkoutUrl: payment.checkout_url };
  }

  return {
    action: result.action,
    message: result.message,
  };
}
