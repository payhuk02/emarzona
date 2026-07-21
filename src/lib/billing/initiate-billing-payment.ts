/**
 * Checkout abonnement plateforme (produits physiques) — MoneyFusion (mode exclusif temporaire).
 * Toujours `forcePlatformPayments` : la boutique paie Emarzona, pas via son Stripe/PayPal vendeur.
 */
import { initiatePayment } from '@/lib/payment-service';
import { logger } from '@/lib/logger';
import { isMoneyFusionOnlyEnabled } from '@/lib/payments/feature-flags';
import { MONEYFUSION_CURRENCIES, normalizeCurrency } from '@/lib/payments/constants';
import { convertCurrency, isSupportedCurrency } from '@/lib/currency-converter';
import { roundAmountForCurrency } from '@/lib/billing/physical-subscription-checkout';
import {
  requireBillingCustomerPhone,
  resolveBillingCustomerPhone,
} from '@/lib/billing/billing-contact';

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
  /** Requis par MoneyFusion (mobile money) — résolu depuis le profil si absent */
  customerPhone?: string;
  purpose: BillingCheckoutPurpose;
  planSlug: string;
  invoiceId?: string;
  /** Chemin de retour après paiement (défaut : facturation physique) */
  returnPath?: string;
  /** Paramètres query additionnels sur l'URL de succès */
  successQuery?: Record<string, string>;
}

const DEFAULT_BILLING_RETURN_PATH = '/dashboard/billing/physical';

/**
 * MoneyFusion (mobile money) n'accepte que le XOF : convertit le montant
 * de facturation si la devise checkout détectée n'est pas supportée.
 */
function toMoneyFusionAmount(
  amount: number,
  currency: string
): { amount: number; currency: string } {
  if (MONEYFUSION_CURRENCIES.has(normalizeCurrency(currency))) {
    return { amount, currency };
  }
  const from = isSupportedCurrency(currency) ? currency : 'USD';
  const converted = convertCurrency(amount, from, 'XOF');
  return { amount: roundAmountForCurrency(converted, 'XOF'), currency: 'XOF' };
}

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

  // MoneyFusion (mobile money) exige un téléphone. En mode MoneyFusion-only on
  // bloque tôt avec une saisie utilisateur ; sinon on l'ajoute si connu (utile
  // quand l'orchestrateur route quand même vers MoneyFusion).
  const moneyFusionOnly = isMoneyFusionOnlyEnabled();
  let customerPhone = options.customerPhone;
  if (!customerPhone) {
    customerPhone = moneyFusionOnly
      ? await requireBillingCustomerPhone()
      : ((await resolveBillingCustomerPhone()) ?? undefined);
  }

  // MoneyFusion ne supporte que le XOF — convertir si nécessaire.
  const { amount, currency } = moneyFusionOnly
    ? toMoneyFusionAmount(options.amount, options.currency)
    : { amount: options.amount, currency: options.currency };

  const result = await initiatePayment({
    storeId: options.storeId,
    amount,
    currency,
    description: options.description,
    customerEmail: options.customerEmail,
    customerName: options.customerName,
    customerPhone,
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
