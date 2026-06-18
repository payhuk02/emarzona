import { describe, it, expect } from 'vitest';
import { aggregateTrafficSources, classifyTrafficSource } from '@/lib/analytics/traffic-sources';

describe('classifyTrafficSource', () => {
  it('détecte le trafic direct sans referrer', () => {
    expect(classifyTrafficSource({})).toBe('direct');
  });

  it('détecte la recherche organique via referrer Google', () => {
    expect(classifyTrafficSource({ referrer: 'https://www.google.com/search?q=emarzona' })).toBe(
      'organic_search'
    );
  });

  it('détecte les réseaux sociaux via utm_medium', () => {
    expect(classifyTrafficSource({ utm_source: 'facebook', utm_medium: 'social' })).toBe('social');
  });

  it('détecte la publicité payante', () => {
    expect(classifyTrafficSource({ utm_source: 'google', utm_medium: 'cpc' })).toBe('paid');
  });
});

describe('aggregateTrafficSources', () => {
  it('agrège les sessions en parts de marché', () => {
    const slices = aggregateTrafficSources([
      { referrer: 'https://google.com' },
      { referrer: 'https://google.com' },
      {},
    ]);

    expect(slices).toHaveLength(2);
    expect(slices[0].name).toBe('Recherche organique');
    expect(slices[0].value).toBe(67);
    expect(slices[1].name).toBe('Direct');
    expect(slices[1].value).toBe(33);
  });

  it('retourne un tableau vide sans sessions', () => {
    expect(aggregateTrafficSources([])).toEqual([]);
  });
});
