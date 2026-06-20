/**
 * Catalogues modèles IA — frontend admin (sync conceptuel avec supabase/functions/_shared/ai-models.ts)
 */

export type AiGatewayProvider = 'openrouter' | 'openai' | 'anthropic' | 'google' | 'custom';

export const GOOGLE_AUTO_MODEL = 'google/auto';

export const GOOGLE_AUTO_MODEL_OPTION = {
  id: GOOGLE_AUTO_MODEL,
  label: 'Gemini Auto — sélection gratuite automatique (recommandé)',
} as const;

export const GOOGLE_FREE_TEXT_MODELS = [
  { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite — gratuit, rapide (recommandé)' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash — gratuit, équilibré' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite — gratuit, léger' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash — gratuit, qualité' },
] as const;

export const GOOGLE_PAID_TEXT_MODELS = [
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro — raisonnement avancé' },
] as const;

export const GOOGLE_IMAGE_MODELS = [
  {
    id: 'gemini-2.0-flash-preview-image-generation',
    label: 'Gemini 2.0 Flash Image (gratuit, limité)',
  },
  { id: 'gemini-2.5-flash-preview-image-generation', label: 'Gemini 2.5 Flash Image' },
] as const;

export const GOOGLE_FREE_TEXT_MODEL_IDS = new Set<string>([
  GOOGLE_AUTO_MODEL,
  ...GOOGLE_FREE_TEXT_MODELS.map(m => m.id),
]);

export function isAutoAiModel(modelId: string, provider: AiGatewayProvider): boolean {
  if (provider === 'google') {
    const m = modelId.trim().toLowerCase();
    return m === GOOGLE_AUTO_MODEL || m === 'gemini/auto' || m === 'auto';
  }
  return modelId === 'openrouter/free';
}

export function isFreeGoogleModel(modelId: string): boolean {
  return isAutoAiModel(modelId, 'google') || GOOGLE_FREE_TEXT_MODEL_IDS.has(modelId);
}

export function isFreeOpenRouterModel(modelId: string): boolean {
  return modelId === 'openrouter/free' || modelId.endsWith(':free');
}

export function isFreeAiModel(modelId: string, provider: AiGatewayProvider): boolean {
  if (isAutoAiModel(modelId, provider)) return true;
  if (provider === 'google') return GOOGLE_FREE_TEXT_MODELS.some(m => m.id === modelId);
  if (provider === 'openrouter') return isFreeOpenRouterModel(modelId);
  return false;
}

export function defaultFreeTextModel(provider: AiGatewayProvider): string {
  if (provider === 'google') return GOOGLE_AUTO_MODEL;
  return 'openrouter/free';
}

export const PROVIDER_KEY_HINTS: Record<
  AiGatewayProvider,
  { env: string; placeholder: string; url: string }
> = {
  openrouter: {
    env: 'OPENROUTER_API_KEY',
    placeholder: 'sk-or-…',
    url: 'https://openrouter.ai/keys',
  },
  google: {
    env: 'GEMINI_API_KEY / GOOGLE_API_KEY',
    placeholder: 'AIza…',
    url: 'https://aistudio.google.com/apikey',
  },
  openai: {
    env: 'OPENAI_API_KEY',
    placeholder: 'sk-…',
    url: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    env: 'ANTHROPIC_API_KEY',
    placeholder: 'sk-ant-…',
    url: 'https://console.anthropic.com/',
  },
  custom: { env: 'CUSTOM_AI_API_KEY', placeholder: 'clé API…', url: '' },
};
