import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  getServiceFormProfile,
  getServiceLeafExtraFields,
  isServiceGigFamily,
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
    expect(isServiceGigFamily(profile)).toBe(true);
  });

  it('returns beauty appointment profile with coiffure override', () => {
    const profile = getServiceFormProfile('svc-beaute-bien-etre', 'svc-coiffure');
    expect(profile?.requireSlots).toBe(true);
    expect(profile?.defaults.requires_staff).toBe(true);
    expect(profile?.defaults.pricing_type).toBe('fixed');
    expect(profile?.fields[0]?.key).toBe('service_focus');
    expect(isServiceGigFamily(profile)).toBe(false);
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

  it('splits juridique leaves between consultation slots and gig dossiers', () => {
    const consult = getServiceFormProfile(undefined, 'svc-consultation-juridique');
    expect(consult?.requireSlots).toBe(true);
    expect(consult?.defaults.fulfillment_mode).toBe('appointment');
    expect(consult?.defaults.pricing_type).toBe('hourly');
    expect(isServiceGigFamily(consult)).toBe(false);

    const contract = getServiceFormProfile(undefined, 'svc-redaction-contrats');
    expect(contract?.requireSlots).toBe(false);
    expect(contract?.defaults.fulfillment_mode).toBe('project');
    expect(contract?.defaults.pricing_type).toBe('fixed');
    expect(isServiceGigFamily(contract)).toBe(true);

    expect(isServiceGigFamily(getServiceFormProfile(undefined, 'svc-creation-societes'))).toBe(
      true
    );
    expect(
      isServiceGigFamily(getServiceFormProfile(undefined, 'svc-formalites-administratives'))
    ).toBe(true);
    expect(
      isServiceGigFamily(getServiceFormProfile(undefined, 'svc-propriete-intellectuelle'))
    ).toBe(true);
    expect(isServiceGigFamily(getServiceFormProfile(undefined, 'svc-mediation'))).toBe(false);
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
    expect(leaves).toHaveLength(133);
    expect(new Set(leaves).size).toBe(133);
    expect(Object.keys(SERVICE_FAMILY_LEAVES)).toHaveLength(13);
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

  it('exposes dedicated forms for Créations networks and social setup', () => {
    const tiktok = getServiceFormProfile('svc-creations', 'svc-creations-tiktok');
    expect(tiktok?.familySlug).toBe('svc-creations');
    expect(tiktok?.headline).toMatch(/TikTok/i);
    expect(tiktok?.fields.map(f => f.key)).toEqual(
      expect.arrayContaining([
        'account_type',
        'monetization_goal',
        'content_formats',
        'visual_count',
      ])
    );

    const facebook = getServiceFormProfile('svc-creations', 'svc-creations-facebook');
    expect(facebook?.headline).toMatch(/Facebook/i);
    expect(facebook?.fields.some(f => f.key === 'page_assets')).toBe(true);

    const instagram = getServiceFormProfile('svc-creations', 'svc-creations-instagram');
    expect(instagram?.headline).toMatch(/Instagram/i);
    expect(instagram?.fields.some(f => f.key === 'ig_assets')).toBe(true);

    const linkedin = getServiceFormProfile('svc-creations', 'svc-creations-linkedin');
    expect(linkedin?.headline).toMatch(/LinkedIn/i);
    expect(linkedin?.fields.some(f => f.key === 'li_assets')).toBe(true);

    const setup = getServiceFormProfile(
      'svc-marketing-communication',
      'svc-configuration-reseaux-sociaux'
    );
    expect(setup?.headline).toMatch(/Mise en place/i);
    expect(setup?.fields.map(f => f.key)).toEqual(
      expect.arrayContaining(['channels', 'setup_items', 'account_count'])
    );
    expect(setup?.fields.find(f => f.key === 'setup_items')?.required).toBe(true);
    expect(validateServiceFormAttributes(setup, { channels: ['ig'], account_count: 2 })).toEqual(
      expect.arrayContaining([expect.stringMatching(/Prestations/i)])
    );
    expect(
      validateServiceFormAttributes(setup, {
        channels: ['ig', 'fb'],
        setup_items: ['bio', 'pixel'],
        account_count: 2,
        campaign_weeks: 1,
        kpis: 'Comptes prêts',
      })
    ).toEqual([]);
  });

  it('keeps family profile, extras, and pricing keys aligned', () => {
    const families = Object.keys(SERVICE_FAMILY_LEAVES);
    for (const family of families) {
      expect(
        getServiceFormProfile(family, SERVICE_FAMILY_LEAVES[family][0]),
        family
      ).not.toBeNull();
      expect(getServicePricingGuidance(family).catalogHint.length, family).toBeGreaterThan(0);
    }
    expect(families).toContain('svc-creations');
    expect(SERVICE_FAMILY_LEAVES['svc-creations']).toEqual([
      'svc-creations-tiktok',
      'svc-creations-facebook',
      'svc-creations-instagram',
      'svc-creations-linkedin',
      'svc-creations-youtube',
      'svc-creations-whatsapp',
      'svc-creations-x',
      'svc-creations-snapchat',
      'svc-creations-pinterest',
      'svc-creations-threads',
      'svc-creations-telegram',
      'svc-creations-kwai',
      'svc-creations-google-business',
      'svc-creations-twitch',
      'svc-creations-discord',
      'svc-creations-multi-reseaux',
    ]);
  });

  it('resolves TikTok creations from a stale marketing parent', () => {
    const profile = getServiceFormProfile('svc-marketing-communication', 'svc-creations-tiktok');
    expect(profile?.familySlug).toBe('svc-creations');
    expect(profile?.fields[0]?.key).toBe('account_type');
  });

  it('keeps the SQL seed in sync with every Créations leaf', () => {
    const sql = readFileSync(
      resolve(
        __dirname,
        '../../../../supabase/migrations/20260822170000__service_creations_per_network.sql'
      ),
      'utf8'
    );
    expect(sql).toContain("'svc-creations'");
    for (const slug of SERVICE_FAMILY_LEAVES['svc-creations']) {
      expect(sql, slug).toContain(`'${slug}'`);
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
