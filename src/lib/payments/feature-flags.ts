/**
 * Feature flags — orchestration paiements V2
 */

const TRUE_VALUES = new Set(['true', '1', 'yes']);

export function isPaymentOrchestrationV2Enabled(): boolean {
  const env = import.meta.env.VITE_PAYMENT_ORCHESTRATION_V2;
  return env !== undefined && TRUE_VALUES.has(String(env).toLowerCase());
}
