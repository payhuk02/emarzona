export const PHYSICAL_CHECKOUT_METHODS = ['online', 'cash_on_delivery'] as const;

export type PhysicalCheckoutMethod = (typeof PHYSICAL_CHECKOUT_METHODS)[number];

export const PHYSICAL_CHECKOUT_METHOD_LABELS: Record<PhysicalCheckoutMethod, string> = {
  online: 'Paiement en ligne',
  cash_on_delivery: 'Paiement à la livraison',
};

/** Libellés de bouton proposés au vendeur pour la carte produit */
export const PHYSICAL_CTA_BUTTON_PRESETS = [
  'Commander',
  'Acheter maintenant',
  'Acheter en ligne',
  'Payer à la livraison',
  'Je commande',
  'Passer commande',
  'Réserver',
] as const;

export type PhysicalCtaButtonPreset = (typeof PHYSICAL_CTA_BUTTON_PRESETS)[number];

export const DEFAULT_PHYSICAL_CTA_LABEL: PhysicalCtaButtonPreset = 'Commander';

export const DEFAULT_PHYSICAL_CHECKOUT_METHOD: PhysicalCheckoutMethod = 'online';
