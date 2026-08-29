/** Libellés de bouton proposés au vendeur pour les cartes service (marketplace / boutique) */
export const SERVICE_CTA_BUTTON_PRESETS = [
  'Réserver',
  'Commander',
  'Acheter',
  'En savoir plus',
  'Voir les formules',
  'Demander un devis',
  'Continuer',
  'Choisir une formule',
] as const;

export type ServiceCtaButtonPreset = (typeof SERVICE_CTA_BUTTON_PRESETS)[number];

export const DEFAULT_SERVICE_CTA_LABEL: ServiceCtaButtonPreset = 'Réserver';

export function isServiceCtaButtonPreset(value: string): value is ServiceCtaButtonPreset {
  return (SERVICE_CTA_BUTTON_PRESETS as readonly string[]).includes(value);
}
