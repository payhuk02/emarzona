/// <reference path="../deno.d.ts" />
import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import {
  maskEmail,
  sanitizeGeniusPayApiResponseLog,
  sanitizeGeniusPayRequestLog,
} from '../_shared/payment-log-sanitize.ts';
import { authorizeCheckoutOrder } from '../_shared/order-checkout-auth.ts';
import { enforceRateLimit, getClientIp, RATE_LIMIT_PRESETS } from '../_shared/rate-limit.ts';
import {
  isAuthorizedPlanCheckoutAmount,
  resolveAuthorizedCheckoutAmount,
} from '../_shared/physical-plan-pricing.ts';

// ============================================================================
// VALIDATION - Intégrée directement pour le déploiement via Dashboard
// ============================================================================

/**
 * Validation serveur pour l'Edge Function GeniusPay
 * Utilise des validations strictes pour sécuriser les entrées
 */

// Note: Zod n'est pas disponible dans Deno Edge Functions
// On utilise donc des validations manuelles strictes

interface CreateCheckoutData {
  amount: number;
  currency: string;
  description?: string;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  return_url?: string;
  cancel_url?: string;
  productId?: string;
  storeId?: string;
  orderId?: string;
  metadata?: Record<string, unknown>;
  /** @deprecated Prefer payment_method (GeniusPay API officiel) */
  methods?: string[];
  /** Code API GeniusPay: pawapay | wave | orange_money | ... */
  payment_method?: string;
  /** Code opérateur MMO PawaPay (ex: ORANGE_CIV) */
  mmo_provider?: string;
  /** Code pays ISO2 pour PawaPay (ex: CI, SN) */
  customer_country?: string;
}

const GENIUSPAY_PAYMENT_METHODS = [
  'pawapay',
  'wave',
  'orange_money',
  'mtn_money',
  'moov_money',
  'airtel_money',
  'paystack',
  'card',
] as const;

/** Défaut checkout Emarzona = PawaPay via GeniusPay */
const DEFAULT_GENIUSPAY_PAYMENT_METHOD =
  (Deno.env.get('GENIUSPAY_DEFAULT_PAYMENT_METHOD') || 'pawapay').trim().toLowerCase();

function resolveGeniusPayPaymentMethod(raw?: string | null): string | undefined {
  if (raw === '' || raw === 'omit' || raw === 'checkout') {
    // Mode page checkout GeniusPay (choix client)
    return undefined;
  }
  const value = (raw || DEFAULT_GENIUSPAY_PAYMENT_METHOD).trim().toLowerCase();
  if ((GENIUSPAY_PAYMENT_METHODS as readonly string[]).includes(value)) {
    return value;
  }
  return 'pawapay';
}

interface RefundPaymentData {
  paymentId: string;
  amount?: number;
  reason?: string;
}

/**
 * Limites de montant par devise (selon GeniusPay)
 */
const AMOUNT_LIMITS: Record<string, { min: number; max: number }> = {
  XOF: { min: 100, max: 10000000 },
  NGN: { min: 100, max: 10000000 },
  GHS: { min: 1, max: 100000 },
  KES: { min: 10, max: 1000000 },
  ZAR: { min: 10, max: 1000000 },
  UGX: { min: 1000, max: 50000000 },
  TZS: { min: 1000, max: 50000000 },
  RWF: { min: 100, max: 10000000 },
  ETB: { min: 10, max: 1000000 },
  USD: { min: 1, max: 10000 },
  EUR: { min: 1, max: 10000 },
  GBP: { min: 1, max: 10000 },
};

/**
 * Devises supportées
 */
const SUPPORTED_CURRENCIES = Object.keys(AMOUNT_LIMITS);

/**
 * Valide un email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Valide une devise
 */
function isValidCurrency(currency: string): boolean {
  return SUPPORTED_CURRENCIES.includes(currency) && currency.length === 3;
}

/**
 * Valide un montant
 */
function isValidAmount(amount: number, currency: string): { valid: boolean; error?: string } {
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    return { valid: false, error: 'Le montant doit être un nombre valide' };
  }

  if (amount <= 0) {
    return { valid: false, error: 'Le montant doit être positif' };
  }

  const limits = AMOUNT_LIMITS[currency] || AMOUNT_LIMITS.XOF;

  if (amount < limits.min) {
    return { valid: false, error: `Le montant minimum est ${limits.min} ${currency}` };
  }

  if (amount > limits.max) {
    return { valid: false, error: `Le montant maximum est ${limits.max} ${currency}` };
  }

  return { valid: true };
}

/**
 * Valide un UUID
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Valide une URL
 */
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

const COUNTRY_DIAL_CODES: Record<string, string> = {
  'burkina faso': '226',
  burkina: '226',
  "côte d'ivoire": '225',
  "cote d'ivoire": '225',
  'ivory coast': '225',
  senegal: '221',
  mali: '223',
  benin: '229',
  togo: '228',
  niger: '227',
  ghana: '233',
  nigeria: '234',
  cameroun: '237',
  cameroon: '237',
};

/** Mapping nom pays / ISO2 → ISO2 pour le routage PawaPay */
const COUNTRY_ISO2: Record<string, string> = {
  'burkina faso': 'BF',
  burkina: 'BF',
  bf: 'BF',
  "côte d'ivoire": 'CI',
  "cote d'ivoire": 'CI',
  'ivory coast': 'CI',
  ci: 'CI',
  civ: 'CI',
  senegal: 'SN',
  sn: 'SN',
  mali: 'ML',
  ml: 'ML',
  benin: 'BJ',
  bj: 'BJ',
  togo: 'TG',
  tg: 'TG',
  niger: 'NE',
  ne: 'NE',
  ghana: 'GH',
  gh: 'GH',
  nigeria: 'NG',
  ng: 'NG',
  cameroun: 'CM',
  cameroon: 'CM',
  cm: 'CM',
  'rd congo': 'CD',
  congo: 'CD',
  cd: 'CD',
  kenya: 'KE',
  ke: 'KE',
  rwanda: 'RW',
  rw: 'RW',
  ouganda: 'UG',
  uganda: 'UG',
  ug: 'UG',
  gabon: 'GA',
  ga: 'GA',
};

function resolveCountryIso2(country?: string | null): string | undefined {
  if (!country) return undefined;
  const key = country.trim().toLowerCase();
  if (/^[a-z]{2}$/i.test(key)) {
    return key.toUpperCase();
  }
  return COUNTRY_ISO2[key];
}

function normalizePhoneForGeniusPay(phone: string, country?: string): string {
  const cleaned = phone.trim().replace(/\s/g, '');
  if (!cleaned) return cleaned;

  if (/^\+[1-9]\d{6,14}$/.test(cleaned)) {
    return cleaned;
  }

  const digits = cleaned.replace(/\D/g, '');
  const localDigits = digits.startsWith('0') ? digits.slice(1) : digits;
  const dialCode = COUNTRY_DIAL_CODES[(country || 'burkina faso').toLowerCase().trim()] || '226';

  if (localDigits.length >= 7) {
    return `+${dialCode}${localDigits}`;
  }

  return cleaned.startsWith('+') ? cleaned : `+${dialCode}${localDigits}`;
}

const GENIUSPAY_METADATA_MAX_ITEMS = 10;
const GENIUSPAY_METADATA_PRIORITY = [
  'transaction_id',
  'store_id',
  'product_id',
  'order_id',
  'checkout_token',
  'userId',
  'order_number',
  'variantId',
  'productType',
  'purpose',
  'plan_slug',
];

/** GeniusPay metadata accepts string values only, max 10 keys */
function sanitizeGeniusPayMetadata(raw: Record<string, unknown>): Record<string, string> {
  const metadata: Record<string, string> = {};

  Object.entries(raw).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return;
    }

    if (typeof value === 'string') {
      metadata[key] = value;
      return;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      metadata[key] = String(value);
      return;
    }

    if (typeof value === 'object') {
      try {
        metadata[key] = JSON.stringify(value);
      } catch {
        console.warn(`[GeniusPay Edge Function] Cannot serialize metadata.${key}, skipping`);
      }
    }
  });

  return metadata;
}

function limitGeniusPayMetadata(metadata: Record<string, string>): Record<string, string> {
  const limited: Record<string, string> = {};

  for (const key of GENIUSPAY_METADATA_PRIORITY) {
    if (metadata[key] !== undefined) {
      limited[key] = metadata[key];
    }
    if (Object.keys(limited).length >= GENIUSPAY_METADATA_MAX_ITEMS) {
      return limited;
    }
  }

  for (const [key, value] of Object.entries(metadata)) {
    if (limited[key] !== undefined) {
      continue;
    }
    limited[key] = value;
    if (Object.keys(limited).length >= GENIUSPAY_METADATA_MAX_ITEMS) {
      break;
    }
  }

  if (Object.keys(metadata).length > GENIUSPAY_METADATA_MAX_ITEMS) {
    console.warn('[GeniusPay Edge Function] Metadata truncated for GeniusPay API limit', {
      originalCount: Object.keys(metadata).length,
      keptCount: Object.keys(limited).length,
    });
  }

  return limited;
}

/**
 * Valide les données pour create_checkout
 */
function validateCreateCheckout(data: unknown): {
  valid: boolean;
  error?: string;
  validated?: CreateCheckoutData;
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Les données sont requises' };
  }

  const d = data as Record<string, unknown>;

  // Valider amount
  const amount = typeof d.amount === 'number' ? d.amount : parseFloat(String(d.amount || 0));
  if (!amount || amount <= 0 || !isFinite(amount)) {
    return { valid: false, error: 'Le montant est requis et doit être un nombre positif' };
  }

  // Valider currency
  const currency = String(d.currency || 'XOF').toUpperCase();
  if (!isValidCurrency(currency)) {
    return { valid: false, error: `Devise non supportée: ${currency}` };
  }

  // Valider le montant selon la devise
  const amountValidation = isValidAmount(amount, currency);
  if (!amountValidation.valid) {
    return { valid: false, error: amountValidation.error };
  }

  // Valider customer_email
  const customerEmail = String(d.customer_email || '').trim();
  if (!customerEmail) {
    return { valid: false, error: "L'email du client est requis" };
  }
  if (!isValidEmail(customerEmail)) {
    return { valid: false, error: "Format d'email invalide" };
  }

  // Valider description (optionnel mais limité)
  if (d.description && typeof d.description === 'string' && d.description.length > 500) {
    return { valid: false, error: 'La description ne peut pas dépasser 500 caractères' };
  }

  // Valider return_url (optionnel)
  if (d.return_url && typeof d.return_url === 'string' && !isValidUrl(d.return_url)) {
    return { valid: false, error: 'URL de retour invalide' };
  }

  // Valider cancel_url (optionnel)
  if (d.cancel_url && typeof d.cancel_url === 'string' && !isValidUrl(d.cancel_url)) {
    return { valid: false, error: "URL d'annulation invalide" };
  }

  // Valider productId et storeId (optionnels mais doivent être des UUID valides)
  if (d.productId && typeof d.productId === 'string' && !isValidUUID(d.productId)) {
    return { valid: false, error: 'productId doit être un UUID valide' };
  }
  if (d.storeId && typeof d.storeId === 'string' && !isValidUUID(d.storeId)) {
    return { valid: false, error: 'storeId doit être un UUID valide' };
  }

  if (d.orderId && typeof d.orderId === 'string' && !isValidUUID(d.orderId)) {
    return { valid: false, error: 'orderId doit être un UUID valide' };
  }

  // Valider metadata (optionnel)
  if (d.metadata && typeof d.metadata !== 'object') {
    return { valid: false, error: 'metadata doit être un objet' };
  }

  const paymentMethodRaw =
    typeof d.payment_method === 'string'
      ? d.payment_method
      : Array.isArray(d.methods) && d.methods.length > 0
        ? String(d.methods[0])
        : undefined;

  const mmoProvider =
    typeof d.mmo_provider === 'string' ? d.mmo_provider.trim().substring(0, 64) : undefined;

  const customerCountryRaw =
    typeof d.customer_country === 'string'
      ? d.customer_country
      : typeof (d.metadata as Record<string, unknown> | undefined)?.customerCountry === 'string'
        ? String((d.metadata as Record<string, unknown>).customerCountry)
        : typeof (d.metadata as Record<string, unknown> | undefined)?.customer_country === 'string'
          ? String((d.metadata as Record<string, unknown>).customer_country)
          : undefined;

  return {
    valid: true,
    validated: {
      amount: Math.round(amount),
      currency,
      description: d.description ? String(d.description).substring(0, 500) : undefined,
      customer_email: customerEmail,
      customer_name: d.customer_name ? String(d.customer_name).substring(0, 200) : undefined,
      customer_phone: d.customer_phone ? String(d.customer_phone).substring(0, 50) : undefined,
      return_url: d.return_url ? String(d.return_url) : undefined,
      cancel_url: d.cancel_url ? String(d.cancel_url) : undefined,
      productId: d.productId ? String(d.productId) : undefined,
      storeId: d.storeId ? String(d.storeId) : undefined,
      orderId: d.orderId ? String(d.orderId) : undefined,
      metadata: d.metadata as Record<string, unknown> | undefined,
      methods: Array.isArray(d.methods) ? d.methods.map(String) : undefined,
      payment_method: paymentMethodRaw ? String(paymentMethodRaw).substring(0, 32) : undefined,
      mmo_provider: mmoProvider || undefined,
      customer_country: customerCountryRaw
        ? String(customerCountryRaw).substring(0, 64)
        : undefined,
    },
  };
}

/**
 * Valide les données pour refund_payment
 */
function validateRefundPayment(data: unknown): {
  valid: boolean;
  error?: string;
  validated?: RefundPaymentData;
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Les données sont requises' };
  }

  const d = data as Record<string, unknown>;

  // Valider paymentId
  const paymentId = String(d.paymentId || '');
  if (!paymentId) {
    return { valid: false, error: 'paymentId est requis' };
  }
  if (paymentId.length > 100) {
    return { valid: false, error: 'paymentId invalide' };
  }

  // Valider amount (optionnel)
  let amount: number | undefined;
  if (d.amount !== undefined) {
    amount = typeof d.amount === 'number' ? d.amount : parseFloat(String(d.amount));
    if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
      return { valid: false, error: 'Le montant de remboursement doit être un nombre positif' };
    }
  }

  // Valider reason (optionnel)
  const reason = d.reason ? String(d.reason).substring(0, 500) : undefined;

  return {
    valid: true,
    validated: {
      paymentId,
      amount,
      reason,
    },
  };
}

/**
 * Valide les données pour get_payment, verify_payment, cancel_payment
 */
function validatePaymentId(data: unknown): { valid: boolean; error?: string; paymentId?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Les données sont requises' };
  }

  const d = data as Record<string, unknown>;
  const paymentId = String(d.paymentId || '');

  if (!paymentId) {
    return { valid: false, error: 'paymentId est requis' };
  }

  if (paymentId.length > 100) {
    return { valid: false, error: 'paymentId invalide' };
  }

  return { valid: true, paymentId };
}

// ============================================================================
// FIN VALIDATION
// ============================================================================

function getEffectiveProductPrice(price: number, promotionalPrice: number | null): number {
  const base = Number(price);
  const promo = promotionalPrice != null ? Number(promotionalPrice) : null;
  if (promo != null && !Number.isNaN(promo) && promo >= 0 && promo < base) {
    return Math.round(promo);
  }
  return Math.round(base);
}

/**
 * Recalcule le montant côté serveur à partir de la commande ou du produit.
 * Empêche la manipulation du prix client avant GeniusPay.
 */
async function resolveAuthorizedPaymentAmount(
  validated: CreateCheckoutData
): Promise<{ valid: boolean; error?: string; amount?: number; currency?: string }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  const orderIdFromMeta =
    validated.orderId ||
    (validated.metadata?.order_id as string | undefined) ||
    (validated.metadata?.orderId as string | undefined);

  // -----------------------------------------------------------------------
  // Physical subscription checkout: validate amount against plan price
  // -----------------------------------------------------------------------
  const purpose = (validated.metadata?.purpose as string | undefined) || undefined;
  const planSlug =
    (validated.metadata?.plan_slug as string | undefined) ||
    (validated.metadata?.planSlug as string | undefined) ||
    undefined;

  if (purpose === 'physical_subscription') {
    if (!supabaseUrl || !serviceKey) {
      return {
        valid: false,
        error: 'Configuration serveur incomplète pour la validation du paiement',
      };
    }
    if (!validated.storeId) {
      return { valid: false, error: 'storeId requis pour un abonnement physique' };
    }
    if (!planSlug) {
      return { valid: false, error: 'plan_slug requis pour un abonnement physique' };
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: plan, error } = await supabase
      .from('platform_vendor_plans')
      .select('slug, monthly_price, currency, is_active, applies_to_product_type')
      .eq('slug', planSlug)
      .maybeSingle();

    if (error || !plan) {
      return { valid: false, error: 'Plan introuvable' };
    }
    if (!plan.is_active || plan.applies_to_product_type !== 'physical') {
      return { valid: false, error: 'Plan non valide pour produits physiques' };
    }

    const expected = Math.round(Number(plan.monthly_price) * 100) / 100;
    const planCurrency = (plan.currency as string) || 'USD';
    const clientCurrency = validated.currency || planCurrency;

    if (!isAuthorizedPlanCheckoutAmount(expected, planCurrency, validated.amount, clientCurrency)) {
      console.warn('[GeniusPay] Physical subscription amount mismatch', {
        clientAmount: validated.amount,
        clientCurrency,
        serverAmount: expected,
        serverCurrency: planCurrency,
        planSlug,
      });
      return { valid: false, error: 'Montant invalide pour ce plan' };
    }

    return {
      valid: true,
      amount: resolveAuthorizedCheckoutAmount(
        expected,
        planCurrency,
        validated.amount,
        clientCurrency
      ),
      currency: clientCurrency,
    };
  }

  if (purpose === 'physical_plan_change') {
    if (!supabaseUrl || !serviceKey) {
      return {
        valid: false,
        error: 'Configuration serveur incomplète pour la validation du paiement',
      };
    }
    const invoiceId = validated.metadata?.invoice_id as string | undefined;
    if (!invoiceId) {
      return { valid: false, error: 'invoice_id requis pour le changement de plan' };
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: invoice, error } = await supabase
      .from('subscription_invoices')
      .select('id, amount, currency, status, store_id, metadata')
      .eq('id', invoiceId)
      .maybeSingle();

    if (error || !invoice) {
      return { valid: false, error: 'Facture introuvable' };
    }
    if (invoice.status !== 'pending') {
      return { valid: false, error: 'Facture déjà traitée' };
    }
    const invoiceMeta = invoice.metadata as { plan_change?: boolean | string } | null;
    const isPlanChangeInvoice =
      invoiceMeta?.plan_change === true || invoiceMeta?.plan_change === 'true';
    if (!isPlanChangeInvoice) {
      return { valid: false, error: 'Facture invalide pour changement de plan' };
    }
    if (validated.storeId && invoice.store_id !== validated.storeId) {
      return { valid: false, error: 'Boutique invalide pour cette facture' };
    }

    const expected = Math.round(Number(invoice.amount) * 100) / 100;
    const invoiceCurrency = (invoice.currency as string) || 'USD';
    const clientCurrency = validated.currency || invoiceCurrency;

    if (
      !isAuthorizedPlanCheckoutAmount(expected, invoiceCurrency, validated.amount, clientCurrency)
    ) {
      return { valid: false, error: 'Montant prorata invalide' };
    }

    return {
      valid: true,
      amount: resolveAuthorizedCheckoutAmount(
        expected,
        invoiceCurrency,
        validated.amount,
        clientCurrency
      ),
      currency: clientCurrency,
    };
  }

  if (purpose === 'physical_subscription_renewal') {
    if (!supabaseUrl || !serviceKey) {
      return {
        valid: false,
        error: 'Configuration serveur incomplète pour la validation du paiement',
      };
    }
    const invoiceId = validated.metadata?.invoice_id as string | undefined;
    if (!invoiceId) {
      return { valid: false, error: 'invoice_id requis pour le renouvellement' };
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: invoice, error } = await supabase
      .from('subscription_invoices')
      .select('id, amount, currency, status, store_id')
      .eq('id', invoiceId)
      .maybeSingle();

    if (error || !invoice) {
      return { valid: false, error: 'Facture introuvable' };
    }
    if (invoice.status !== 'pending') {
      return { valid: false, error: 'Facture déjà traitée' };
    }
    if (validated.storeId && invoice.store_id !== validated.storeId) {
      return { valid: false, error: 'Boutique invalide pour cette facture' };
    }

    const expected = Math.round(Number(invoice.amount) * 100) / 100;
    const invoiceCurrency = (invoice.currency as string) || 'USD';
    const clientCurrency = validated.currency || invoiceCurrency;

    if (
      !isAuthorizedPlanCheckoutAmount(expected, invoiceCurrency, validated.amount, clientCurrency)
    ) {
      return { valid: false, error: 'Montant invalide pour cette facture' };
    }

    return {
      valid: true,
      amount: resolveAuthorizedCheckoutAmount(
        expected,
        invoiceCurrency,
        validated.amount,
        clientCurrency
      ),
      currency: clientCurrency,
    };
  }

  const needsDbLookup = !!(
    validated.productId ||
    (orderIdFromMeta && isValidUUID(String(orderIdFromMeta)))
  );

  if (!needsDbLookup) {
    return { valid: true, amount: validated.amount, currency: validated.currency };
  }

  if (!supabaseUrl || !serviceKey) {
    console.error(
      '[GeniusPay] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for amount resolution'
    );
    return {
      valid: false,
      error: 'Configuration serveur incomplète pour la validation du paiement',
    };
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  if (orderIdFromMeta && isValidUUID(String(orderIdFromMeta))) {
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, currency, store_id, payment_status')
      .eq('id', orderIdFromMeta)
      .single();

    if (error || !order) {
      return { valid: false, error: 'Commande introuvable' };
    }

    if (validated.storeId && order.store_id !== validated.storeId) {
      return { valid: false, error: 'La boutique ne correspond pas à la commande' };
    }

    const { resolveOrderExpectedPayableAmount } = await import(
      '../_shared/complete-order-payment.ts'
    );
    const payable = await resolveOrderExpectedPayableAmount(supabase, String(orderIdFromMeta));
    if (!payable.valid || payable.expectedAmount == null) {
      return { valid: false, error: 'Commande introuvable' };
    }

    const expected = Math.round(payable.expectedAmount);
    if (Math.round(validated.amount) !== expected) {
      console.warn('[GeniusPay] Order amount mismatch', {
        clientAmount: validated.amount,
        serverAmount: expected,
        orderId: orderIdFromMeta,
      });
      return { valid: false, error: 'Montant invalide pour cette commande' };
    }

    return {
      valid: true,
      amount: expected,
      currency: (order.currency as string) || payable.currency || validated.currency,
    };
  }

  if (validated.productId) {
    const { data: product, error } = await supabase
      .from('products')
      .select('id, store_id, price, promotional_price, currency, is_active, is_draft')
      .eq('id', validated.productId)
      .single();

    if (error || !product) {
      return { valid: false, error: 'Produit introuvable' };
    }

    if (!product.is_active || product.is_draft) {
      return { valid: false, error: 'Produit non disponible à la vente' };
    }

    if (validated.storeId && product.store_id !== validated.storeId) {
      return { valid: false, error: 'La boutique ne correspond pas au produit' };
    }

    const expected = getEffectiveProductPrice(
      Number(product.price),
      product.promotional_price != null ? Number(product.promotional_price) : null
    );

    if (Math.round(validated.amount) !== expected) {
      console.warn('[GeniusPay] Product amount mismatch', {
        clientAmount: validated.amount,
        serverAmount: expected,
        productId: validated.productId,
      });
      return { valid: false, error: 'Montant invalide pour ce produit' };
    }

    return {
      valid: true,
      amount: expected,
      currency: (product.currency as string) || validated.currency,
    };
  }

  return { valid: true, amount: validated.amount, currency: validated.currency };
}

// Fonction pour déterminer l'origine autorisée pour CORS
function getCorsOrigin(req: Request): string {
  const origin = req.headers.get('origin');
  const siteUrl = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
  const allowedOriginsFromEnv = (Deno.env.get('ALLOWED_ORIGINS') || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);

  // Autoriser localhost pour le développement
  if (
    origin &&
    (origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1'))
  ) {
    return origin; // Autoriser l'origine exacte pour localhost
  }

  // Autoriser le domaine principal et ses sous-domaines
  if (origin) {
    // Liste blanche explicite optionnelle via ALLOWED_ORIGINS
    if (allowedOriginsFromEnv.includes(origin)) {
      return origin;
    }

    // Autoriser emarzona.com et www.emarzona.com
    if (
      origin === siteUrl ||
      origin === `${siteUrl}/` ||
      origin === `https://www.emarzona.com` ||
      origin === `https://www.emarzona.com/`
    ) {
      return origin;
    }

    // Autoriser api.emarzona.com (sous-domaine API)
    if (origin === 'https://api.emarzona.com' || origin === 'https://api.emarzona.com/') {
      return origin;
    }

    // Autoriser strictement les sous-domaines *.emarzona.com et *.myemarzona.shop
    try {
      const parsedOrigin = new URL(origin);
      if (
        parsedOrigin.hostname.endsWith('.emarzona.com') ||
        parsedOrigin.hostname.endsWith('.myemarzona.shop')
      ) {
        return origin;
      }
    } catch {
      // Origin invalide: fallback vers siteUrl
    }
  }

  // Par défaut, utiliser SITE_URL (sans slash final)
  return siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
}

// Fonction pour créer les headers CORS dynamiques
function getCorsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature, x-checkout-token',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

// URL de base de l'API GeniusPay
// Vérifier la documentation officielle pour l'URL correcte
const GENIUSPAY_API_URL = Deno.env.get('GENIUSPAY_API_URL') || 'https://geniuspay.ci/api/v1/merchant';

serve(async req => {
  // Log de début de requête pour diagnostic
  console.log('[GeniusPay Edge Function] Request received:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
  });

  // Créer les headers CORS dynamiques basés sur l'origine de la requête
  const corsHeaders = getCorsHeaders(req);

  // Log de l'origine et des headers CORS pour diagnostic
  const origin = req.headers.get('origin');
  console.log('[GeniusPay Edge Function] CORS config:', {
    origin,
    allowedOrigin: corsHeaders['Access-Control-Allow-Origin'],
    method: req.method,
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[GeniusPay Edge Function] Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier les clés API
    const geniuspayApiKey = Deno.env.get('GENIUSPAY_API_KEY');
    if (!geniuspayApiKey) {
      console.error('GENIUSPAY_API_KEY is not configured');
      return new Response(
        JSON.stringify({
          error: 'Configuration API manquante',
          message: "La clé API GeniusPay n'est pas configurée dans Supabase Edge Functions Secrets",
          hint: 'Veuillez configurer GENIUSPAY_API_KEY dans Supabase Dashboard → Edge Functions → Secrets',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parser le JSON de la requête
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (jsonError) {
      console.error('Error parsing request JSON:', jsonError);
      return new Response(
        JSON.stringify({
          error: 'Requête invalide',
          message: "Le corps de la requête n'est pas un JSON valide",
          details: jsonError instanceof Error ? jsonError.message : 'Unknown error',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, data } = requestBody;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action manquante', message: 'Le paramètre "action" est requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Valider que l'action est supportée
    const supportedActions = [
      'create_payment',
      'get_payment',
      'create_checkout',
      'verify_payment',
      'refund_payment',
      'cancel_payment',
    ];
    if (!supportedActions.includes(action)) {
      return new Response(
        JSON.stringify({
          error: 'Action non supportée',
          message: `L'action "${action}" n'est pas supportée`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[GeniusPay Edge Function] Processing request:', {
      action,
      hasData: !!data,
      ...sanitizeGeniusPayRequestLog(
        typeof data === 'object' && data ? (data as Record<string, unknown>) : undefined
      ),
      dataKeys:
        data && typeof data === 'object' ? Object.keys(data as Record<string, unknown>) : [],
    });

    let endpoint = '';
    let method = 'POST';
    let body = data;
    let localTxId: string | undefined;

    // Route vers les différents endpoints GeniusPay
    switch (action) {
      case 'create_payment':
        endpoint = '/payments';
        method = 'POST';
        break;

      case 'get_payment': {
        const validation = validatePaymentId(data);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({
              error: 'Validation échouée',
              message: validation.error || 'paymentId invalide',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = `/payments/${validation.paymentId}`;
        method = 'GET';
        body = null;
        break;
      }

      case 'create_checkout': {
        // Validation serveur stricte
        const validation = validateCreateCheckout(data);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({
              error: 'Validation échouée',
              message: validation.error || 'Données invalides',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const validatedData = validation.validated!;

        const orderIdForAuth =
          validatedData.orderId ||
          (validatedData.metadata?.order_id as string | undefined) ||
          (validatedData.metadata?.orderId as string | undefined);

        if (orderIdForAuth && validatedData.storeId) {
          const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
          const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
          if (!supabaseUrl || !serviceKey) {
            return new Response(
              JSON.stringify({
                error: 'Configuration serveur incomplète',
                message: 'Impossible de valider la commande',
              }),
              { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const rateLimit = await enforceRateLimit(
            createClient(supabaseUrl, serviceKey),
            getClientIp(req),
            'checkout',
            RATE_LIMIT_PRESETS.checkout
          );
          if (!rateLimit.allowed) {
            return new Response(
              JSON.stringify({
                error: 'Trop de tentatives de paiement',
                message: 'Veuillez patienter avant de réessayer.',
              }),
              {
                status: rateLimit.degraded ? 503 : 429,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          const checkoutToken =
            (validatedData.metadata?.checkout_token as string | undefined) ||
            req.headers.get('x-checkout-token') ||
            undefined;

          const checkoutAuth = await authorizeCheckoutOrder(
            createClient(supabaseUrl, serviceKey),
            req,
            orderIdForAuth,
            validatedData.storeId,
            validatedData.amount,
            checkoutToken
          );
          if (checkoutAuth.ok === false) {
            return new Response(
              JSON.stringify({
                error: 'Accès checkout refusé',
                message: checkoutAuth.error,
              }),
              {
                status: checkoutAuth.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
        }

        const amountResolution = await resolveAuthorizedPaymentAmount(validatedData);
        if (!amountResolution.valid) {
          return new Response(
            JSON.stringify({
              error: 'Montant non autorisé',
              message: amountResolution.error || 'Montant invalide',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        validatedData.amount = amountResolution.amount ?? validatedData.amount;
        validatedData.currency = amountResolution.currency ?? validatedData.currency;

        const amountValidationAfterResolve = isValidAmount(
          validatedData.amount,
          validatedData.currency
        );
        if (!amountValidationAfterResolve.valid) {
          return new Response(
            JSON.stringify({
              error: 'Validation échouée',
              message: amountValidationAfterResolve.error || 'Montant invalide',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Endpoint correct selon la documentation GeniusPay
        // Documentation : https://docs.geniuspay.io/
        endpoint = '/payments';
        method = 'POST';
        // Formater les données selon le format attendu par GeniusPay
        // Documentation GeniusPay : customer doit avoir first_name et last_name séparés
        // IMPORTANT: last_name ne peut pas être vide, donc on doit gérer les cas où customer_name est vide ou ne contient qu'un mot
        let customerName = (validatedData.customer_name || '').trim();
        let firstName = '';
        let lastName = '';

        // Si customer_name est vide, utiliser l'email comme base
        if (!customerName && validatedData.customer_email) {
          customerName = validatedData.customer_email.split('@')[0] || 'Client';
        }

        // Si customer_name est toujours vide, utiliser une valeur par défaut
        if (!customerName) {
          customerName = 'Client';
        }

        // Diviser le nom en first_name et last_name
        const customerNameParts = customerName.split(' ').filter(part => part.trim().length > 0);

        if (customerNameParts.length === 0) {
          // Cas improbable mais sécurisé
          firstName = 'Client';
          lastName = 'GeniusPay';
        } else if (customerNameParts.length === 1) {
          // Un seul mot: utiliser ce mot pour first_name et "Client" pour last_name
          firstName = customerNameParts[0];
          lastName = 'Client';
        } else {
          // Plusieurs mots: premier mot = first_name, reste = last_name
          firstName = customerNameParts[0];
          lastName = customerNameParts.slice(1).join(' ');
        }

        // S'assurer que first_name et last_name ne sont jamais vides
        firstName = firstName.trim() || 'Client';
        lastName = lastName.trim() || 'Client';

        console.log('[GeniusPay Edge Function] Customer name processing:', {
          hasCustomerName: !!customerName,
          namePartCount: customerNameParts.length,
          customerEmailMasked: maskEmail(
            typeof data === 'object' && data
              ? String((data as Record<string, unknown>).customer_email ?? '')
              : undefined
          ),
        });

        // Construire metadata en incluant productId et storeId si présents
        // L'API GeniusPay n'accepte que des chaînes dans metadata
        const rawMetadata = validatedData.metadata || {};

        // === CREATION DE LA TRANSACTION LOCALE SECURISEE ===
        const supabaseUrlTx = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceKeyTx = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        if (supabaseUrlTx && serviceKeyTx) {
          const supabaseTx = createClient(supabaseUrlTx, serviceKeyTx);

          const authHeader = req.headers.get('Authorization');
          let userId = null;
          if (authHeader) {
            try {
              const { data: { user } } = await supabaseTx.auth.getUser(authHeader.replace('Bearer ', ''));
              userId = user?.id;
            } catch (e) {
              console.warn('[GeniusPay Edge Function] Failed to get user from token', e);
            }
          }

          const txData = {
            store_id: validatedData.storeId,
            product_id: validatedData.productId || null,
            order_id: validatedData.orderId || null,
            user_id: userId || rawMetadata.userId || rawMetadata.customerId || null,
            amount: validatedData.amount,
            currency: validatedData.currency,
            payment_provider: 'geniuspay',
            status: 'pending',
            customer_email: validatedData.customer_email,
            customer_name: validatedData.customer_name || null,
            customer_phone: validatedData.customer_phone || null,
            metadata: rawMetadata
          };

          const { data: insertedTx, error: txError } = await supabaseTx
            .from('transactions')
            .insert([txData])
            .select('id')
            .single();

          if (txError || !insertedTx) {
            console.error('[GeniusPay Edge Function] Failed to create local transaction', txError);
            return new Response(
              JSON.stringify({ error: 'Erreur interne', message: 'Impossible de créer la transaction locale' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          localTxId = insertedTx.id;
          console.log('[GeniusPay Edge Function] Local transaction created:', localTxId);
        } else {
          console.warn('[GeniusPay Edge Function] Missing Supabase credentials, skipping local transaction creation');
        }
        // ====================================================

        const metadata = limitGeniusPayMetadata(
          sanitizeGeniusPayMetadata({
            ...rawMetadata,
            ...(localTxId ? { transaction_id: localTxId } : {}),
            ...(validatedData.productId ? { product_id: validatedData.productId } : {}),
            ...(validatedData.storeId ? { store_id: validatedData.storeId } : {}),
          })
        );

        // Utiliser les données validées (montant et devise déjà validés)
        const amount = validatedData.amount;
        const currency = validatedData.currency;
        const description = validatedData.description?.trim() || 'Paiement Emarzona';

        if (!validatedData.return_url) {
          return new Response(
            JSON.stringify({
              error: 'Validation échouée',
              message: 'return_url est requis pour initialiser un paiement GeniusPay',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        let returnUrlStr = validatedData.return_url;
        let cancelUrlStr = validatedData.cancel_url;

        if (localTxId) {
          try {
            const returnUrl = new URL(validatedData.return_url);
            returnUrl.searchParams.set('transaction_id', localTxId);
            returnUrlStr = returnUrl.toString();
          } catch (e) {
            returnUrlStr = validatedData.return_url + (validatedData.return_url.includes('?') ? '&' : '?') + `transaction_id=${localTxId}`;
          }

          if (cancelUrlStr) {
            try {
              const curl = new URL(cancelUrlStr);
              curl.searchParams.set('transaction_id', localTxId);
              cancelUrlStr = curl.toString();
            } catch (e) {
              cancelUrlStr = cancelUrlStr + (cancelUrlStr.includes('?') ? '&' : '?') + `transaction_id=${localTxId}`;
            }
          }
        }

        const customerCountryRaw =
          validatedData.customer_country ||
          (validatedData.metadata?.customerCountry as string | undefined) ||
          (validatedData.metadata?.customer_country as string | undefined);
        const customerCountryIso2 = resolveCountryIso2(customerCountryRaw);
        const customerPhone = validatedData.customer_phone
          ? normalizePhoneForGeniusPay(validatedData.customer_phone, customerCountryRaw)
          : undefined;

        let paymentMethod = resolveGeniusPayPaymentMethod(validatedData.payment_method);
        const mmoProvider = validatedData.mmo_provider?.trim() || undefined;

        // PawaPay ne couvre que 12 pays (indicatifs ci-dessous). Pour les autres
        // (ex: Burkina Faso +226), on omet payment_method → page checkout GeniusPay.
        // Docs: https://geniuspay.ci/docs/api (BJ, CM, CI, CD, GA, KE, CG, RW, SN, SL, UG, ZM)
        const PAWAPAY_DIAL_CODES = [
          '229', // Bénin
          '237', // Cameroun
          '225', // Côte d'Ivoire
          '243', // RD Congo
          '241', // Gabon
          '254', // Kenya
          '242', // Congo
          '250', // Rwanda
          '221', // Sénégal
          '232', // Sierra Leone
          '256', // Ouganda
          '260', // Zambie
        ];
        if (paymentMethod === 'pawapay') {
          const phoneDigits = (customerPhone || '').replace(/\D/g, '');
          const pawapaySupported =
            phoneDigits.length > 0 &&
            PAWAPAY_DIAL_CODES.some(code => phoneDigits.startsWith(code));
          if (!pawapaySupported) {
            console.log(
              '[GeniusPay Edge Function] Phone not covered by PawaPay, using GeniusPay checkout page',
              { phoneDialCode: phoneDigits.slice(0, 3) || null }
            );
            paymentMethod = undefined;
          }
        }

        // Docs GeniusPay: success_url / error_url. On envoie aussi return_url / cancel_url
        // pour compatibilité avec d'éventuels alias d'API.
        body = {
          amount: amount, // Déjà validé et arrondi
          currency: currency,
          description,
          customer: {
            email: validatedData.customer_email,
            first_name: firstName,
            last_name: lastName,
            name: `${firstName} ${lastName}`.trim(),
            ...(customerPhone && { phone: customerPhone }),
            ...(customerCountryIso2 && { country: customerCountryIso2 }),
          },
          success_url: returnUrlStr,
          return_url: returnUrlStr,
          ...(cancelUrlStr && { error_url: cancelUrlStr, cancel_url: cancelUrlStr }),
          metadata: metadata,
          ...(paymentMethod && { payment_method: paymentMethod }),
          ...(mmoProvider && { mmo_provider: mmoProvider }),
        };

        console.log('[GeniusPay Edge Function] Payment method routing:', {
          payment_method: paymentMethod ?? 'checkout_page',
          hasMmoProvider: !!mmoProvider,
          customerCountry: customerCountryIso2 ?? null,
          hasPhone: !!customerPhone,
        });
        break;
      }

      case 'verify_payment': {
        const validation = validatePaymentId(data);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({
              error: 'Validation échouée',
              message: validation.error || 'paymentId invalide',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = `/payments/${validation.paymentId}/verify`;
        method = 'GET';
        body = null;
        break;
      }

      case 'refund_payment': {
        const validation = validateRefundPayment(data);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({
              error: 'Validation échouée',
              message: validation.error || 'Données invalides',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = `/payments/${validation.validated!.paymentId}/refund`;
        method = 'POST';
        // Si amount n'est pas spécifié, c'est un remboursement total
        body = {
          ...(validation.validated!.amount && { amount: validation.validated!.amount }),
          reason: validation.validated!.reason || 'Customer request',
        };
        break;
      }

      case 'cancel_payment': {
        const validation = validatePaymentId(data);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({
              error: 'Validation échouée',
              message: validation.error || 'paymentId invalide',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = `/payments/${validation.paymentId}/cancel`;
        method = 'POST';
        body = null;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Action non supportée' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Appel à l'API GeniusPay
    const geniuspayApiUrl = `${GENIUSPAY_API_URL}${endpoint}`;
    console.log('[GeniusPay Edge Function] Calling GeniusPay API:', {
      url: geniuspayApiUrl,
      method,
      hasBody: !!body,
    });

    let geniuspayResponse: Response;
    try {
      geniuspayResponse = await fetch(geniuspayApiUrl, {
        method,
        headers: {
          Authorization: `Bearer ${geniuspayApiKey}`,
          'X-API-Key': geniuspayApiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json', // Requis selon la documentation GeniusPay
        },
        body: body ? JSON.stringify(body) : null,
      });
    } catch (fetchError: any) {
      console.error('[GeniusPay Edge Function] Fetch error (network/connection):', {
        error: fetchError.message,
        errorName: fetchError.name,
        url: geniuspayApiUrl,
        method,
      });

      return new Response(
        JSON.stringify({
          error: 'Erreur de connexion GeniusPay',
          message: `Impossible de se connecter à l'API GeniusPay: ${fetchError.message}`,
          details: {
            url: geniuspayApiUrl,
            method,
            error: fetchError.message,
            errorName: fetchError.name,
          },
          troubleshooting: {
            step1: 'Vérifiez votre connexion Internet',
            step2: "Vérifiez que l'URL GeniusPay est correcte",
            step3: 'Vérifiez que GENIUSPAY_API_KEY est valide',
            step4: 'Vérifiez les logs Supabase Edge Functions pour plus de détails',
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Récupérer le Content-Type de la réponse
    const contentType = geniuspayResponse.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    console.log(
      '[GeniusPay Edge Function] GeniusPay API response:',
      sanitizeGeniusPayApiResponseLog(geniuspayResponse.status, isJson)
    );

    // Parser la réponse JSON avec gestion d'erreur améliorée
    let responseData;
    let responseText = '';

    try {
      responseText = await geniuspayResponse.text();

      console.log('[GeniusPay Edge Function] Response body:', {
        length: responseText.length,
        startsWithJson: responseText.trim().startsWith('{') || responseText.trim().startsWith('['),
      });

      // Si la réponse est vide, créer un objet vide
      if (!responseText || responseText.trim() === '') {
        console.warn('[GeniusPay Edge Function] Empty response from GeniusPay API');
        responseData = {};
      }
      // Si le Content-Type n'est pas JSON mais la réponse commence par { ou [, essayer de parser quand même
      else if (
        !isJson &&
        (responseText.trim().startsWith('{') || responseText.trim().startsWith('['))
      ) {
        console.warn(
          '[GeniusPay Edge Function] Content-Type is not JSON but response looks like JSON, attempting to parse'
        );
        try {
          responseData = JSON.parse(responseText);
        } catch (jsonError: any) {
          console.error('[GeniusPay Edge Function] Failed to parse JSON-like response:', {
            error: jsonError.message,
            responseLength: responseText.length,
          });
          throw jsonError;
        }
      }
      // Si le Content-Type indique JSON, parser normalement
      else if (isJson) {
        responseData = JSON.parse(responseText);
      }
      // Si la réponse est HTML (erreur serveur), extraire le message
      else if (contentType.includes('text/html')) {
        console.error(
          '[GeniusPay Edge Function] Received HTML response instead of JSON (likely server error)'
        );
        // Essayer d'extraire un message d'erreur du HTML
        const titleMatch = responseText.match(/<title[^>]*>([^<]+)<\/title>/i);
        const errorMessage = titleMatch ? titleMatch[1] : 'Erreur serveur GeniusPay';
        responseData = {
          error: 'Server Error',
          message: errorMessage,
          htmlResponse: true,
        };
      }
      // Autre type de contenu
      else {
        console.warn('[GeniusPay Edge Function] Unexpected content type, treating as text');
        responseData = {
          error: 'Unexpected Response',
          message: `GeniusPay API returned ${contentType} instead of JSON`,
          responseLength: responseText.length,
        };
      }
    } catch (parseError: any) {
      console.error('[GeniusPay Edge Function] Error parsing GeniusPay response:', {
        error: parseError.message,
        errorName: parseError.name,
        status: geniuspayResponse.status,
        contentType,
        responseLength: responseText.length,
      });

      // Retourner une erreur détaillée avec le contenu brut pour debugging
      return new Response(
        JSON.stringify({
          error: 'Erreur de réponse GeniusPay',
          message: "Impossible de parser la réponse de l'API GeniusPay",
          details: {
            parseError: parseError.message,
            status: geniuspayResponse.status,
            statusText: geniuspayResponse.statusText,
            contentType,
            responseLength: responseText.length,
          },
          troubleshooting: {
            step1: 'Vérifiez les logs Supabase Edge Functions pour voir la réponse complète',
            step2: 'Vérifiez que GENIUSPAY_API_KEY est correctement configuré',
            step3: "Vérifiez que l'endpoint GeniusPay est accessible",
            step4: 'Vérifiez que les données envoyées sont valides',
          },
        }),
        {
          status: geniuspayResponse.status || 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // PawaPay ne couvre pas tous les pays (ex: Burkina Faso +226) et peut échouer
    // à prédire l'opérateur. Dans ce cas, on réessaie SANS payment_method pour
    // obtenir la page de checkout GeniusPay hébergée (le client choisit sa méthode).
    if (!geniuspayResponse.ok && action === 'create_checkout') {
      const routingErrorMessage = String(
        responseData?.message ??
          (typeof responseData?.error === 'object' && responseData?.error !== null
            ? (responseData.error as { message?: unknown }).message
            : responseData?.error) ??
          ''
      );
      const bodyHasPaymentMethod =
        body && typeof body === 'object' && 'payment_method' in (body as Record<string, unknown>);
      const isProviderRoutingError =
        bodyHasPaymentMethod &&
        /unable to predict provider|provide a provider code|country_not_supported|country not supported/i.test(
          routingErrorMessage
        );

      if (isProviderRoutingError) {
        console.warn(
          '[GeniusPay Edge Function] PawaPay routing failed, retrying via GeniusPay checkout page',
          { message: routingErrorMessage.slice(0, 200) }
        );

        const fallbackBody: Record<string, unknown> = { ...(body as Record<string, unknown>) };
        delete fallbackBody.payment_method;
        delete fallbackBody.mmo_provider;

        try {
          const fallbackResponse = await fetch(geniuspayApiUrl, {
            method,
            headers: {
              Authorization: `Bearer ${geniuspayApiKey}`,
              'X-API-Key': geniuspayApiKey,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(fallbackBody),
          });

          const fallbackText = await fallbackResponse.text();
          let fallbackData: Record<string, unknown> | undefined;
          try {
            fallbackData = fallbackText ? JSON.parse(fallbackText) : undefined;
          } catch {
            fallbackData = undefined;
          }

          if (fallbackResponse.ok && fallbackData) {
            console.log(
              '[GeniusPay Edge Function] Fallback to GeniusPay checkout page succeeded'
            );
            geniuspayResponse = fallbackResponse;
            responseData = fallbackData;
          } else {
            console.error('[GeniusPay Edge Function] Checkout page fallback also failed', {
              status: fallbackResponse.status,
            });
            if (fallbackData) {
              responseData = fallbackData;
            }
          }
        } catch (fallbackError) {
          console.error('[GeniusPay Edge Function] Checkout page fallback fetch error', {
            error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          });
        }
      }
    }

    if (!geniuspayResponse.ok) {
      if (localTxId && action === 'create_checkout') {
        const supabaseUrlTx = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceKeyTx = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        if (supabaseUrlTx && serviceKeyTx) {
          const supabaseTx = createClient(supabaseUrlTx, serviceKeyTx);
          await supabaseTx.from('transactions').update({ status: 'failed' }).eq('id', localTxId);
        }
      }

      const geniuspayErrorMessage =
        responseData?.message ||
        responseData?.error ||
        (typeof responseData?.errors === 'object'
          ? JSON.stringify(responseData.errors)
          : undefined) ||
        "Erreur lors de l'appel à l'API GeniusPay";

      console.error('GeniusPay API error:', {
        status: geniuspayResponse.status,
        hasResponseData: !!responseData,
        message: geniuspayErrorMessage,
      });
      return new Response(
        JSON.stringify({
          error: 'Erreur GeniusPay API',
          message: geniuspayErrorMessage,
          details: responseData,
          status: geniuspayResponse.status,
        }),
        {
          status: geniuspayResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('GeniusPay response success:', { action, status: geniuspayResponse.status });

    if (action === 'create_checkout' && localTxId && responseData) {
      const gpPayload =
        responseData.data && typeof responseData.data === 'object' ? responseData.data : responseData;
      const gpId =
        gpPayload?.id ||
        gpPayload?.transaction_id ||
        gpPayload?.reference ||
        responseData.id ||
        responseData.transaction_id;
      // Avec payment_method → payment_url ; sans → checkout_url
      const gpUrl =
        gpPayload?.payment_url ||
        gpPayload?.checkout_url ||
        gpPayload?.url ||
        responseData.payment_url ||
        responseData.checkout_url;
      
      const supabaseUrlTx = Deno.env.get('SUPABASE_URL') ?? '';
      const serviceKeyTx = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      if (supabaseUrlTx && serviceKeyTx && gpId) {
        const supabaseTx = createClient(supabaseUrlTx, serviceKeyTx);
        
        const { error: updateErr } = await supabaseTx.from('transactions').update({
          geniuspay_transaction_id: gpId,
          geniuspay_checkout_url: gpUrl,
          geniuspay_response: responseData,
          status: 'processing'
        }).eq('id', localTxId);
        
        if (updateErr) {
          console.error('[GeniusPay Edge Function] Failed to update local transaction with GeniusPay details', updateErr);
        }
      }
      
      if (typeof responseData === 'object') {
        responseData._local_transaction_id = localTxId;
      }
    }

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne inconnue';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('Error in geniuspay function:', {
      message: errorMessage,
      stack: errorStack,
      error: error,
    });

    return new Response(
      JSON.stringify({
        error: 'Erreur interne Edge Function',
        message: errorMessage,
        hint: 'Vérifiez les logs Supabase Edge Functions pour plus de détails',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

