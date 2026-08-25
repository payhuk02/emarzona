import type {
  DeliveryPackageTier,
  ServiceDeliveryPackage,
  ServiceGigExtra,
} from '@/lib/services/service-delivery-commerce';

export type ServiceGigPackageDraft = {
  name: string;
  tier: DeliveryPackageTier;
  description: string;
  price: number;
  delivery_days: number;
  revisions: number;
  featuresText: string;
  is_featured: boolean;
};

export function createDefaultGigPackageDrafts(basePrice: number): ServiceGigPackageDraft[] {
  const basic = Math.max(1000, Math.round(Number(basePrice) || 0) || 15000);
  return [
    {
      name: 'Basic',
      tier: 'basic',
      description: 'Offre essentielle',
      price: basic,
      delivery_days: 7,
      revisions: 1,
      featuresText: 'Livrable principal\n1 révision',
      is_featured: false,
    },
    {
      name: 'Standard',
      tier: 'standard',
      description: 'Meilleur rapport qualité/prix',
      price: basic * 2,
      delivery_days: 5,
      revisions: 2,
      featuresText: 'Livrable principal\n2 révisions\nSupport prioritaire',
      is_featured: true,
    },
    {
      name: 'Premium',
      tier: 'premium',
      description: 'Offre complète',
      price: basic * 4,
      delivery_days: 3,
      revisions: 5,
      featuresText: 'Livrable principal\n5 révisions\nSupport prioritaire\nFichiers sources',
      is_featured: false,
    },
  ];
}

export function packagesFromDeliveryRows(rows: ServiceDeliveryPackage[]): ServiceGigPackageDraft[] {
  return rows.map(pkg => ({
    name: pkg.name,
    tier: pkg.tier,
    description: pkg.description ?? '',
    price: pkg.price,
    delivery_days: pkg.delivery_days,
    revisions: pkg.revisions,
    featuresText: pkg.features.join('\n'),
    is_featured: pkg.is_featured,
  }));
}

export function validateGigPackageDrafts(packages: ServiceGigPackageDraft[] | undefined): string[] {
  const priced = (packages || []).filter(
    pkg => pkg.name.trim() && pkg.price > 0 && pkg.delivery_days >= 1
  );
  if (priced.length === 0) {
    return [
      'Ajoutez au moins une formule (Basic, Standard ou Premium) avec un prix et un délai de livraison',
    ];
  }
  return [];
}

export function listingPriceFromPackages(
  packages: ServiceGigPackageDraft[] | undefined
): number | null {
  const prices = (packages || []).map(pkg => pkg.price).filter(price => price > 0);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

/** Align the product list price with the cheapest formula. */
export function applyGigListingPrices(
  payload: { price?: unknown; promotional_price?: unknown },
  packages: ServiceGigPackageDraft[] | undefined,
  pricingModel?: string
): void {
  if (pricingModel === 'free') return;
  const listing = listingPriceFromPackages(packages);
  if (listing == null) return;
  payload.price = listing;
  const promo = Number(payload.promotional_price);
  payload.promotional_price = promo > 0 && promo < listing ? promo : null;
}

export function draftsToReplacePayload(packages: ServiceGigPackageDraft[]) {
  return packages
    .filter(pkg => pkg.name.trim() && pkg.price > 0)
    .map((pkg, index) => ({
      name: pkg.name.trim(),
      tier: pkg.tier,
      description: pkg.description,
      price: pkg.price,
      delivery_days: Math.max(1, pkg.delivery_days),
      revisions: Math.max(0, pkg.revisions),
      features: pkg.featuresText
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean),
      is_featured: pkg.is_featured,
      sort_order: index,
    }));
}

export type ServiceGigExtraDraft = {
  name: string;
  description: string;
  price: number;
  extra_days: number;
};

export function extrasFromGigRows(rows: ServiceGigExtra[]): ServiceGigExtraDraft[] {
  return rows.map(extra => ({
    name: extra.name,
    description: extra.description ?? '',
    price: extra.price,
    extra_days: extra.extra_days,
  }));
}

export function validateGigExtraDrafts(extras: ServiceGigExtraDraft[] | undefined): string[] {
  const errors: string[] = [];
  for (const extra of extras || []) {
    const named = extra.name.trim();
    if (named && extra.price <= 0) {
      errors.push(`L’extra « ${named} » doit avoir un prix`);
    }
    if (!named && extra.price > 0) {
      errors.push('Chaque extra tarifé doit avoir un nom');
    }
  }
  return errors;
}

export function draftsToExtrasPayload(extras: ServiceGigExtraDraft[]) {
  return extras
    .filter(extra => extra.name.trim() && extra.price > 0)
    .map((extra, index) => ({
      name: extra.name.trim(),
      description: extra.description,
      price: extra.price,
      extra_days: Math.max(0, extra.extra_days),
      display_order: index,
    }));
}
