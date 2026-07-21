/**
 * Matrice smoke Playwright — routes critiques plateforme (audit P0–P5).
 * Source unique alignée avec platform-routes-audit.ts.
 */

/** Routes publiques — invité, pas de 404 / crash. */
export const PUBLIC_CRITICAL_SMOKE_PATHS = [
  '/',
  '/marketplace',
  '/cart',
  '/checkout',
  '/login',
  '/register',
  '/status',
  '/courses',
  '/auctions',
  '/faq',
  '/about',
  '/contact',
] as const;

/** Redirections legacy — chemin final attendu (regex). */
export const LEGACY_REDIRECT_SMOKE: readonly {
  from: string;
  expectUrl: RegExp;
  auth?: 'guest' | 'vendor';
}[] = [
  { from: '/cart-old', expectUrl: /\/marketplace(?:\?|$|\/)/, auth: 'guest' },
  { from: '/checkout/cart', expectUrl: /\/marketplace(?:\?|$|\/)/, auth: 'guest' },
  { from: '/cart/checkout', expectUrl: /\/marketplace(?:\?|$|\/)/, auth: 'guest' },
  { from: '/connexion', expectUrl: /\/login(?:\?|$|\/)/, auth: 'guest' },
  { from: '/faqs', expectUrl: /\/faq(?:\?|$|\/)/, auth: 'guest' },
  {
    from: '/dashboard/advanced-orders-test',
    expectUrl: /\/dashboard\/advanced-orders/,
    auth: 'vendor',
  },
  { from: '/shipping', expectUrl: /\/dashboard\/shipping/, auth: 'vendor' },
  { from: '/inventory', expectUrl: /\/dashboard\/inventory/, auth: 'vendor' },
  {
    from: '/dashboard/smart-notifications',
    expectUrl: /\/settings\/notifications/,
    auth: 'vendor',
  },
  { from: '/dashboard/physical-webhooks', expectUrl: /\/dashboard\/webhooks/, auth: 'vendor' },
];

/** Routes protégées — invité redirige vers auth ou affiche loader (pas 404). */
export const PROTECTED_SMOKE_PATHS = ['/dashboard', '/admin', '/account'] as const;

/** Dashboard vendeur — shell charge sans erreur critique (auth requis). */
export const VENDOR_CRITICAL_SMOKE_PATHS = [
  '/dashboard',
  '/dashboard/orders',
  '/dashboard/customers',
  '/dashboard/analytics',
  '/dashboard/settings',
  '/dashboard/integrations',
  '/dashboard/webhooks',
  '/dashboard/physical-products',
  '/dashboard/digital-products',
  '/dashboard/courses',
  '/dashboard/services',
  '/dashboard/artist-products',
  '/dashboard/physical-inventory',
  '/dashboard/shipping',
  '/settings/notifications',
] as const;

/** Tous les chemins statiques de la matrice (Vitest : enregistrement routes). */
export function allSmokeMatrixStaticPaths(): string[] {
  return [
    ...PUBLIC_CRITICAL_SMOKE_PATHS,
    ...PROTECTED_SMOKE_PATHS,
    ...VENDOR_CRITICAL_SMOKE_PATHS,
    ...LEGACY_REDIRECT_SMOKE.map(r => r.from),
  ];
}

/** Vérifie qu'un chemin nav/matrice correspond à une route enregistrée. */
export function smokePathMatchesRegistered(path: string, registered: readonly string[]): boolean {
  const itemPath = path.split('?')[0];
  if (registered.includes(itemPath)) return true;
  for (const pattern of registered) {
    if (!pattern.includes(':') || pattern.includes('*')) continue;
    const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, '[^/]+')}$`);
    if (regex.test(itemPath)) return true;
  }
  return false;
}
