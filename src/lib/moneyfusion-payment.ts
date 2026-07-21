/**
 * Initiation paiement MoneyFusion avec tracking local
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';
import { moneyfusionClient } from './moneyfusion-client';
import { isSupportedCurrency, type Currency } from './currency-converter';
import { normalizePhoneForPayment } from './validation';
import { maskEmail } from './geniuspay-log-sanitize';

export interface MoneyFusionPaymentOptions {
  storeId: string;
  productId?: string;
  orderId?: string;
  customerId?: string;
  amount: number;
  currency?: Currency;
  description: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  metadata?: Record<string, unknown>;
  returnUrl?: string;
  cancelUrl?: string;
}

export async function initiateMoneyFusionPayment(options: MoneyFusionPaymentOptions) {
  const {
    storeId,
    productId,
    orderId,
    customerId,
    amount,
    currency: requestedCurrency = 'XOF',
    description,
    customerEmail,
    customerName,
    customerPhone,
    metadata = {},
    returnUrl,
    cancelUrl,
  } = options;

  const currency: Currency = isSupportedCurrency(requestedCurrency) ? requestedCurrency : 'XOF';

  if (!storeId) {
    throw new Error('storeId invalide');
  }
  if (!customerEmail || !customerEmail.includes('@')) {
    throw new Error('customerEmail invalide');
  }
  if (!customerPhone) {
    throw new Error('Un numéro de téléphone est requis pour MoneyFusion');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = customerId || user?.id;

  const customerCountry =
    typeof metadata.customerCountry === 'string'
      ? metadata.customerCountry
      : typeof metadata.customer_country === 'string'
        ? metadata.customer_country
        : undefined;

  const normalizedPhone = normalizePhoneForPayment(customerPhone, customerCountry);

  logger.log('Initiating MoneyFusion checkout', {
    storeId,
    amount,
    currency,
    customerEmailMasked: maskEmail(customerEmail),
    hasPhone: !!normalizedPhone,
  });

  const response = await moneyfusionClient.createCheckout({
    amount,
    currency,
    description,
    customer_email: customerEmail,
    customer_name: customerName,
    customer_phone: normalizedPhone,
    return_url: returnUrl || `${window.location.origin}/payment/success`,
    cancel_url: cancelUrl || `${window.location.origin}/checkout/cancel`,
    productId,
    storeId,
    orderId,
    metadata: {
      ...metadata,
      ...(currentUserId ? { userId: currentUserId } : {}),
      ...(orderId ? { order_id: orderId } : {}),
      ...(productId ? { product_id: productId } : {}),
      ...(storeId ? { store_id: storeId } : {}),
    },
  });

  const checkoutUrl = response.checkout_url || response.payment_url || response.url;
  if (!checkoutUrl) {
    throw new Error("MoneyFusion n'a pas renvoyé d'URL de paiement");
  }

  return {
    success: true as const,
    transaction_id: response._local_transaction_id || null,
    moneyfusion_token: response.token || response.id || null,
    checkout_url: checkoutUrl,
  };
}
