import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { NavSurface, ResolvedNavItem } from '@/lib/navigation/resolveNavItems';
import { resolveNavItems } from '@/lib/navigation/resolveNavItems';
import type { SidebarPersona } from '@/config/navigation.types';
import { useAdmin } from '@/hooks/useAdmin';
import { useCurrentAdminPermissions } from '@/hooks/useCurrentAdminPermissions';
import { useStoreContext } from '@/contexts/StoreContext';
import { useStorePhysicalAccess } from '@/hooks/billing/useStorePhysicalAccess';

type UseResolvedNavItemsOptions = {
  surface: Extract<NavSurface, 'topnav' | 'bottomnav'>;
  /** Override detected persona (defaults to seller). */
  persona?: SidebarPersona;
};

export function useResolvedNavItems({
  surface,
  persona: personaOverride,
}: UseResolvedNavItemsOptions): ResolvedNavItem[] {
  const { t } = useTranslation();
  const { isAdmin } = useAdmin();
  const { can, isSuperAdmin } = useCurrentAdminPermissions();
  const { selectedStoreId, selectedStore } = useStoreContext();
  const { planSlug } = useStorePhysicalAccess(selectedStoreId);
  const commerceType = selectedStore?.commerce_type;

  const persona: SidebarPersona = personaOverride ?? 'seller';

  return useMemo(
    () =>
      resolveNavItems({
        surface,
        persona,
        isPlatformAdmin: isAdmin,
        can,
        isSuperAdmin,
        physicalPlanSlug: planSlug,
        commerceType,
        t,
      }),
    [surface, persona, isAdmin, can, isSuperAdmin, planSlug, commerceType, t]
  );
}
