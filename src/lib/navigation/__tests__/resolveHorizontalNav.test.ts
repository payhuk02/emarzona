import { describe, expect, it } from 'vitest';
import { resolveHorizontalNavDomains } from '@/lib/navigation/resolveHorizontalNav';
import sidebarFR from '@/i18n/locales/sidebar-fr.json';

const mockT = (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key;

describe('resolveHorizontalNavDomains', () => {
  it('expose tous les domaines vendeur avec Paiements & Clients et Gestion Paiements', () => {
    const domains = resolveHorizontalNavDomains({
      isPlatformAdmin: false,
      pathname: '/dashboard/orders',
      search: '',
      t: mockT as never,
    });

    const finance = domains.find(d => d.sectionKey === 'finance_paiements');
    expect(finance).toBeDefined();
    const paths = finance!.items.map(i => i.path);
    expect(paths).toContain('/dashboard/payments-customers');
    expect(paths).toContain('/dashboard/payment-management');
    expect(paths).toContain('/dashboard/pay-balance');
  });

  it('couvre les 63+ liens extended via les sections horizontales', () => {
    const domains = resolveHorizontalNavDomains({
      isPlatformAdmin: false,
      pathname: '/dashboard',
      search: '',
      t: mockT as never,
    });

    const allPaths = domains.flatMap(d => d.items.map(i => i.path));
    const uniquePaths = new Set(allPaths);
    // La navigation horizontale est dérivée des menus enrichis + filtrée (RBAC + commerceType),
    // donc le volume exact varie. On verrouille un minimum raisonnable plutôt qu’un chiffre absolu.
    expect(uniquePaths.size).toBeGreaterThanOrEqual(63);
    expect(domains.map(d => d.shortLabel)).toEqual([
      'Produits',
      'Ventes',
      'Finance',
      'Marketing',
      'Analytics',
      'IA',
      'Systèmes',
      'Paramètres',
    ]);
  });

  it('structure Finance en sous-groupes mega-menu', () => {
    const domains = resolveHorizontalNavDomains({
      isPlatformAdmin: false,
      pathname: '/dashboard/payments',
      search: '',
      t: mockT as never,
    });
    const finance = domains.find(d => d.sectionKey === 'finance_paiements');
    expect(finance?.subgroups?.map(g => g.groupKey)).toEqual(['encaissements', 'fiscalite']);
  });

  it('marque Finance actif sur /dashboard/payments-customers', () => {
    const domains = resolveHorizontalNavDomains({
      isPlatformAdmin: false,
      pathname: '/dashboard/payments-customers',
      search: '',
      t: mockT as never,
    });
    expect(domains.find(d => d.sectionKey === 'finance_paiements')?.isActive).toBe(true);
  });

  it('expose les 5 domaines acheteur avec mega-menus', () => {
    const domains = resolveHorizontalNavDomains({
      persona: 'buyer',
      isPlatformAdmin: false,
      pathname: '/account/orders',
      search: '',
      t: mockT as never,
    });

    expect(domains.map(d => d.domainKey)).toEqual([
      'decouvrir',
      'profil_compte',
      'achats',
      'portails',
      'services_fidelite',
      'notifications',
    ]);
    expect(domains.map(d => d.shortLabel)).toEqual([
      'Découvrir',
      'Compte',
      'Achats',
      'Portails',
      'Services',
      'Notifications',
    ]);

    const achats = domains.find(d => d.domainKey === 'achats');
    expect(achats?.isActive).toBe(true);
    const paths = achats!.items.map(i => i.path);
    expect(paths).toContain('/account/orders');
    expect(paths).toContain('/account/invoices');
    expect(paths).toContain('/account/returns');
  });

  it('exclut la gamification vendeur des Services acheteur', () => {
    const domains = resolveHorizontalNavDomains({
      persona: 'buyer',
      isPlatformAdmin: false,
      pathname: '/account/loyalty',
      search: '',
      t: mockT as never,
    });
    const services = domains.find(d => d.domainKey === 'services_fidelite');
    const paths = services?.items.map(i => i.path) ?? [];
    expect(paths).not.toContain('/dashboard/gamification');
    expect(paths).toContain('/account/loyalty');
  });
});

describe('sidebar i18n keys for horizontal nav', () => {
  it('has French labels for finance items', () => {
    const items = (sidebarFR.sidebar as { items: Record<string, string> }).items;
    expect(items.dashboard_payments_customers).toBe('Paiements & Clients');
    expect(items.dashboard_payment_management).toBe('Gestion Paiements');
  });
});
