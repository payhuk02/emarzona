/**
 * Règles tarifaires plateforme (Edge Functions) — miroir de src/lib/billing/platform-pricing.ts
 */

export const COMMISSION_ONLY_PRODUCT_TYPES = ['digital', 'service', 'course', 'artist'] as const;

export const SUBSCRIPTION_PRODUCT_TYPE = 'physical' as const;

export interface OrderItemForFee {
  product_type?: string | null;
  total_price?: number | null;
  quantity?: number | null;
  unit_price?: number | null;
}

export interface OrderPlatformFeeResult {
  feeAmount: number;
  commissionableTotal: number;
  physicalTotal: number;
  feePercent: number;
}

export function resolveLineTotal(item: OrderItemForFee): number {
  const totalPrice = Number(item.total_price ?? 0);
  if (totalPrice > 0) {
    return totalPrice;
  }
  return Number(item.quantity ?? 1) * Number(item.unit_price ?? 0);
}

export function isCommissionableProductType(productType: string | null | undefined): boolean {
  if (!productType) {
    return false;
  }
  return (COMMISSION_ONLY_PRODUCT_TYPES as readonly string[]).includes(productType);
}

export function isPhysicalProductType(productType: string | null | undefined): boolean {
  return productType === SUBSCRIPTION_PRODUCT_TYPE;
}

export function computeOrderPlatformFeeAmount(
  items: OrderItemForFee[],
  feePercent: number
): OrderPlatformFeeResult {
  let commissionableTotal = 0;
  let physicalTotal = 0;

  for (const item of items) {
    const lineTotal = resolveLineTotal(item);
    if (lineTotal <= 0) {
      continue;
    }
    if (isCommissionableProductType(item.product_type)) {
      commissionableTotal += lineTotal;
    } else if (isPhysicalProductType(item.product_type)) {
      physicalTotal += lineTotal;
    }
  }

  const normalizedPercent = Math.max(0, Number(feePercent) || 0);
  const feeAmount = roundMoney((commissionableTotal * normalizedPercent) / 100);

  return {
    feeAmount,
    commissionableTotal: roundMoney(commissionableTotal),
    physicalTotal: roundMoney(physicalTotal),
    feePercent: normalizedPercent,
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
