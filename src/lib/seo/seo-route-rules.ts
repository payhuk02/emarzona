/**
 * Règles SEO par motif de route (noindex, pages utilitaires).
 */
export interface NoindexRouteRule {
  pattern: RegExp;
  title: string;
  description: string;
}

/** Routes dynamiques / utilitaires — ne doivent pas être indexées. */
export const NOINDEX_ROUTE_RULES: NoindexRouteRule[] = [
  {
    pattern: /^\/download\/[^/]+$/,
    title: 'Téléchargement sécurisé | Emarzona',
    description: 'Accès sécurisé à un fichier digital Emarzona.',
  },
  {
    pattern: /^\/wishlist\/shared\/[^/]+$/,
    title: 'Liste de souhaits partagée | Emarzona',
    description: 'Liste de souhaits partagée sur Emarzona.',
  },
  {
    pattern: /^\/aff\/[^/]+$/,
    title: 'Lien affilié | Emarzona',
    description: 'Redirection lien court programme affiliation Emarzona.',
  },
  {
    pattern: /^\/verify\/[^/]+$/,
    title: 'Vérification certificat | Emarzona',
    description: 'Vérification de certificat ou authenticité Emarzona.',
  },
  {
    pattern: /^\/bundles\/[^/]+$/,
    title: 'Offre groupée | Emarzona',
    description: 'Détail offre groupée Emarzona.',
  },
  {
    pattern: /^\/orders\/confirmed$/,
    title: 'Commande confirmée | Emarzona',
    description: 'Confirmation de commande Emarzona.',
  },
];

const PRIVATE_PREFIX = /^\/(dashboard|admin|account|settings)(\/|$)/;

export function matchNoindexRoute(pathname: string): NoindexRouteRule | null {
  for (const rule of NOINDEX_ROUTE_RULES) {
    if (rule.pattern.test(pathname)) return rule;
  }
  return null;
}

export function isPrivateAppRoute(pathname: string): boolean {
  return PRIVATE_PREFIX.test(pathname);
}
