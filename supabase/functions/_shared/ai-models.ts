/**
 * Catalogues modèles IA — edge functions (sync conceptuel avec src/lib/ai/ai-provider-models.ts)
 */

type AiProviderName = 'openrouter' | 'openai' | 'anthropic' | 'google' | 'custom';

/** Sélection automatique : essaie les modèles gratuits Gemini dans l'ordre jusqu'à succès. */
export const GOOGLE_AUTO_MODEL = 'google/auto';

export const GOOGLE_FREE_TEXT_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
] as const;

export const GOOGLE_FREE_IMAGE_MODELS = [
  'gemini-2.0-flash-preview-image-generation',
  'gemini-2.5-flash-preview-image-generation',
] as const;

export const OPENROUTER_FREE_TEXT_MODELS = [
  'openrouter/free',
  'deepseek/deepseek-r1:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'meta-llama/llama-3.3-70b-instruct:free',
] as const;

const OPENROUTER_TO_GEMINI: Record<string, string> = {
  'google/gemini-2.0-flash-lite': 'gemini-2.0-flash-lite',
  'google/gemini-2.0-flash': 'gemini-2.0-flash',
  'google/gemini-2.5-flash-lite': 'gemini-2.5-flash-lite',
  'google/gemini-2.5-flash': 'gemini-2.5-flash',
  'google/gemini-2.5-pro': 'gemini-2.5-pro',
  'google/gemini-3-flash-preview': 'gemini-2.5-flash',
  'google/gemini-3.1-flash-lite-preview': 'gemini-2.5-flash-lite',
  'google/gemini-3.1-pro-preview': 'gemini-2.5-pro',
};

export function isAutoAiModel(model: string, provider: AiProviderName): boolean {
  const m = model.trim().toLowerCase();
  if (provider === 'google') return m === GOOGLE_AUTO_MODEL || m === 'gemini/auto' || m === 'auto';
  if (provider === 'openrouter') return m === 'openrouter/free';
  return false;
}

export function normalizeGoogleModel(model: string): string {
  const trimmed = model.trim();
  if (!trimmed || isAutoAiModel(trimmed, 'google')) return GOOGLE_FREE_TEXT_MODELS[0];
  const withoutPrefix = trimmed.replace(/^google\//, '');
  if (withoutPrefix === 'auto') return GOOGLE_FREE_TEXT_MODELS[0];
  if (withoutPrefix.startsWith('gemini-')) return withoutPrefix;
  return OPENROUTER_TO_GEMINI[trimmed] ?? withoutPrefix;
}

/** Modèles à essayer (ordre = priorité). Mode auto = cascade gratuite. */
export function resolveTextModelCandidates(model: string, provider: AiProviderName): string[] {
  const trimmed = model.trim();
  if (provider === 'google') {
    if (isAutoAiModel(trimmed, 'google')) return [...GOOGLE_FREE_TEXT_MODELS];
    const normalized = normalizeGoogleModel(trimmed);
    return [normalized];
  }
  if (provider === 'openrouter') {
    if (trimmed === 'openrouter/free' || !trimmed) return ['openrouter/free'];
    return [trimmed];
  }
  return [trimmed || defaultFreeTextModel(provider)];
}

export function resolveImageModelCandidates(model: string, provider: AiProviderName): string[] {
  if (provider === 'google') {
    const trimmed = model.trim();
    if (!trimmed || isAutoAiModel(trimmed, 'google') || trimmed.includes('auto')) {
      return [...GOOGLE_FREE_IMAGE_MODELS];
    }
    const normalized = normalizeGoogleModel(trimmed);
    if (normalized.includes('image')) return [normalized];
    return [normalized, ...GOOGLE_FREE_IMAGE_MODELS];
  }
  const normalized = model.trim() || 'google/gemini-3.1-flash-image-preview';
  return [normalized];
}

export function isFreeAiModel(model: string, provider: AiProviderName): boolean {
  if (isAutoAiModel(model, provider)) return true;
  if (provider === 'google') {
    return GOOGLE_FREE_TEXT_MODELS.includes(
      normalizeGoogleModel(model) as (typeof GOOGLE_FREE_TEXT_MODELS)[number]
    );
  }
  return model === 'openrouter/free' || model.endsWith(':free');
}

export function defaultFreeTextModel(provider: AiProviderName): string {
  if (provider === 'google') return GOOGLE_AUTO_MODEL;
  return 'openrouter/free';
}
