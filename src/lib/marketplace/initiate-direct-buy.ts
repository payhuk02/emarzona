/**
 * Achat direct marketplace / storefront (sans panier) — orchestrateur V2 ou Moneroo legacy.
 * Routage PSP par boutique (Stripe Connect, PayPal, Moneroo plateforme).
 */
import { initiatePayment, type PaymentResult } from '@/lib/payment-service';
import { isSupportedCurrency, type Currency } from '@/lib/currency-converter';
import { logger } from '@/lib/logger';

export interface MarketplaceDirectBuyOptions {
  storeId: string;
  productId: string;
  amount: number;
  currency?: string | null;
  description: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  productName?: string;
  storeSlug?: string;
  productType?: string | null;
  /** true pour achat invité sans compte */
  guestCheckout?: boolean;
}

function resolveCurrency(currency?: string | null): Currency {
  return isSupportedCurrency(currency ?? '') ? (currency as Currency) : 'XOF';
}

/**
 * Initie un paiement direct depuis la marketplace ou une carte produit storefront.
 */
export async function initiateMarketplaceDirectBuy(
  options: MarketplaceDirectBuyOptions
): Promise<PaymentResult> {
  const currency = resolveCurrency(options.currency);

  const result = await initiatePayment({
    storeId: options.storeId,
    productId: options.productId,
    amount: options.amount,
    currency,
    description: options.description,
    customerEmail: options.customerEmail,
    customerName: options.customerName,
    customerPhone: options.customerPhone,
    metadata: {
      ...(options.productName ? { productName: options.productName } : {}),
      ...(options.storeSlug ? { storeSlug: options.storeSlug } : {}),
      ...(options.productType ? { product_type: options.productType } : {}),
      ...(options.guestCheckout ? { guest_checkout: true } : {}),
      ...(options.customerPhone ? { customer_phone: options.customerPhone } : {}),
    },
  });

  if (!result.success) {
    logger.warn('initiateMarketplaceDirectBuy failed', {
      storeId: options.storeId,
      productId: options.productId,
      error: result.error,
    });
  }

  return result;
}
