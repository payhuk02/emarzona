/**
 * Middleware pour gérer les sous-domaines multi-tenant
 *
 * Détecte automatiquement le sous-domaine et charge la boutique correspondante
 * Sur un domaine de boutique (*.myemarzona.shop), affiche les routes de boutique
 * Sur le domaine plateforme (emarzona.com), affiche les routes normales
 *
 * Date: 1 Février 2025
 */

import { useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useCurrentStoreBySubdomain } from '@/hooks/useStoreBySubdomain';
import { detectSubdomain } from '@/lib/subdomain-detector';
import { logger } from '@/lib/logger';
import { useStoreContext } from '@/contexts/StoreContext';
import { StoreNotFound } from './StoreNotFound';
import { StoreSubdomainRoutes } from '@/routes/storeSubdomainRoutes';

interface SubdomainMiddlewareProps {
  children: ReactNode;
}

/**
 * Middleware qui intercepte les requêtes sur les sous-domaines
 * et charge automatiquement la boutique correspondante
 */
export function SubdomainMiddleware({ children }: SubdomainMiddlewareProps) {
  const location = useLocation();
  const subdomainInfo = detectSubdomain();
  const { setSelectedStoreId } = useStoreContext();

  // Charger la boutique UNIQUEMENT si on est sur myemarzona.shop (domaine des boutiques)
  const { data: store, isLoading, isError, error } = useCurrentStoreBySubdomain();

  useEffect(() => {
    const isStoreSubdomain = subdomainInfo.isStoreDomain && subdomainInfo.isSubdomain && subdomainInfo.subdomain;
    const isCustomDomain = subdomainInfo.isCustomDomain && subdomainInfo.customDomain;

    if (isStoreSubdomain || isCustomDomain) {
      logger.info('Store domain detected', {
        subdomain: subdomainInfo.subdomain,
        customDomain: subdomainInfo.customDomain,
        baseDomain: subdomainInfo.baseDomain,
        fullHost: subdomainInfo.fullHost,
      });

      if (store) {
        setSelectedStoreId(store.id);
        logger.info('Store loaded', {
          storeId: store.id,
          storeName: store.name,
          subdomain: subdomainInfo.subdomain,
          customDomain: subdomainInfo.customDomain,
        });
      }
    } else {
      if (!location.pathname.startsWith('/dashboard')) {
        setSelectedStoreId(null);
      }
    }
  }, [store, subdomainInfo, setSelectedStoreId, location.pathname]);

  // Déterminer si on doit résoudre une boutique
  const shouldResolveStore =
    !subdomainInfo.isPlatformDomain &&
    ((subdomainInfo.isStoreDomain && subdomainInfo.isSubdomain && subdomainInfo.subdomain) ||
      (subdomainInfo.isCustomDomain && subdomainInfo.customDomain));

  if (shouldResolveStore) {
    // Loading
    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Chargement de la boutique...</p>
          </div>
        </div>
      );
    }

    // Store not found
    if (isError || !store) {
      return (
        <StoreNotFound
          subdomain={subdomainInfo.subdomain || subdomainInfo.customDomain || ''}
          error={error instanceof Error ? error.message : undefined}
        />
      );
    }

    // ✅ Store trouvée : afficher les routes de boutique au lieu des routes plateforme
    return (
      <StoreSubdomainRoutes
        storeSlug={store.slug}
        storeName={store.name}
        logoUrl={store.logo_url}
        storeThemeColors={{
          primaryColor: store.primary_color,
          secondaryColor: store.secondary_color,
          accentColor: store.accent_color,
          backgroundColor: store.background_color,
          textColor: store.text_color,
        }}
      />
    );
  }

  // Domaine plateforme : afficher les routes normales
  return <>{children}</>;
}
