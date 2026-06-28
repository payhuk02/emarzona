/**
 * Définition des modules et routes considérés comme "Avancés" / "Experts".
 * En mode "Essentiel", tous ces liens de navigation seront masqués pour
 * réduire la charge cognitive d'un nouveau marchand.
 */

// Liste des préfixes d'URLs qui ne doivent pas s'afficher en mode essentiel.
export const EXPERT_ONLY_PATHS = [
  // Marketing & Gamification
  '/dashboard/gamification',
  '/dashboard/affiliates',
  '/dashboard/store-affiliates',
  '/dashboard/referrals',
  '/dashboard/emails/workflows',
  '/dashboard/emails/segments',
  '/dashboard/emails/tags',

  // Analytics Complexes
  '/dashboard/core-web-vitals',
  '/dashboard/auctions', // Enchères d'art = avancé
  '/dashboard/abandoned-carts',

  // Paramétrages pointus
  '/dashboard/integrations', // Systèmes externes
  '/dashboard/digital/updates', // Mises à jour OTA de fichiers (OTA = avancé)
  '/dashboard/taxes', // Comptabilité lourde = expert
  '/dashboard/payment-connections', // Passerelles manuelles
];

/**
 * Vérifie si une route donnée nécessite le Mode Expert pour être affichée dans la navigation.
 */
export function requiresExpertMode(url: string): boolean {
  const cleanUrl = url.split('?')[0];
  return EXPERT_ONLY_PATHS.some(
    expertPath => cleanUrl === expertPath || cleanUrl.startsWith(`${expertPath}/`)
  );
}
