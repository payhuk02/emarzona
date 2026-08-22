/**
 * Service vertical pricing: category defaults, "À partir de", and UI/DB type mapping.
 *
 * UI uses `hourly`. The legacy RPC `create_public_service_order` compares
 * `pricing_type = 'per_hour'`, so we persist hourly as `per_hour`.
 */

export type ServiceUiPricingType = 'fixed' | 'hourly' | 'per_participant';
export type ServicePersistedPricingType = 'fixed' | 'hourly' | 'per_hour' | 'per_participant';

export type ServiceDisplayPrice = {
  amount: number;
  originalAmount?: number;
  showStartingFrom: boolean;
  pricingType: ServiceUiPricingType;
  unitSuffix: string | null;
  unitLabel: string;
};

export type ServicePricingGuidance = {
  pricingType: ServiceUiPricingType;
  showStartingFrom: boolean;
  wizardHint: string;
  catalogHint: string;
};

const UNIT_SUFFIX: Record<ServiceUiPricingType, string | null> = {
  fixed: null,
  hourly: '/ h',
  per_participant: '/ pers.',
};

const UNIT_LABEL: Record<ServiceUiPricingType, string> = {
  fixed: 'Prix fixe',
  hourly: 'Tarif horaire',
  per_participant: 'Par participant',
};

const STARTING_FROM_PROJECT_HINT =
  'Le prix d’entrée s’affiche « À partir de ». Les formules (Basic / Standard / Premium), extras et brief se configurent dans Dashboard → Offres projet et restent consultables sur la fiche produit.';

const FAMILY_PRICING_GUIDANCE: Record<string, ServicePricingGuidance> = {
  'svc-informatique-technologie': {
    pricingType: 'fixed',
    showStartingFrom: true,
    wizardHint: STARTING_FROM_PROJECT_HINT,
    catalogHint: 'Prestation sur projet — tarif d’entrée, formules personnalisables.',
  },
  'svc-design-creation': {
    pricingType: 'fixed',
    showStartingFrom: true,
    wizardHint: STARTING_FROM_PROJECT_HINT,
    catalogHint: 'Création sur brief — tarif d’entrée, formules et révisions.',
  },
  'svc-marketing-communication': {
    pricingType: 'fixed',
    showStartingFrom: true,
    wizardHint:
      'Prix d’entrée affiché « À partir de ». Forfaits campagne / extras dans Offres projet ; un RDV reste possible en mode mixte.',
    catalogHint: 'Campagne ou accompagnement — à partir de, forfaits selon le périmètre.',
  },
  'svc-formation-coaching': {
    pricingType: 'hourly',
    showStartingFrom: false,
    wizardHint:
      'Tarif horaire / séance par défaut. Le prix affiché est le tarif d’une heure (ou d’une séance). Un pack de séances peut s’ajouter via Offres projet.',
    catalogHint: 'Séance de coaching / formation — tarif horaire.',
  },
  'svc-redaction-traduction': {
    pricingType: 'fixed',
    showStartingFrom: true,
    wizardHint: STARTING_FROM_PROJECT_HINT,
    catalogHint: 'Livrable écrit — tarif d’entrée selon volume et délai.',
  },
  'svc-photo-video-audiovisuel': {
    pricingType: 'fixed',
    showStartingFrom: true,
    wizardHint:
      'Prix de séance / captation en entrée (« À partir de »). Packages reportage, montage et extras dans Offres projet.',
    catalogHint: 'Captation ou post-production — à partir de, options selon le format.',
  },
  'svc-services-entreprises': {
    pricingType: 'hourly',
    showStartingFrom: true,
    wizardHint:
      'Tarif horaire d’intervention. Un forfait mensuel ou un projet borné se configure dans Offres projet et s’affiche « À partir de ».',
    catalogHint: 'Accompagnement B2B — tarif horaire ou forfait.',
  },
  'svc-maison-services-locaux': {
    pricingType: 'fixed',
    showStartingFrom: false,
    wizardHint:
      'Prix fixe d’intervention. Ajustez le montant selon la surface ou l’urgence ; l’acompte se règle à l’étape Tarification.',
    catalogHint: 'Intervention sur site — prix de la prestation.',
  },
  'svc-beaute-bien-etre': {
    pricingType: 'fixed',
    showStartingFrom: false,
    wizardHint:
      'Prix fixe de la prestation (coupe, soin, massage…). Le type horaire reste disponible si vous facturez à la durée.',
    catalogHint: 'Rendez-vous salon / domicile — prix de la séance.',
  },
  'svc-transport-automobile': {
    pricingType: 'fixed',
    showStartingFrom: false,
    wizardHint: 'Prix fixe de la course ou de l’intervention atelier.',
    catalogHint: 'Course, livraison ou atelier — prix de la prestation.',
  },
  'svc-evenementiel': {
    pricingType: 'per_participant',
    showStartingFrom: true,
    wizardHint:
      'Prix par participant / jauge par défaut. Un forfait événement (date, lieu, extras) se configure dans Offres projet.',
    catalogHint: 'Prestation datée — tarif par personne ou forfait événement.',
  },
  'svc-juridique-administratif': {
    pricingType: 'hourly',
    showStartingFrom: false,
    wizardHint:
      'Tarif horaire de consultation. Un forfait formalités (création de société, contrats) peut s’ajouter via Offres projet.',
    catalogHint: 'Consultation juridique — tarif horaire.',
  },
  'svc-creations': {
    pricingType: 'fixed',
    showStartingFrom: true,
    wizardHint: STARTING_FROM_PROJECT_HINT,
    catalogHint: 'Créations réseaux sociaux — tarif d’entrée selon le volume et le réseau.',
  },
};

export function normalizeServicePricingType(raw?: string | null): ServiceUiPricingType {
  if (raw === 'hourly' || raw === 'per_hour') return 'hourly';
  if (raw === 'per_participant') return 'per_participant';
  return 'fixed';
}

export function toPersistedPricingType(raw?: string | null): ServicePersistedPricingType {
  const ui = normalizeServicePricingType(raw);
  if (ui === 'hourly') return 'per_hour';
  return ui;
}

export function servicePricingUnitSuffix(type: ServiceUiPricingType): string | null {
  return UNIT_SUFFIX[type];
}

export function servicePricingUnitLabel(type: ServiceUiPricingType): string {
  return UNIT_LABEL[type];
}

export function usesStartingFromPrice(args: {
  fulfillmentMode?: string | null;
  packagePrices?: Array<number | null | undefined> | null;
}): boolean {
  const packages = activePackagePrices(args.packagePrices);
  if (packages.length > 0) return true;
  return args.fulfillmentMode === 'project' || args.fulfillmentMode === 'both';
}

export function chargedServiceAmount(
  price?: number | null,
  promotionalPrice?: number | null
): { amount: number; originalAmount?: number } {
  const list = Math.max(0, Number(price) || 0);
  const promo = promotionalPrice == null ? NaN : Number(promotionalPrice);
  if (Number.isFinite(promo) && promo > 0 && promo < list) {
    return { amount: promo, originalAmount: list };
  }
  return { amount: list };
}

export function resolveServiceDisplayPrice(input: {
  price?: number | null;
  promotionalPrice?: number | null;
  pricingType?: string | null;
  fulfillmentMode?: string | null;
  packagePrices?: Array<number | null | undefined> | null;
}): ServiceDisplayPrice {
  const pricingType = normalizeServicePricingType(input.pricingType);
  const charged = chargedServiceAmount(input.price, input.promotionalPrice);
  const packages = activePackagePrices(input.packagePrices);
  const minPackage = packages.length > 0 ? Math.min(...packages) : null;
  const amount = minPackage != null ? minPackage : charged.amount;
  const showStartingFrom = usesStartingFromPrice(input) && amount > 0;

  return {
    amount,
    originalAmount: minPackage != null ? undefined : charged.originalAmount,
    showStartingFrom,
    pricingType,
    unitSuffix: UNIT_SUFFIX[pricingType],
    unitLabel:
      showStartingFrom && pricingType === 'fixed' ? 'Selon la formule' : UNIT_LABEL[pricingType],
  };
}

export function resolveServiceAppointmentUnitPrice(input: {
  price?: number | null;
  promotionalPrice?: number | null;
  pricingType?: string | null;
}): ServiceDisplayPrice {
  const pricingType = normalizeServicePricingType(input.pricingType);
  const charged = chargedServiceAmount(input.price, input.promotionalPrice);
  return {
    amount: charged.amount,
    originalAmount: charged.originalAmount,
    showStartingFrom: false,
    pricingType,
    unitSuffix: UNIT_SUFFIX[pricingType],
    unitLabel: UNIT_LABEL[pricingType],
  };
}

/**
 * Appointment total charged by `create_public_service_order`
 * (promo/list × participants or × duration/60). Project packages are separate.
 */
export function resolveServiceAppointmentCharge(input: {
  price?: number | null;
  promotionalPrice?: number | null;
  pricingType?: string | null;
  durationMinutes?: number | null;
  participants?: number | null;
}): number {
  const unit = chargedServiceAmount(input.price, input.promotionalPrice).amount;
  const type = normalizeServicePricingType(input.pricingType);
  const participants = Math.max(1, Number(input.participants) || 1);
  if (type === 'per_participant') {
    return unit * participants;
  }
  if (type === 'hourly') {
    const minutes = Number(input.durationMinutes);
    const duration = Number.isFinite(minutes) && minutes > 0 ? minutes : 60;
    return unit * (duration / 60);
  }
  return unit;
}

export function getServicePricingGuidance(familySlug?: string | null): ServicePricingGuidance {
  if (familySlug && FAMILY_PRICING_GUIDANCE[familySlug]) {
    return FAMILY_PRICING_GUIDANCE[familySlug];
  }
  return {
    pricingType: 'fixed',
    showStartingFrom: false,
    wizardHint:
      'Choisissez le mode de calcul (fixe, horaire ou par participant) selon la prestation.',
    catalogHint: 'Prix de la prestation.',
  };
}

function activePackagePrices(packagePrices?: Array<number | null | undefined> | null): number[] {
  return (packagePrices ?? [])
    .map(value => Number(value))
    .filter(value => Number.isFinite(value) && value >= 0);
}

/** Prix listing (filtre / tri) : min formule si présent, sinon promo ou catalogue. */
export function resolveServiceListingAmount(input: {
  price?: number | null;
  promotionalPrice?: number | null;
  packageStartingPrice?: number | null;
}): number {
  return resolveServiceDisplayPrice({
    price: input.price,
    promotionalPrice: input.promotionalPrice,
    packagePrices:
      input.packageStartingPrice != null && Number(input.packageStartingPrice) > 0
        ? [Number(input.packageStartingPrice)]
        : undefined,
  }).amount;
}

export function minActiveDeliveryTierPrice(
  packages?: Array<{
    price?: number | null;
    package_price?: number | null;
    package_kind?: string | null;
    is_active?: boolean | null;
  }> | null
): number | null {
  const prices = (packages ?? [])
    .filter(pkg => pkg.package_kind === 'delivery_tier' && pkg.is_active !== false)
    .map(pkg => Number(pkg.price) || Number(pkg.package_price) || 0)
    .filter(value => Number.isFinite(value) && value > 0);
  return prices.length > 0 ? Math.min(...prices) : null;
}
