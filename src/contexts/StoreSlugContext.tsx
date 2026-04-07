/**
 * Context pour fournir le slug de boutique dans les routes subdomain
 * Permet aux pages (Storefront, ProductDetail, StoreLegalPage) de fonctionner
 * sans avoir le slug dans l'URL (sous-domaine = slug)
 */

import { createContext, useContext, ReactNode } from 'react';

interface StoreSlugContextType {
  storeSlug: string | null;
}

const StoreSlugContext = createContext<StoreSlugContextType>({ storeSlug: null });

export function StoreSlugProvider({ slug, children }: { slug: string; children: ReactNode }) {
  return (
    <StoreSlugContext.Provider value={{ storeSlug: slug }}>
      {children}
    </StoreSlugContext.Provider>
  );
}

/**
 * Hook pour récupérer le slug de boutique.
 * Priorité : useParams().slug > StoreSlugContext (subdomain)
 */
export function useStoreSlug(): string | undefined {
  const ctx = useContext(StoreSlugContext);
  return ctx.storeSlug || undefined;
}
