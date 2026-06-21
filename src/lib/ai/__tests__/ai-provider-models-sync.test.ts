import { describe, expect, it } from 'vitest';
import {
  GOOGLE_AUTO_MODEL,
  GOOGLE_FREE_TEXT_MODELS,
  defaultFreeTextModel,
  isAutoAiModel,
  isFreeAiModel,
} from '@/lib/ai/ai-provider-models';

/** Miroir backend supabase/functions/_shared/ai-models.ts */
const BACKEND_GOOGLE_FREE_TEXT = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
] as const;

describe('AI provider models — sync frontend/backend', () => {
  it('expose google/auto comme modèle auto', () => {
    expect(GOOGLE_AUTO_MODEL).toBe('google/auto');
    expect(isAutoAiModel('google/auto', 'google')).toBe(true);
    expect(isAutoAiModel('gemini/auto', 'google')).toBe(true);
  });

  it('aligne la cascade Gemini gratuite avec le backend', () => {
    const frontendIds = GOOGLE_FREE_TEXT_MODELS.map(m => m.id);
    expect(frontendIds).toEqual([...BACKEND_GOOGLE_FREE_TEXT]);
  });

  it('défaut texte gratuit par provider', () => {
    expect(defaultFreeTextModel('google')).toBe('google/auto');
    expect(defaultFreeTextModel('openrouter')).toBe('openrouter/free');
  });

  it('marque les modèles auto comme gratuits', () => {
    expect(isFreeAiModel('google/auto', 'google')).toBe(true);
    expect(isFreeAiModel('openrouter/free', 'openrouter')).toBe(true);
  });
});
