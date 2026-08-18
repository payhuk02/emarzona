/**
 * Garantie physique : acompte en ligne, solde à la livraison.
 * Le montant configuré est par article ; la quantité multiplie acompte et solde.
 */

export const PHYSICAL_GUARANTEE_MIN_XOF = 201;

export type PhysicalGuaranteeBreakdown = {
  orderTotal: number;
  guaranteeDueNow: number;
  remainderOnDelivery: number;
};

export function roundMoney(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function computePhysicalGuaranteeBreakdown(input: {
  unitPrice: number;
  quantity?: number;
  guaranteeAmount: number;
}): PhysicalGuaranteeBreakdown {
  const qty = Math.max(1, Math.floor(Number(input.quantity) || 1));
  const orderTotal = roundMoney((Number(input.unitPrice) || 0) * qty);
  const guaranteeDueNow = roundMoney((Number(input.guaranteeAmount) || 0) * qty);
  return {
    orderTotal,
    guaranteeDueNow,
    remainderOnDelivery: roundMoney(orderTotal - guaranteeDueNow),
  };
}

export function suggestedGuaranteeAmount(unitPrice: number): number {
  const price = Number(unitPrice) || 0;
  if (price <= 1) return 0;
  const max = roundMoney(price - 1);
  const min = Math.min(PHYSICAL_GUARANTEE_MIN_XOF, max);
  const suggested = roundMoney(price * 0.3);
  return Math.min(max, Math.max(min, suggested));
}

export function validateGuaranteeAmount(
  guaranteeAmount: number,
  unitPrice: number,
  currency = 'XOF'
): string | null {
  const amount = Number(guaranteeAmount);
  const price = Number(unitPrice);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Le montant de garantie doit être supérieur à 0';
  }
  if (!Number.isFinite(price) || price <= 0) {
    return 'Le prix du produit est requis pour configurer une garantie';
  }
  if (amount >= price) {
    return 'La garantie doit être strictement inférieure au prix du produit';
  }
  const code = currency.toUpperCase();
  if ((code === 'XOF' || code === 'XAF') && amount < PHYSICAL_GUARANTEE_MIN_XOF) {
    return `Le montant de garantie minimum est de ${PHYSICAL_GUARANTEE_MIN_XOF} ${code} (paiement en ligne)`;
  }
  return null;
}
