import { describe, expect, it } from 'vitest';
import { applyArrayOverrides } from '@/hooks/useLandingPremiumT';

describe('applyArrayOverrides', () => {
  const base = [
    {
      id: 'physical',
      title: 'Produits physiques',
      desc: 'Description base',
      bullets: ['A', 'B', 'C'],
      cta: 'CTA base',
      imageAlt: 'Alt base',
    },
    {
      id: 'digital',
      title: 'Produits digitaux',
      desc: 'Desc digital',
      bullets: ['D1', 'D2'],
      cta: 'CTA digital',
      imageAlt: 'Alt digital',
    },
  ];

  it('overrides nested title/desc/cta and bullet strings', () => {
    const customization = {
      'sellWays.items.0.title': 'Titre custom',
      'sellWays.items.0.bullets.1': 'Point B custom',
      'sellWays.items.1.cta': 'CTA custom',
      'landingPremium.sellWays.items.1.desc': 'Desc via préfixe',
    };

    const result = applyArrayOverrides(base, 'sellWays.items', customization);

    expect(result[0].title).toBe('Titre custom');
    expect(result[0].bullets).toEqual(['A', 'Point B custom', 'C']);
    expect(result[0].id).toBe('physical');
    expect(result[1].cta).toBe('CTA custom');
    expect(result[1].desc).toBe('Desc via préfixe');
  });

  it('keeps base values when overrides are empty', () => {
    const result = applyArrayOverrides(base, 'sellWays.items', {
      'sellWays.items.0.title': '',
    });
    expect(result[0].title).toBe('Produits physiques');
  });
});
