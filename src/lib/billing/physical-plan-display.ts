import type { PhysicalPlanSlug } from '@/lib/billing/physical-plan-capabilities';
import { PHYSICAL_PLAN_PRICES_XOF } from '@/lib/billing/platform-pricing';

export type PhysicalPlanDisplaySlug = Exclude<PhysicalPlanSlug, null>;

export const PHYSICAL_PLAN_DISPLAY: Record<
  PhysicalPlanDisplaySlug,
  { label: string; tagline: string; price: number }
> = {
  physical_basic: {
    label: 'Starter',
    tagline: 'Lancement e-commerce physique',
    price: PHYSICAL_PLAN_PRICES_XOF.basic,
  },
  physical_standard: {
    label: 'Professional',
    tagline: 'Logistique & fournisseurs',
    price: PHYSICAL_PLAN_PRICES_XOF.standard,
  },
  physical_premium: {
    label: 'Enterprise',
    tagline: 'Entrepôts & expédition avancée',
    price: PHYSICAL_PLAN_PRICES_XOF.premium,
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
  price: info.price,
}));

export function physicalPlanLabel(slug: PhysicalPlanSlug | string | null | undefined): string {
  if (!slug || !(slug in PHYSICAL_PLAN_DISPLAY)) return 'Physique';
  return PHYSICAL_PLAN_DISPLAY[slug as PhysicalPlanDisplaySlug].label;
}
