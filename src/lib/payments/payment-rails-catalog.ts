/**
 * Catalogue agrégateurs / opérateurs paiement plateforme (admin + checkout).
 * Codes Paiement Pro : https://dashboard.paiementpro.net/code-provider
 */

export type PaymentRailAggregatorId =
  | 'moneyfusion'
  | 'paiement_pro'
  | 'stripe_connect'
  | 'paypal_commerce';

export interface PaymentRailOperatorDef {
  id: string;
  label: string;
  kind: 'mobile' | 'card' | 'crypto' | 'wallet' | 'bank';
  /** Code pays ISO-ish / WORLD (Paiement Pro) */
  country?: string;
  countryLabel?: string;
}

export interface PaymentRailAggregatorDef {
  id: PaymentRailAggregatorId;
  label: string;
  description: string;
  operators: PaymentRailOperatorDef[];
  /** Note admin (ex. limites page hébergée MF) */
  adminNote?: string;
}

export type PaymentRailOperatorsMap = Record<string, boolean>;

/** URLs publiques des logos opérateurs (clé = operator id). */
export type PaymentRailLogosMap = Record<string, string>;

export interface PaymentRailAggregatorConfig {
  enabled: boolean;
  operators: PaymentRailOperatorsMap;
  logos?: PaymentRailLogosMap;
}

export type PaymentRailsConfig = Record<PaymentRailAggregatorId, PaymentRailAggregatorConfig>;

export const PAYMENT_RAILS_SETTINGS_KEY = 'payment_rails';

/** Catalogue officiel PP v1.0.6 (PAYS & CODE PROVIDER). */
export const PAIEMENT_PRO_OPERATORS: PaymentRailOperatorDef[] = [
  // Côte d’Ivoire
  {
    id: 'OMCIV2',
    label: 'Orange money CI',
    kind: 'mobile',
    country: 'CI',
    countryLabel: "Côte d'Ivoire",
  },
  {
    id: 'MOMOCI',
    label: 'MTN MoMo CI',
    kind: 'mobile',
    country: 'CI',
    countryLabel: "Côte d'Ivoire",
  },
  {
    id: 'FLOOZ',
    label: 'Moov money CI',
    kind: 'mobile',
    country: 'CI',
    countryLabel: "Côte d'Ivoire",
  },
  {
    id: 'WAVECI',
    label: 'Wave CI',
    kind: 'mobile',
    country: 'CI',
    countryLabel: "Côte d'Ivoire",
  },
  // Burkina Faso — seul Orange BF chez Paiement Pro
  {
    id: 'OMBF',
    label: 'Orange money BF',
    kind: 'mobile',
    country: 'BF',
    countryLabel: 'Burkina Faso',
  },
  // Mali
  {
    id: 'OMML',
    label: 'Orange money ML',
    kind: 'mobile',
    country: 'ML',
    countryLabel: 'Mali',
  },
  // Bénin
  {
    id: 'MOMOBJ',
    label: 'MTN MoMo BJ',
    kind: 'mobile',
    country: 'BJ',
    countryLabel: 'Bénin',
  },
  {
    id: 'FLOOZBJ',
    label: 'Moov money BJ',
    kind: 'mobile',
    country: 'BJ',
    countryLabel: 'Bénin',
  },
  // Niger
  {
    id: 'AIRTELNG',
    label: 'Airtel money NE',
    kind: 'mobile',
    country: 'NE',
    countryLabel: 'Niger',
  },
  // Sénégal
  {
    id: 'OMSN',
    label: 'Orange money SN',
    kind: 'mobile',
    country: 'SN',
    countryLabel: 'Sénégal',
  },
  {
    id: 'WAVESN',
    label: 'Wave SN',
    kind: 'mobile',
    country: 'SN',
    countryLabel: 'Sénégal',
  },
  // Guinée-Bissau
  {
    id: 'OMGN',
    label: 'Orange money GW',
    kind: 'mobile',
    country: 'GW',
    countryLabel: 'Guinée-Bissau',
  },
  // Cameroun
  {
    id: 'OMCM',
    label: 'Orange money CM',
    kind: 'mobile',
    country: 'CM',
    countryLabel: 'Cameroun',
  },
  {
    id: 'MOMOCM',
    label: 'MTN MoMo CM',
    kind: 'mobile',
    country: 'CM',
    countryLabel: 'Cameroun',
  },
  // Togo
  {
    id: 'MOOVTG',
    label: 'Flooz money TG',
    kind: 'mobile',
    country: 'TG',
    countryLabel: 'Togo',
  },
  {
    id: 'TOGOCEL',
    label: 'TogoCel TG',
    kind: 'mobile',
    country: 'TG',
    countryLabel: 'Togo',
  },
  // Guinée
  {
    id: 'MOMOGNF',
    label: 'MTN MoMo GN',
    kind: 'mobile',
    country: 'GN',
    countryLabel: 'Guinée',
  },
  // Monde
  {
    id: 'CARD',
    label: 'Visa / Mastercard',
    kind: 'card',
    country: 'WORLD',
    countryLabel: 'Monde',
  },
  { id: 'PAYPAL', label: 'PayPal', kind: 'wallet', country: 'WORLD', countryLabel: 'Monde' },
  {
    id: 'CRYPTO',
    label: 'Cryptomonnaie',
    kind: 'crypto',
    country: 'WORLD',
    countryLabel: 'Monde',
  },
  {
    id: 'TBANK',
    label: 'Virement bancaire',
    kind: 'bank',
    country: 'WORLD',
    countryLabel: 'Monde',
  },
];

/** Tous les MM officiels PP + carte — le checkout filtre déjà par pays acheteur. */
const PAIEMENT_PRO_DEFAULT_ON = new Set(
  PAIEMENT_PRO_OPERATORS.map(o => o.id).filter(id => {
    const op = PAIEMENT_PRO_OPERATORS.find(o => o.id === id)!;
    return op.kind === 'mobile' || op.id === 'CARD';
  })
);

export const PAYMENT_RAILS_CATALOG: PaymentRailAggregatorDef[] = [
  {
    id: 'moneyfusion',
    label: 'MoneyFusion',
    description: 'Mobile money Afrique de l’Ouest (page hébergée)',
    adminNote:
      'Désactiver un opérateur n’affecte que l’affichage Emarzona ; la page hébergée MoneyFusion peut encore tous les proposer.',
    operators: [
      { id: 'orange', label: 'Orange Money', kind: 'mobile' },
      { id: 'mtn', label: 'MTN MoMo', kind: 'mobile' },
      { id: 'moov', label: 'Moov Money', kind: 'mobile' },
      { id: 'wave', label: 'Wave', kind: 'mobile' },
      { id: 'crypto', label: 'Cryptomonnaie', kind: 'crypto' },
    ],
  },
  {
    id: 'paiement_pro',
    label: 'Paiement Pro',
    description: 'Mobile money multi-pays, carte, PayPal, crypto (channel API)',
    operators: PAIEMENT_PRO_OPERATORS,
    adminNote:
      'Codes officiels dashboard Paiement Pro (PAYS & CODE PROVIDER). Activez les réseaux ouverts sur votre compte marchand. Au checkout, seuls les mobile money du pays de l’acheteur (+ carte / PayPal / crypto mondiaux) sont proposés.',
  },
  {
    id: 'stripe_connect',
    label: 'Stripe Connect',
    description: 'Cartes internationales (vendeur Connect)',
    operators: [{ id: 'card', label: 'Carte Visa / Mastercard', kind: 'card' }],
  },
  {
    id: 'paypal_commerce',
    label: 'PayPal',
    description: 'Compte PayPal ou carte via PayPal',
    operators: [{ id: 'paypal', label: 'PayPal', kind: 'wallet' }],
  },
];

function operatorsDefaults(ops: PaymentRailOperatorDef[]): PaymentRailOperatorsMap {
  return Object.fromEntries(ops.map(o => [o.id, true]));
}

function paiementProOperatorsDefaults(): PaymentRailOperatorsMap {
  return Object.fromEntries(
    PAIEMENT_PRO_OPERATORS.map(o => [o.id, PAIEMENT_PRO_DEFAULT_ON.has(o.id)])
  );
}

export function defaultPaymentRailsConfig(): PaymentRailsConfig {
  const out = {} as PaymentRailsConfig;
  for (const agg of PAYMENT_RAILS_CATALOG) {
    out[agg.id] = {
      enabled: true,
      operators:
        agg.id === 'paiement_pro'
          ? paiementProOperatorsDefaults()
          : operatorsDefaults(agg.operators),
      logos: {},
    };
  }
  return out;
}

export function mergePaymentRailsConfig(raw: unknown): PaymentRailsConfig {
  const defaults = defaultPaymentRailsConfig();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaults;

  const input = raw as Record<string, unknown>;
  const result = { ...defaults };

  for (const agg of PAYMENT_RAILS_CATALOG) {
    const row = input[agg.id];
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    const opsIn =
      r.operators && typeof r.operators === 'object' && !Array.isArray(r.operators)
        ? (r.operators as Record<string, unknown>)
        : {};
    const operators = { ...defaults[agg.id].operators };
    for (const op of agg.operators) {
      if (typeof opsIn[op.id] === 'boolean') operators[op.id] = opsIn[op.id];
    }

    const logosIn =
      r.logos && typeof r.logos === 'object' && !Array.isArray(r.logos)
        ? (r.logos as Record<string, unknown>)
        : {};
    const logos: PaymentRailLogosMap = {};
    for (const op of agg.operators) {
      const url = logosIn[op.id];
      if (typeof url === 'string' && url.trim()) logos[op.id] = url.trim();
    }

    result[agg.id] = {
      enabled: typeof r.enabled === 'boolean' ? r.enabled : defaults[agg.id].enabled,
      operators,
      logos,
    };
  }

  return result;
}

export function getOperatorLogoUrl(
  config: PaymentRailsConfig,
  aggregatorId: PaymentRailAggregatorId,
  operatorId: string
): string | null {
  const url = config[aggregatorId]?.logos?.[operatorId];
  return url && url.trim() ? url.trim() : null;
}

export function isAggregatorEnabled(
  config: PaymentRailsConfig,
  aggregatorId: PaymentRailAggregatorId
): boolean {
  return config[aggregatorId]?.enabled !== false;
}

export function getEnabledOperators(
  config: PaymentRailsConfig,
  aggregatorId: PaymentRailAggregatorId
): string[] {
  const agg = config[aggregatorId];
  if (!agg?.enabled) return [];
  const catalog = PAYMENT_RAILS_CATALOG.find(a => a.id === aggregatorId);
  if (!catalog) return [];
  return catalog.operators.filter(op => agg.operators[op.id] !== false).map(op => op.id);
}

export function groupPaiementProOperatorsByCountry(
  operators: PaymentRailOperatorDef[]
): Array<{ country: string; countryLabel: string; operators: PaymentRailOperatorDef[] }> {
  const map = new Map<string, { countryLabel: string; operators: PaymentRailOperatorDef[] }>();
  for (const op of operators) {
    const key = op.country || 'OTHER';
    const label = op.countryLabel || 'Autre';
    const row = map.get(key) ?? { countryLabel: label, operators: [] };
    row.operators.push(op);
    map.set(key, row);
  }
  const order = ['CI', 'BF', 'ML', 'BJ', 'NE', 'SN', 'GW', 'CM', 'TG', 'GN', 'WORLD', 'OTHER'];
  return order
    .filter(k => map.has(k))
    .map(k => {
      const row = map.get(k)!;
      return { country: k, countryLabel: row.countryLabel, operators: row.operators };
    });
}

/**
 * Normalise un pays acheteur (ISO, nom FR, alias) vers un code ISO-2 majuscule.
 * Retourne null si aucune info exploitable.
 */
export function resolveBuyerCountryIso(buyerCountry?: string | null): string | null {
  const raw = (buyerCountry || '').trim();
  if (!raw) return null;
  // Import dynamique évité : résolution locale sur le catalogue PP + noms connus
  const upper = raw.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper) && upper !== 'WW') {
    // WORLD n'est pas un ISO pays
    if (upper === 'WO') return null;
    return upper;
  }
  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const KNOWN: Record<string, string> = {
    "cote d'ivoire": 'CI',
    'cote divoire': 'CI',
    'ivory coast': 'CI',
    ci: 'CI',
    'burkina faso': 'BF',
    bf: 'BF',
    mali: 'ML',
    ml: 'ML',
    benin: 'BJ',
    bj: 'BJ',
    niger: 'NE',
    ne: 'NE',
    senegal: 'SN',
    sn: 'SN',
    'guinee-bissau': 'GW',
    'guinee bissau': 'GW',
    gw: 'GW',
    cameroun: 'CM',
    cameroon: 'CM',
    cm: 'CM',
    togo: 'TG',
    tg: 'TG',
    guinee: 'GN',
    guinea: 'GN',
    gn: 'GN',
  };
  return KNOWN[normalized] || null;
}

/**
 * Checkout : mobile money du pays acheteur uniquement + opérateurs WORLD (carte, PayPal…).
 * Même si l’admin a tout activé, on ne propose pas les MM des autres pays.
 */
export function filterPaiementProOperatorsForBuyer(
  operators: PaymentRailOperatorDef[],
  buyerCountry?: string | null
): PaymentRailOperatorDef[] {
  const iso = resolveBuyerCountryIso(buyerCountry);
  if (!iso) {
    // Pays inconnu : proposer seulement les moyens mondiaux (carte…) pour éviter
    // d’afficher 15 réseaux MM hors contexte.
    return operators.filter(op => op.country === 'WORLD' || op.kind !== 'mobile');
  }

  return operators.filter(op => {
    if (op.country === 'WORLD') return true;
    if (op.kind === 'mobile') return (op.country || '').toUpperCase() === iso;
    return (op.country || '').toUpperCase() === iso;
  });
}

/** Label checkout : toujours le nom explicite du catalogue (ex. Orange money BF). */
export function paiementProCheckoutLabel(op: PaymentRailOperatorDef): string {
  return op.label;
}

/** Ordre préféré : MM CI d’abord (CARD parfois indisponible sur le compte marchand). */
const PAIEMENT_PRO_CHANNEL_PREF = [
  'OMCIV2',
  'MOMOCI',
  'WAVECI',
  'FLOOZ',
  'OMSN',
  'WAVESN',
  'OMBF',
  'OMML',
  'MOMOBJ',
  'FLOOZBJ',
  'CARD',
] as const;

export function getDefaultPaiementProChannel(
  config: PaymentRailsConfig,
  allowedIds?: string[]
): string {
  const enabled = getEnabledOperators(config, 'paiement_pro');
  const pool = allowedIds?.length ? allowedIds.filter(id => enabled.includes(id)) : enabled;
  for (const ch of PAIEMENT_PRO_CHANNEL_PREF) {
    if (pool.includes(ch)) return ch;
  }
  return pool[0] || enabled[0] || 'OMCIV2';
}
