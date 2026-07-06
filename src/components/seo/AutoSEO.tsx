/**
 * Composant SEO automatique basé sur la route courante
 * S'insère dans App.tsx pour couvrir toutes les pages publiques
 * Les pages avec leur propre <SEOMeta> écrasent ces valeurs via react-helmet-async
 */

import { useLocation } from 'react-router-dom';
import { SEOMeta } from './SEOMeta';
import { PAGE_SEO_CONFIG } from './PageSEOConfig';
import { isPrivateAppRoute, matchNoindexRoute } from '@/lib/seo/seo-route-rules';

export const AutoSEO = () => {
  const { pathname } = useLocation();

  // La landing gère son propre SEOMeta + JSON-LD (évite conflit de titres)
  if (pathname === '/') return null;

  // /pricing gère sa propre meta + redirection vers /#tarifs
  if (pathname === '/pricing') return null;

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://www.emarzona.com';

  const noindexRule = matchNoindexRoute(pathname);
  if (noindexRule) {
    return (
      <SEOMeta
        title={noindexRule.title}
        description={noindexRule.description}
        url={`${origin}${pathname}`}
        noindex
        nofollow
      />
    );
  }

  const config = PAGE_SEO_CONFIG[pathname];
  const isPrivatePage = isPrivateAppRoute(pathname);

  if (!config && !isPrivatePage) {
    return null;
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
