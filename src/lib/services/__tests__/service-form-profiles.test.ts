import { describe, expect, it } from 'vitest';
import {
  getServiceFormProfile,
  validateServiceFormAttributes,
} from '@/lib/services/service-form-profiles';
import { getServiceListingAttributeChips } from '@/lib/services/service-listing-attributes';

describe('getServiceFormProfile', () => {
  it('returns the IT project profile from a leaf slug', () => {
    const profile = getServiceFormProfile(undefined, 'svc-developpement-web');
    expect(profile?.familySlug).toBe('svc-informatique-technologie');
    expect(profile?.requireSlots).toBe(false);
    expect(profile?.defaults.fulfillment_mode).toBe('project');
    expect(profile?.fields.some(f => f.key === 'cms')).toBe(true);
    expect(profile?.fields.some(f => f.key === 'deliverable')).toBe(true);
  });

  it('returns beauty appointment profile with coiffure override', () => {
    const profile = getServiceFormProfile('svc-beaute-bien-etre', 'svc-coiffure');
    expect(profile?.requireSlots).toBe(true);
    expect(profile?.defaults.requires_staff).toBe(true);
    expect(profile?.fields[0]?.key).toBe('service_focus');
  });

  it('rejects incomplete required attributes', () => {
    const profile = getServiceFormProfile(undefined, 'svc-traduction');
    const errors = validateServiceFormAttributes(profile, { word_count: 500 });
    expect(
      errors.some(msg => /source/i.test(msg) || /cible/i.test(msg) || /Langue/i.test(msg))
    ).toBe(true);
  });

  it('accepts complete traduction attributes', () => {
    const profile = getServiceFormProfile(undefined, 'svc-traduction');
    expect(
      validateServiceFormAttributes(profile, {
        source_lang: 'fr',
        target_lang: 'en',
        word_count: 1000,
        language: 'fr',
        deadline_days: 3,
      })
    ).toEqual([]);
  });
});

describe('getServiceListingAttributeChips', () => {
  it('returns up to 3 filled chips, required first', () => {
    const chips = getServiceListingAttributeChips({
      categorySlug: 'svc-traduction',
      attributes: {
        source_lang: 'fr',
        target_lang: 'en',
        word_count: 1000,
        language: 'fr',
        deadline_days: 3,
        tone: 'formel',
      },
      max: 3,
    });
    expect(chips).toHaveLength(3);
    expect(chips[0].key).toBe('source_lang');
    expect(chips.some(c => c.key === 'tone')).toBe(false);
  });

  it('returns empty when attributes are missing', () => {
    expect(
      getServiceListingAttributeChips({
        categorySlug: 'svc-traduction',
        attributes: {},
      })
    ).toEqual([]);
  });
});
