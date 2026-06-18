/**
 * Composant SEO automatique basé sur la route courante
 * S'insère dans App.tsx pour couvrir toutes les pages publiques
 * Les pages avec leur propre <SEOMeta> écrasent ces valeurs via react-helmet-async
 */

import { useLocation } from 'react-router-dom';
import { SEOMeta } from './SEOMeta';
import { PAGE_SEO_CONFIG } from './PageSEOConfig';

export const AutoSEO = () => {
  const { pathname } = useLocation();

  // La landing gère son propre SEOMeta + JSON-LD (évite conflit de titres)
  if (pathname === '/') return null;

  // Origine dynamique : preview, lovable.app, custom domain — jamais hardcodée
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://www.emarzona.com';

  // Chercher une config exacte ou la route parente la plus proche
  const config = PAGE_SEO_CONFIG[pathname];

  // Pour les pages dashboard/admin, forcer noindex même sans config
  const isPrivatePage = /^\/(dashboard|admin|account|settings)/.test(pathname);

  if (!config && !isPrivatePage) {
    return null; // Pas de config et pas une page privée → pas de meta auto
  }

  if (isPrivatePage && !config) {
    return (
      <SEOMeta
        title="Emarzona"
        description="Espace personnel Emarzona."
        url={`${origin}${pathname}`}
        noindex
        nofollow
      />
    );
  }

  if (!config) return null;

  return (
    <SEOMeta
      title={config.title}
      description={config.description}
      url={`${origin}${pathname}`}
      keywords={config.keywords}
      type={config.type}
      noindex={config.noindex}
      nofollow={config.nofollow}
    />
  );
};
