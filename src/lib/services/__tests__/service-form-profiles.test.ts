import { describe, expect, it } from 'vitest';
import {
  getServiceFormProfile,
  getServiceLeafExtraFields,
  listServiceLeafSlugs,
  SERVICE_FAMILY_LEAVES,
  validateServiceFormAttributes,
} from '@/lib/services/service-form-profiles';
import { getServiceListingAttributeChips } from '@/lib/services/service-listing-attributes';
import { getServicePricingGuidance } from '@/lib/service/service-pricing';

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
    expect(profile?.defaults.pricing_type).toBe('fixed');
    expect(profile?.fields[0]?.key).toBe('service_focus');
  });

  it('sets pricing type defaults per family', () => {
    expect(
      getServiceFormProfile(undefined, 'svc-coaching-professionnel')?.defaults.pricing_type
    ).toBe('hourly');
    expect(
      getServiceFormProfile(undefined, 'svc-consultation-juridique')?.defaults.pricing_type
    ).toBe('hourly');
    expect(
      getServiceFormProfile(undefined, 'svc-organisation-evenements')?.defaults.pricing_type
    ).toBe('per_participant');
    expect(
      getServiceFormProfile(undefined, 'svc-assistance-virtuelle')?.defaults.pricing_type
    ).toBe('hourly');
    expect(getServiceFormProfile(undefined, 'svc-developpement-web')?.defaults.pricing_type).toBe(
      'fixed'
    );
    expect(
      getServiceFormProfile(undefined, 'svc-developpement-web')?.defaults.fulfillment_mode
    ).toBe('project');
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

describe('leaf form coverage', () => {
  const leaves = listServiceLeafSlugs();

  it('maps every family leaf without duplicates', () => {
    expect(leaves).toHaveLength(116);
    expect(new Set(leaves).size).toBe(116);
    expect(Object.keys(SERVICE_FAMILY_LEAVES)).toHaveLength(12);
  });

  it('gives every leaf a family profile plus a leaf-specific required field', () => {
    for (const leaf of leaves) {
      const profile = getServiceFormProfile(undefined, leaf);
      const extras = getServiceLeafExtraFields(leaf);
      expect(profile, leaf).not.toBeNull();
      expect(extras.length, leaf).toBeGreaterThan(0);
      expect(
        extras.some(field => field.required),
        leaf
      ).toBe(true);
      expect(profile?.fields[0]?.key).toBe(extras[0].key);
    }
  });
});

describe('pricing defaults stay synced with catalog guidance', () => {
  it('matches type and À partir de for every family', () => {
    for (const familySlug of Object.keys(SERVICE_FAMILY_LEAVES)) {
      const leaf = SERVICE_FAMILY_LEAVES[familySlug][0];
      const profile = getServiceFormProfile(familySlug, leaf);
      const guidance = getServicePricingGuidance(familySlug);
      expect(profile?.defaults.pricing_type, familySlug).toBe(guidance.pricingType);
      const startingFromMode =
        profile?.defaults.fulfillment_mode === 'project' ||
        profile?.defaults.fulfillment_mode === 'both';
      expect(guidance.showStartingFrom, familySlug).toBe(startingFromMode);
    }
  });
});
