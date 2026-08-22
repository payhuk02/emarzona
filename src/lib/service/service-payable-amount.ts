export type ServicePaymentOptions = {
  payment_type?: string | null;
  percentage_rate?: number | null;
} | null;

export type ServiceDepositOptions = {
  deposit_required?: boolean | null;
  deposit_type?: string | null;
  deposit_amount?: number | null;
} | null;

function resolveDepositPayable(
  total: number,
  deposit?: ServiceDepositOptions
): {
  paymentType: string;
  percentageRate: number | null;
  amountToPay: number;
  remainingAmount: number;
  totalAmount: number;
} | null {
  if (!deposit?.deposit_required) return null;

  if (deposit.deposit_type === 'percentage') {
    const percentageRate = Math.min(90, Math.max(10, Number(deposit.deposit_amount) || 30));
    const amountToPay = Math.max(1, Math.round((total * percentageRate) / 100));
    return {
      paymentType: 'percentage',
      percentageRate,
      amountToPay,
      remainingAmount: Math.max(0, total - amountToPay),
      totalAmount: total,
    };
  }

  if (deposit.deposit_type === 'fixed' && Number(deposit.deposit_amount) > 0) {
    const amountToPay = Math.min(total, Math.max(1, Math.round(Number(deposit.deposit_amount))));
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

export function resolveServicePayableAmount(
  totalAmount: number,
  paymentOptions: ServicePaymentOptions,
  deposit?: ServiceDepositOptions
): {
  paymentType: string;
  percentageRate: number | null;
  amountToPay: number;
  remainingAmount: number;
  totalAmount: number;
} {
  const total = Math.max(0, Number(totalAmount) || 0);

  const fromDeposit = resolveDepositPayable(total, deposit);
  if (fromDeposit) {
    return fromDeposit;
  }

  const paymentType = paymentOptions?.payment_type || 'full';

  if (paymentType === 'percentage') {
    const percentageRate = Math.min(
      90,
      Math.max(10, Number(paymentOptions?.percentage_rate) || 30)
    );
    const amountToPay = Math.max(1, Math.round((total * percentageRate) / 100));
    return {
      paymentType,
      percentageRate,
      amountToPay,
      remainingAmount: Math.max(0, total - amountToPay),
      totalAmount: total,
    };
  }

  return {
    paymentType,
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
