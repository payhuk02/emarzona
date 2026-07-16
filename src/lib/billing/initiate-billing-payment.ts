/**
 * Checkout abonnement plateforme (produits physiques) — orchestrateur V2 ou GeniusPay legacy.
 * Toujours `forcePlatformPayments` : la boutique paie Emarzona, pas via son Stripe/PayPal vendeur.
 */
import { initiatePayment } from '@/lib/payment-service';
import { logger } from '@/lib/logger';

export type BillingCheckoutPurpose =
  | 'physical_subscription'
  | 'physical_subscription_renewal'
  | 'physical_plan_change';

export interface BillingCheckoutOptions {
  storeId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerName?: string;
  purpose: BillingCheckoutPurpose;
  planSlug: string;
  invoiceId?: string;
  /** Chemin de retour après paiement (défaut : facturation physique) */
  returnPath?: string;
  /** Paramètres query additionnels sur l'URL de succès */
  successQuery?: Record<string, string>;
}

const DEFAULT_BILLING_RETURN_PATH = '/dashboard/billing/physical';

function buildBillingReturnUrls(
  returnPath: string,
  successQuery?: Record<string, string>
): { returnUrl: string; cancelUrl: string } {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://www.emarzona.com';
  const successParams = new URLSearchParams({ success: '1', ...successQuery });
  const cancelParams = new URLSearchParams({ cancel: '1' });
  return {
    returnUrl: `${origin}${returnPath}?${successParams.toString()}`,
    cancelUrl: `${origin}${returnPath}?${cancelParams.toString()}`,
  };
}

/**
 * Initie un checkout d'abonnement / renouvellement / upgrade plan physique.
 * @returns URL de redirection PSP
 */
export async function initiateBillingCheckout(options: BillingCheckoutOptions): Promise<string> {
  const returnPath = options.returnPath ?? DEFAULT_BILLING_RETURN_PATH;
  const { returnUrl, cancelUrl } = buildBillingReturnUrls(returnPath, options.successQuery);

  const result = await initiatePayment({
    storeId: options.storeId,
    amount: options.amount,
    currency: options.currency,
    description: options.description,
    customerEmail: options.customerEmail,
    customerName: options.customerName,
    returnUrl,
    cancelUrl,
    forcePlatformPayments: true,
    metadata: {
      purpose: options.purpose,
      plan_slug: options.planSlug,
      product_type: 'physical',
      ...(options.invoiceId ? { invoice_id: options.invoiceId } : {}),
    },
  });

  if (!result.success || !result.checkout_url) {
    const message = result.error ?? "Impossible d'initier le paiement";
    logger.error('initiateBillingCheckout failed', {
      storeId: options.storeId,
      purpose: options.purpose,
      error: message,
    });
    throw new Error(message);
  }

  return result.checkout_url;
}
