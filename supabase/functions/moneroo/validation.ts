/**
 * Validation serveur pour l'Edge Function Moneroo
 * Utilise des validations strictes pour sécuriser les entrées
 */

// Note: Zod n'est pas disponible dans Deno Edge Functions
// On utilise donc des validations manuelles strictes

export interface CreateCheckoutData {
  amount: number;
  currency: string;
  description?: string;
  customer_email: string;
  customer_name?: string;
  return_url?: string;
  productId?: string;
  storeId?: string;
  metadata?: Record<string, unknown>;
  methods?: string[];
}

export interface RefundPaymentData {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface GetPaymentData {
  paymentId: string;
}

export interface VerifyPaymentData {
  paymentId: string;
}

export interface CancelPaymentData {
  paymentId: string;
}

/**
 * Limites de montant par devise (selon Moneroo)
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

/**
 * Valide les données pour create_checkout
 */
export function validateCreateCheckout(data: unknown): { valid: boolean; error?: string; validated?: CreateCheckoutData } {
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
    return { valid: false, error: 'L\'email du client est requis' };
  }
  if (!isValidEmail(customerEmail)) {
    return { valid: false, error: 'Format d\'email invalide' };
  }

  // Valider description (optionnel mais limité)
  if (d.description && typeof d.description === 'string' && d.description.length > 500) {
    return { valid: false, error: 'La description ne peut pas dépasser 500 caractères' };
  }

  // Valider return_url (optionnel)
  if (d.return_url && typeof d.return_url === 'string' && !isValidUrl(d.return_url)) {
    return { valid: false, error: 'URL de retour invalide' };
  }

  // Valider productId et storeId (optionnels mais doivent être des UUID valides)
  if (d.productId && typeof d.productId === 'string' && !isValidUUID(d.productId)) {
    return { valid: false, error: 'productId doit être un UUID valide' };
  }
  if (d.storeId && typeof d.storeId === 'string' && !isValidUUID(d.storeId)) {
    return { valid: false, error: 'storeId doit être un UUID valide' };
  }

  // Valider metadata (optionnel)
  if (d.metadata && typeof d.metadata !== 'object') {
    return { valid: false, error: 'metadata doit être un objet' };
  }

  return {
    valid: true,
    validated: {
      amount: Math.round(amount),
      currency,
      description: d.description ? String(d.description).substring(0, 500) : undefined,
      customer_email: customerEmail,
      customer_name: d.customer_name ? String(d.customer_name).substring(0, 200) : undefined,
      return_url: d.return_url ? String(d.return_url) : undefined,
      productId: d.productId ? String(d.productId) : undefined,
      storeId: d.storeId ? String(d.storeId) : undefined,
      metadata: d.metadata as Record<string, unknown> | undefined,
      methods: Array.isArray(d.methods) ? d.methods.map(String) : undefined,
    },
  };
}

/**
 * Valide les données pour refund_payment
 */
export function validateRefundPayment(data: unknown): { valid: boolean; error?: string; validated?: RefundPaymentData } {
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
export function validatePaymentId(data: unknown): { valid: boolean; error?: string; paymentId?: string } {
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







