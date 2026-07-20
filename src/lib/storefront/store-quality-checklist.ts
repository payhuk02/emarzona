/**
 * Heuristiques qualité boutique (checklist Sprint 4).
 */

import { getContrastRatio, hasSufficientContrast } from '@/lib/color-utils';
import type { Store, StoreMarketingContent } from '@/hooks/useStores';
import type { StoreAppearanceFormDraft } from '@/lib/storefront/store-preview-draft';

export type QualityCheck = {
  id: string;
  ok: boolean;
  labelKey: string;
  /** Severity for UI */
  level: 'required' | 'recommended';
};

export function isMarketingContentMeaningful(
  content: StoreMarketingContent | null | undefined
): boolean {
  if (!content || typeof content !== 'object') return false;

  const hasText = (value?: string | null) => Boolean(value && value.trim().length >= 20);

  if (hasText(content.welcome_message)) return true;
  if (hasText(content.mission_statement)) return true;
  if (hasText(content.vision_statement)) return true;
  if (hasText(content.story)) return true;
  if (Array.isArray(content.values) && content.values.some(v => v.trim().length > 0)) return true;
  if (Array.isArray(content.team_section) && content.team_section.some(m => m.name?.trim())) {
    return true;
  }
  if (
    Array.isArray(content.testimonials) &&
    content.testimonials.some(t => t.content?.trim() && t.content.trim().length >= 20)
  ) {
    return true;
  }

  return false;
}

export function contrastRatioLabel(foreground: string, background: string): string {
  const ratio = getContrastRatio(foreground, background);
  if (!Number.isFinite(ratio)) return '—';
  return `${ratio.toFixed(1)}:1`;
}

export function isAppearanceStepComplete(store: Store): boolean {
  if (store.appearance_draft && typeof store.appearance_draft === 'object') {
    return false;
  }
  const hasLogo = Boolean(store.logo_url?.trim());
  const hasPrimary = Boolean(store.primary_color?.trim());
  if (!hasLogo || !hasPrimary) return false;

  const bg = store.background_color || '#ffffff';
  const text = store.text_color || '#1f2937';
  return hasSufficientContrast(text, bg, 'AA');
}

export function buildAppearanceQualityChecks(form: StoreAppearanceFormDraft): QualityCheck[] {
  const logoOk = Boolean(form.logoUrl?.trim());
  const primary = form.primaryColor || '#3b82f6';
  const bg = form.backgroundColor || '#ffffff';
  const text = form.textColor || '#1f2937';
  const btnBg = form.buttonPrimaryColor || primary;
  const btnText = form.buttonPrimaryText || '#ffffff';
  const link = form.linkColor || primary;

  const textBgOk = hasSufficientContrast(text, bg, 'AA');
  const buttonOk = hasSufficientContrast(btnText, btnBg, 'AA');
  const linkOk = hasSufficientContrast(link, bg, 'AA');

  return [
    {
      id: 'logo',
      ok: logoOk,
      labelKey: 'store.quality.logoRequired',
      level: 'required',
    },
    {
      id: 'textContrast',
      ok: textBgOk,
      labelKey: 'store.quality.textContrast',
      level: 'required',
    },
    {
      id: 'buttonContrast',
      ok: buttonOk,
      labelKey: 'store.quality.buttonContrast',
      level: 'recommended',
    },
    {
      id: 'linkContrast',
      ok: linkOk,
      labelKey: 'store.quality.linkContrast',
      level: 'recommended',
    },
  ];
}

export function buildMarketingQualityChecks(
  content: StoreMarketingContent | null | undefined
): QualityCheck[] {
  const hasText = (value?: string | null, min = 20) => Boolean(value && value.trim().length >= min);

  return [
    {
      id: 'welcome',
      ok: hasText(content?.welcome_message),
      labelKey: 'store.quality.marketingWelcome',
      level: 'required',
    },
    {
      id: 'missionOrStory',
      ok: hasText(content?.mission_statement) || hasText(content?.story),
      labelKey: 'store.quality.marketingMissionOrStory',
      level: 'recommended',
    },
    {
      id: 'socialProof',
      ok:
        (Array.isArray(content?.testimonials) &&
          content!.testimonials!.some(t => hasText(t.content))) ||
        (Array.isArray(content?.team_section) &&
          content!.team_section!.some(m => Boolean(m.name?.trim()))),
      labelKey: 'store.quality.marketingSocialProof',
      level: 'recommended',
    },
  ];
}
