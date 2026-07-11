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
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { detectSubdomain, RESERVED_SUBDOMAINS } from '@/lib/subdomain-detector';
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
  const { data: store, isPending, isError, error } = useCurrentStoreBySubdomain();

  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7740/ingest/c21af8ec-02ef-48c9-95f8-23aa8fa2c366', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '47357a' },
      body: JSON.stringify({
        sessionId: '47357a',
        runId: 'pre-fix',
        hypothesisId: 'A',
        location: 'SubdomainMiddleware.tsx:render',
        message: 'subdomain middleware query state',
        data: {
          host: window.location.hostname,
          shouldResolveStore:
            !subdomainInfo.isPlatformDomain &&
            ((subdomainInfo.isStoreDomain &&
              subdomainInfo.isSubdomain &&
              !!subdomainInfo.subdomain) ||
              (subdomainInfo.isCustomDomain && !!subdomainInfo.customDomain)),
          isPending,
          isError,
          hasStore: !!store,
          storeSlug: store?.slug ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion

  useEffect(() => {
    const isStoreSubdomain =
      subdomainInfo.isStoreDomain && subdomainInfo.isSubdomain && subdomainInfo.subdomain;
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

  // Rediriger l'apex myemarzona.shop vers emarzona.com
  useEffect(() => {
    if (subdomainInfo.isStoreDomain && !subdomainInfo.isSubdomain && !subdomainInfo.subdomain) {
      window.location.replace('https://www.emarzona.com');
    }
  }, [subdomainInfo]);

  // Bloquer les sous-domaines réservés
  const isReservedSubdomain =
    subdomainInfo.isStoreDomain && subdomainInfo.isSubdomain && subdomainInfo.subdomain
      ? RESERVED_SUBDOMAINS.includes(subdomainInfo.subdomain.toLowerCase())
      : false;

  // Déterminer si on doit résoudre une boutique
  const shouldResolveStore =
    !subdomainInfo.isPlatformDomain &&
    !isReservedSubdomain &&
    ((subdomainInfo.isStoreDomain && subdomainInfo.isSubdomain && subdomainInfo.subdomain) ||
      (subdomainInfo.isCustomDomain && subdomainInfo.customDomain));

  // Sous-domaine réservé → rediriger vers la plateforme
  if (isReservedSubdomain) {
    window.location.replace('https://www.emarzona.com');
    return null;
  }

  if (shouldResolveStore) {
    // TanStack Query v5: isPending=true while no data yet (even before fetch starts).
    // Using isLoading alone allowed a render frame with store=undefined → crash on store.slug.
    if (isPending) {
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

    const storeSlug = store.slug || subdomainInfo.subdomain || '';
    if (!storeSlug) {
      return (
        <StoreNotFound
          subdomain={subdomainInfo.subdomain || subdomainInfo.customDomain || ''}
          error="Boutique sans identifiant (slug manquant)"
        />
      );
    }

    // ✅ Store trouvée : afficher les routes de boutique au lieu des routes plateforme
    return (
      <StoreSubdomainRoutes
        storeSlug={storeSlug}
        storeName={store.name}
        logoUrl={store.logo_url}
        commerceType={store.commerce_type as StoreCommerceType}
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
