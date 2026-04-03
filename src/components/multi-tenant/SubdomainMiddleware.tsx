/**
 * Middleware pour gérer les sous-domaines multi-tenant
 *
 * Détecte automatiquement le sous-domaine et charge la boutique correspondante
 * Redirige vers la page 404 si la boutique n'existe pas
 *
 * Date: 1 Février 2025
 */

import { useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCurrentStoreBySubdomain } from '@/hooks/useStoreBySubdomain';
import { detectSubdomain } from '@/lib/subdomain-detector';
import { logger } from '@/lib/logger';
import { useStoreContext } from '@/contexts/StoreContext';
import { StoreNotFound } from './StoreNotFound';

interface SubdomainMiddlewareProps {
  children: ReactNode;
}

/**
 * Middleware qui intercepte les requêtes sur les sous-domaines
 * et charge automatiquement la boutique correspondante
 */
export function SubdomainMiddleware({ children }: SubdomainMiddlewareProps) {
  const navigate = useNavigate();
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

  // Afficher une page 404 si la boutique n'existe pas
  // Pour les sous-domaines myemarzona.shop ET les domaines personnalisés uniquement
  const shouldResolveStore =
    !subdomainInfo.isPlatformDomain &&
    ((subdomainInfo.isStoreDomain && subdomainInfo.isSubdomain && subdomainInfo.subdomain) ||
      (subdomainInfo.isCustomDomain && subdomainInfo.customDomain));

  if (shouldResolveStore) {
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

    if (isError || !store) {
      return (
        <StoreNotFound
          subdomain={subdomainInfo.subdomain || subdomainInfo.customDomain || ''}
          error={error instanceof Error ? error.message : undefined}
        />
      );
    }
  }

  // Si tout est OK, afficher les enfants normalement
  return <>{children}</>;
}
