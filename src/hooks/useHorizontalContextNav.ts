import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resolveHorizontalNavDomains } from '@/lib/navigation/resolveHorizontalNav';
import { toCommerceNavPersona } from '@/config/navigation.persona';
import { useAdmin } from '@/hooks/useAdmin';
import { useStoreContext } from '@/contexts/StoreContext';
import { useStore } from '@/hooks/useStore';
import { useStorePhysicalAccess } from '@/hooks/billing/useStorePhysicalAccess';
import { useSidebarPersona } from '@/hooks/useSidebarPersona';
import { useProgressiveUX } from '@/hooks/useProgressiveUX';
import { resolveStoreCommerceTypeFromStore } from '@/lib/commerce/store-capability-map';

export function useHorizontalContextNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const { isAdmin } = useAdmin();
  const { persona: sidebarPersona } = useSidebarPersona(isAdmin);
  const { selectedStoreId, selectedStore } = useStoreContext();
  const { store: detailStore } = useStore();
  const { planSlug } = useStorePhysicalAccess(selectedStoreId);
  const commerceStore =
    detailStore?.id === selectedStoreId ? detailStore : (selectedStore ?? detailStore);
  const commerceType = commerceStore ? resolveStoreCommerceTypeFromStore(commerceStore) : undefined;
  const storeMetadata =
    (commerceStore?.metadata as Record<string, unknown> | null | undefined) ?? null;
  const persona = toCommerceNavPersona(sidebarPersona);
  const { isExpertMode } = useProgressiveUX();

  return useMemo(
    () =>
      resolveHorizontalNavDomains({
        persona,
        isPlatformAdmin: isAdmin,
        physicalPlanSlug: planSlug,
        commerceType,
        storeMetadata,
        isExpertMode,
        pathname: location.pathname,
        search: location.search,
        t,
      }),
    [
      persona,
      isAdmin,
      planSlug,
      commerceType,
      storeMetadata,
      isExpertMode,
      location.pathname,
      location.search,
      t,
    ]
  );
}
