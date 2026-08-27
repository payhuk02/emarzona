import { MONEYFUSION_MIN_AMOUNT_XOF } from '@/lib/moneyfusion-client';

export type ServicePaymentOptions = {
  payment_type?: string | null;
  percentage_rate?: number | null;
} | null;

export type ServiceDepositOptions = {
  deposit_required?: boolean | null;
  deposit_type?: string | null;
  deposit_amount?: number | null;
} | null;

export type ServicePayableResult = {
  paymentType: string;
  percentageRate: number | null;
  amountToPay: number;
  remainingAmount: number;
  totalAmount: number;
};

/**
 * Acompte service = dépôt étape Tarification (prioritaire).
 * payment_options.percentage n’est un fallback que si aucun dépôt.
 * delivery_secured → paiement intégral (suivi sécurisé), pas un acompte.
 */
function resolveDepositPayable(
  total: number,
  deposit?: ServiceDepositOptions
): ServicePayableResult | null {
  if (!deposit?.deposit_required) return null;

  if (deposit.deposit_type === 'percentage') {
    const percentageRate = Math.min(90, Math.max(10, Number(deposit.deposit_amount) || 30));
    const amountToPay = Math.round((total * percentageRate) / 100);
    return {
      paymentType: 'percentage',
      percentageRate,
      amountToPay,
      remainingAmount: Math.max(0, total - amountToPay),
      totalAmount: total,
    };
  }

  if (deposit.deposit_type === 'fixed' && Number(deposit.deposit_amount) > 0) {
    const amountToPay = Math.min(total, Math.round(Number(deposit.deposit_amount)));
    return {
      paymentType: 'percentage',
      percentageRate: null,
      amountToPay,
      remainingAmount: Math.max(0, total - amountToPay),
      totalAmount: total,
    };
  }

  return null;
}

/** MoneyFusion refuse < 201 XOF : on remonte l’acompte ou on force le full. */
export function enforceMoneyFusionPayableFloor(
  payable: ServicePayableResult
): ServicePayableResult {
  const total = payable.totalAmount;
  const min = MONEYFUSION_MIN_AMOUNT_XOF;

  if (payable.amountToPay <= 0 || payable.remainingAmount <= 0) {
    return payable;
  }

  if (payable.amountToPay >= min) {
    return payable;
  }

  if (total < min) {
    return {
      paymentType: 'full',
      percentageRate: null,
      amountToPay: total,
      remainingAmount: 0,
      totalAmount: total,
    };
  }

  const amountToPay = Math.min(total, min);
  return {
    ...payable,
    amountToPay,
    remainingAmount: Math.max(0, total - amountToPay),
  };
}

export function resolveServicePayableAmount(
  totalAmount: number,
  paymentOptions: ServicePaymentOptions,
  deposit?: ServiceDepositOptions
): ServicePayableResult {
  const total = Math.max(0, Number(totalAmount) || 0);

  const fromDeposit = resolveDepositPayable(total, deposit);
  if (fromDeposit) {
    return enforceMoneyFusionPayableFloor(fromDeposit);
  }

  const paymentType = paymentOptions?.payment_type || 'full';

  // Escrow / sécurisé : montant full (statut sécurisé côté commande), pas un acompte.
  if (paymentType === 'delivery_secured') {
    return {
      paymentType: 'delivery_secured',
      percentageRate: null,
      amountToPay: total,
      remainingAmount: 0,
      totalAmount: total,
    };
  }

  if (paymentType === 'percentage') {
    const percentageRate = Math.min(
      90,
      Math.max(10, Number(paymentOptions?.percentage_rate) || 30)
    );
    const amountToPay = Math.round((total * percentageRate) / 100);
    return enforceMoneyFusionPayableFloor({
      paymentType,
      percentageRate,
      amountToPay,
      remainingAmount: Math.max(0, total - amountToPay),
      totalAmount: total,
    });
  }

  return {
    paymentType: 'full',
    percentageRate: null,
    amountToPay: total,
    remainingAmount: 0,
    totalAmount: total,
  };
}

/** Champs orders pour un acompte : percentage_paid = montant dû maintenant (webhook MoneyFusion). */
export function toPartialPaymentOrderFields(payable: {
  paymentType: string;
  amountToPay: number;
  remainingAmount: number;
}): {
  payment_type: 'percentage';
  percentage_paid: number;
  remaining_amount: number;
} | null {
  if (payable.paymentType !== 'percentage' || payable.remainingAmount <= 0) {
    return null;
  }
  return {
    payment_type: 'percentage',
    percentage_paid: payable.amountToPay,
    remaining_amount: payable.remainingAmount,
  };
}
