import { describe, expect, it } from 'vitest';
import {
  enrichNavSections,
  filterNavSections,
  BUYER_PRIMARY_PATHS,
} from '@/config/navigation.enrich';
import { userMenuSections } from '@/config/navigation.menus';
import { resolveHorizontalNavDomains } from '@/lib/navigation/resolveHorizontalNav';

const mockT = (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key;

describe('buyer navigation gap audit', () => {
  it('keeps buyer sidebar compact with hub only in Mon Compte', () => {
    const compact = filterNavSections(enrichNavSections(userMenuSections), 'buyer', {
      sidebarOnly: true,
    });
    const visible = compact.flatMap(s => s.items.map(i => i.url.split('?')[0]));

    expect(compact.find(s => s.sectionKey === 'principal')).toBeUndefined();
    expect(visible).toEqual(['/account']);
    expect(BUYER_PRIMARY_PATHS.has('/account')).toBe(true);
  });

  it('routes extended buyer links through horizontal nav domains', () => {
    const domains = resolveHorizontalNavDomains({
      persona: 'buyer',
      isPlatformAdmin: false,
      pathname: '/account',
      search: '',
      t: mockT as never,
    });

    const allPaths = new Set(domains.flatMap(d => d.items.map(i => i.path)));

    expect(domains.map(d => d.domainKey)).toEqual([
      'decouvrir',
      'profil_compte',
      'achats',
      'portails',
      'services_fidelite',
    ]);

    expect(allPaths.has('/marketplace')).toBe(true);
    expect(allPaths.has('/auctions')).toBe(true);
    expect(allPaths.has('/recommendations')).toBe(true);
    expect(allPaths.has('/account/orders')).toBe(true);
    expect(allPaths.has('/account/digital')).toBe(true);
    expect(allPaths.has('/cart')).toBe(true);
    expect(allPaths.has('/dashboard/gamification')).toBe(true);
  });

  it('structures Portails and Découvrir en sous-groupes mega-menu', () => {
    const domains = resolveHorizontalNavDomains({
      persona: 'buyer',
      isPlatformAdmin: false,
      pathname: '/account/digital',
      search: '',
      t: mockT as never,
    });

    expect(domains.find(d => d.domainKey === 'portails')?.subgroups?.map(g => g.groupKey)).toEqual([
      'mon_portail_digital',
      'produits_physiques',
      'mes_cours',
    ]);
    expect(domains.find(d => d.domainKey === 'decouvrir')?.subgroups?.map(g => g.groupKey)).toEqual(
      ['boutique', 'recommandations_ia']
    );
  });

  it('marque Achats actif sur /cart', () => {
    const domains = resolveHorizontalNavDomains({
      persona: 'buyer',
      isPlatformAdmin: false,
      pathname: '/cart',
      search: '',
      t: mockT as never,
    });
    expect(domains.find(d => d.domainKey === 'achats')?.isActive).toBe(true);
  });
});
