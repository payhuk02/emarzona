/**
 * Feature flags — orchestration paiements V2
 */

const TRUE_VALUES = new Set(['true', '1', 'yes']);
const FALSE_VALUES = new Set(['false', '0', 'no']);

/**
 * Orchestration multi-PSP (Stripe Connect, PayPal Commerce, Moneroo plateforme).
 * - `VITE_PAYMENT_ORCHESTRATION_V2=true` : activé partout
 * - `VITE_PAYMENT_ORCHESTRATION_V2=false` : désactivé (legacy Moneroo seul)
 * - Non défini + preview Vercel : activé pour QA staging
 */
export function isPaymentOrchestrationV2Enabled(): boolean {
  const env = import.meta.env.VITE_PAYMENT_ORCHESTRATION_V2;
  if (env !== undefined) {
    const normalized = String(env).toLowerCase();
    if (FALSE_VALUES.has(normalized)) return false;
    return TRUE_VALUES.has(normalized);
  }

  const vercelEnv = import.meta.env.VITE_VERCEL_ENV;
  if (vercelEnv === 'preview') return true;

  return false;
}
