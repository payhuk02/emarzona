import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resolveHorizontalNavDomains } from '@/lib/navigation/resolveHorizontalNav';
import { useAdmin } from '@/hooks/useAdmin';
import { useStoreContext } from '@/contexts/StoreContext';
import { useStorePhysicalAccess } from '@/hooks/billing/useStorePhysicalAccess';

export function useHorizontalContextNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const { isAdmin } = useAdmin();
  const { selectedStoreId } = useStoreContext();
  const { planSlug } = useStorePhysicalAccess(selectedStoreId);

  return useMemo(
    () =>
      resolveHorizontalNavDomains({
        isPlatformAdmin: isAdmin,
        physicalPlanSlug: planSlug,
        pathname: location.pathname,
        search: location.search,
        t,
      }),
    [isAdmin, planSlug, location.pathname, location.search, t]
  );
}
