/**
 * Presets du Studio IA — source de vérité côté client.
 * Peuvent être surchargés par `ai_management_settings.imageEnhancer.presets`.
 */

export interface StudioPreset {
  id: string;
  label: string;
  emoji: string;
  instruction: string;
  description?: string;
}

export const DEFAULT_STUDIO_PRESETS: StudioPreset[] = [
  {
    id: 'premium',
    label: 'Optimisation premium',
    emoji: '✨',
    description: 'Lumière, contraste et netteté pour une fiche produit haut de gamme.',
    instruction:
      'Improve this image for a premium e-commerce listing: enhance lighting and contrast, sharpen details, balance colors, remove visual noise. Keep the subject 100% identical.',
  },
  {
    id: 'white-bg',
    label: 'Fond blanc épuré',
    emoji: '⚪',
    description: 'Idéal pour catalogues et marketplaces.',
    instruction:
      'Replace the background with a pure clean white studio background. Keep the subject perfectly intact with realistic shadows.',
  },
  {
    id: 'studio-pro',
    label: 'Style studio pro',
    emoji: '📸',
    description: 'Éclairage doux et rendu photographique.',
    instruction:
      'Transform this into a professional studio photo with soft diffused lighting, high resolution, and a slight depth-of-field. Subject must remain identical.',
  },
  {
    id: 'vibrant',
    label: 'Couleurs vibrantes',
    emoji: '🎨',
    description: 'Couleurs plus vives sans dénaturer le produit.',
    instruction:
      'Boost colors slightly to make them vibrant and appealing while keeping skin tones and product colors realistic. Increase clarity.',
  },
];

/** @deprecated Utiliser DEFAULT_STUDIO_PRESETS */
export const STUDIO_PRESETS = DEFAULT_STUDIO_PRESETS;

export const STUDIO_PRESET_KEYS = DEFAULT_STUDIO_PRESETS.map(p => p.id);
export type StudioPresetKey = (typeof STUDIO_PRESET_KEYS)[number];
