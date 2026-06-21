import type { PhysicalPlanSlug } from '@/lib/billing/physical-plan-capabilities';

/** Limites par plan — miroir de platform_vendor_plans. NULL = illimité. */
export const PHYSICAL_PLAN_LIMITS: Record<
  Exclude<PhysicalPlanSlug, null>,
  {
    maxProducts: number | null;
    maxVariantsPerProduct: number | null;
    maxWarehouses: number | null;
  }
> = {
  physical_basic: {
    maxProducts: null,
    maxVariantsPerProduct: null,
    maxWarehouses: 0,
  },
  physical_standard: {
    maxProducts: null,
    maxVariantsPerProduct: null,
    maxWarehouses: 0,
  },
  physical_premium: {
    maxProducts: null,
    maxVariantsPerProduct: null,
    maxWarehouses: null,
  },
};

export type PhysicalPlanLimitsSnapshot = {
  plan_slug: string | null;
  allowed: boolean;
  max_products: number | null;
  max_variants_per_product: number | null;
  max_warehouses: number | null;
  active_physical_products: number;
  warehouse_count: number;
  features?: Record<string, boolean>;
};

export function isWithinProductLimit(limits: PhysicalPlanLimitsSnapshot, additional = 1): boolean {
  if (limits.max_products == null) return true;
  return limits.active_physical_products + additional <= limits.max_products;
}

export function productLimitMessage(limits: PhysicalPlanLimitsSnapshot): string {
  const max = limits.max_products ?? '∞';
  return `Limite du plan atteinte : ${limits.active_physical_products}/${max} produits physiques actifs. Passez au plan supérieur pour en publier davantage.`;
}

export function variantLimitMessage(max: number): string {
  return `Limite du plan atteinte : ${max} variante(s) maximum par produit sur votre plan actuel.`;
}

export function warehouseLimitMessage(max: number): string {
  if (max === 0) {
    return 'Les entrepôts nécessitent le plan Business.';
  }
  return `Limite du plan atteinte : ${max} entrepôt(s) maximum.`;
}
