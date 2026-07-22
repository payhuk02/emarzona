/**
 * Feature flags — orchestration paiements V2 + MoneyFusion
 *
 * MoneyFusion est le rail plateforme opérationnel (mobile money XOF).
 * GeniusPay est retiré de la surface produit (historique / edge conservés).
 */

const TRUE_VALUES = new Set(['true', '1', 'yes']);
const FALSE_VALUES = new Set(['false', '0', 'no']);

function viteEnv(name: string): string | undefined {
  const env = import.meta.env as Record<string, string | undefined> | undefined;
  return env?.[name];
}

function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Pourcentage de rollout canary (0–100). Défaut 100 si V2 activé.
 * `VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT=10` → 10 % des boutiques (déterministe par storeId).
 */
export function getPaymentOrchestrationV2RolloutPercent(): number {
  const raw = viteEnv('VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT');
  if (raw === undefined || raw === '') {
    if (!isPaymentOrchestrationV2Enabled()) return 0;
    if (viteEnv('VITE_VERCEL_ENV') === 'production') {
      return 10;
    }
    return 100;
  }
  const parsed = Number.parseInt(String(raw), 10);
  if (Number.isNaN(parsed)) return 100;
  return Math.min(100, Math.max(0, parsed));
}

/**
 * Orchestration multi-PSP (Stripe Connect, PayPal Commerce, MoneyFusion plateforme).
 */
export function isPaymentOrchestrationV2Enabled(): boolean {
  const env = viteEnv('VITE_PAYMENT_ORCHESTRATION_V2');
  if (env !== undefined && env !== '') {
    const normalized = String(env).toLowerCase();
    if (FALSE_VALUES.has(normalized)) return false;
    return TRUE_VALUES.has(normalized);
  }

  const vercelEnv = viteEnv('VITE_VERCEL_ENV');
  if (vercelEnv === 'preview') return true;
  if (vercelEnv === 'production') {
    return true;
  }

  return false;
}

/**
 * V2 activé pour une boutique donnée (respecte le rollout canary).
 */
export function isPaymentOrchestrationV2EnabledForStore(storeId?: string | null): boolean {
  if (!isPaymentOrchestrationV2Enabled()) return false;

  const rollout = getPaymentOrchestrationV2RolloutPercent();
  if (rollout >= 100) return true;
  if (rollout <= 0) return false;
  if (!storeId) return false;

  const bucket = fnv1aHash(storeId) % 100;
  return bucket < rollout;
}

/** GeniusPay retiré de la plateforme (conservé uniquement pour transactions historiques). */
export function isGeniusPayEnabled(): boolean {
  return false;
}

/**
 * MoneyFusion (FusionPay) — rail plateforme opérationnel.
 * Toujours actif (opt-out impossible côté produit).
 */
export function isMoneyFusionEnabled(): boolean {
  return true;
}

/**
 * MoneyFusion uniquement pour le checkout plateforme (mobile money).
 * Masque GeniusPay et interdit tout fallback GeniusPay.
 */
export function isMoneyFusionOnlyEnabled(): boolean {
  return true;
}
