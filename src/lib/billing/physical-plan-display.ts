import type { PhysicalPlanSlug } from '@/lib/billing/physical-plan-capabilities';
import {
  PHYSICAL_PLAN_BASE_CURRENCY,
  PHYSICAL_PLAN_PRICES_USD,
} from '@/lib/billing/platform-pricing';

export type PhysicalPlanDisplaySlug = Exclude<PhysicalPlanSlug, null>;

export const PHYSICAL_PLAN_DISPLAY: Record<
  PhysicalPlanDisplaySlug,
  { label: string; tagline: string; priceUsd: number; currency: typeof PHYSICAL_PLAN_BASE_CURRENCY }
> = {
  physical_basic: {
    label: 'Starter',
    tagline: 'Lancement e-commerce — produits & commandes illimités',
    priceUsd: PHYSICAL_PLAN_PRICES_USD.basic,
    currency: PHYSICAL_PLAN_BASE_CURRENCY,
  },
  physical_standard: {
    label: 'Professional',
    tagline: 'Croissance — marketplace, SEO & marketing email',
    priceUsd: PHYSICAL_PLAN_PRICES_USD.standard,
    currency: PHYSICAL_PLAN_BASE_CURRENCY,
  },
  physical_premium: {
    label: 'Business',
    tagline: 'Scale — IA, multi-entrepôts & support VIP',
    priceUsd: PHYSICAL_PLAN_PRICES_USD.premium,
    currency: PHYSICAL_PLAN_BASE_CURRENCY,
  },
};

export const PHYSICAL_PLAN_CARDS = (
  Object.entries(PHYSICAL_PLAN_DISPLAY) as [
    PhysicalPlanDisplaySlug,
    (typeof PHYSICAL_PLAN_DISPLAY)[PhysicalPlanDisplaySlug],
  ][]
).map(([slug, info]) => ({
  slug,
  label: info.label,
  tagline: info.tagline,
  priceUsd: info.priceUsd,
  currency: info.currency,
  /** @deprecated use priceUsd — compatibilité temporaire */
  price: info.priceUsd,
}));

export function physicalPlanLabel(slug: PhysicalPlanSlug | string | null | undefined): string {
  if (!slug || !(slug in PHYSICAL_PLAN_DISPLAY)) return 'Physique';
  return PHYSICAL_PLAN_DISPLAY[slug as PhysicalPlanDisplaySlug].label;
}
