import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resolveHorizontalNavDomains } from '@/lib/navigation/resolveHorizontalNav';
import { resolveHorizontalNavPersona } from '@/config/navigation.horizontal';
import { useAdmin } from '@/hooks/useAdmin';
import { useStoreContext } from '@/contexts/StoreContext';
import { useStorePhysicalAccess } from '@/hooks/billing/useStorePhysicalAccess';
import { useSidebarPersona } from '@/hooks/useSidebarPersona';
import { useProgressiveUX } from '@/hooks/useProgressiveUX';

export function useHorizontalContextNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const { isAdmin } = useAdmin();
  const { persona: sidebarPersona } = useSidebarPersona(isAdmin);
  const { selectedStoreId, selectedStore } = useStoreContext();
  const { planSlug } = useStorePhysicalAccess(selectedStoreId);
  const commerceType = selectedStore?.commerce_type;
  const persona = resolveHorizontalNavPersona(location.pathname, sidebarPersona);
  const { isExpertMode } = useProgressiveUX();

  return useMemo(
    () =>
      resolveHorizontalNavDomains({
        persona,
        isPlatformAdmin: isAdmin,
        physicalPlanSlug: planSlug,
        commerceType,
        isExpertMode,
        pathname: location.pathname,
        search: location.search,
        t,
      }),
    [persona, isAdmin, planSlug, commerceType, isExpertMode, location.pathname, location.search, t]
  );
}
