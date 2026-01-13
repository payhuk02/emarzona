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

  // Charger la boutique si on est sur un sous-domaine
  const { data: store, isLoading, isError, error } = useCurrentStoreBySubdomain();

  useEffect(() => {
    // Si on est sur un sous-domaine, charger la boutique
    if (subdomainInfo.isSubdomain && subdomainInfo.subdomain) {
      logger.info('Subdomain detected', {
        subdomain: subdomainInfo.subdomain,
        baseDomain: subdomainInfo.baseDomain,
        fullHost: subdomainInfo.fullHost,
      });

      if (store) {
        // Boutique trouvée, définir comme boutique sélectionnée
        setSelectedStoreId(store.id);
        logger.info('Store loaded from subdomain', {
          storeId: store.id,
          storeName: store.name,
          subdomain: subdomainInfo.subdomain,
        });
      }
    } else {
      // Pas de sous-domaine, réinitialiser la boutique sélectionnée
      // (pour éviter les conflits avec le système de sélection manuelle)
      // Ne pas réinitialiser si l'utilisateur est sur le dashboard
      if (!location.pathname.startsWith('/dashboard')) {
        setSelectedStoreId(null);
      }
    }
  }, [store, subdomainInfo, setSelectedStoreId, location.pathname]);

  // Afficher une page 404 si la boutique n'existe pas
  if (subdomainInfo.isSubdomain && subdomainInfo.subdomain) {
    if (isLoading) {
      // Afficher un loader pendant le chargement
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
      // Boutique non trouvée, afficher la page 404
      return (
        <StoreNotFound
          subdomain={subdomainInfo.subdomain}
          error={error instanceof Error ? error.message : undefined}
        />
      );
    }
  }

  // Si tout est OK, afficher les enfants normalement
  return <>{children}</>;
}
