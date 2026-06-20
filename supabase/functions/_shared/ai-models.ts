/**
 * Catalogues modèles IA — edge functions (sync conceptuel avec src/lib/ai/ai-provider-models.ts)
 */

type AiProviderName = 'openrouter' | 'openai' | 'anthropic' | 'google' | 'custom';

export const GOOGLE_FREE_TEXT_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
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

export function normalizeGoogleModel(model: string): string {
  const trimmed = model.trim();
  if (!trimmed) return 'gemini-2.0-flash-lite';
  const withoutPrefix = trimmed.replace(/^google\//, '');
  if (withoutPrefix.startsWith('gemini-')) return withoutPrefix;
  return OPENROUTER_TO_GEMINI[trimmed] ?? withoutPrefix;
}

export function isFreeAiModel(model: string, provider: AiProviderName): boolean {
  if (provider === 'google') {
    return GOOGLE_FREE_TEXT_MODELS.includes(
      normalizeGoogleModel(model) as (typeof GOOGLE_FREE_TEXT_MODELS)[number]
    );
  }
  return model === 'openrouter/free' || model.endsWith(':free');
}

export function defaultFreeTextModel(provider: AiProviderName): string {
  if (provider === 'google') return 'gemini-2.0-flash-lite';
  return 'openrouter/free';
}
