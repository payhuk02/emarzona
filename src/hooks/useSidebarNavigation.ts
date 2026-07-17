import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { NavSection, SidebarPersona } from '@/config/navigation.types';
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { resolveNavSections } from '@/lib/navigation/resolveNavItems';
import { useCurrentAdminPermissions } from '@/hooks/useCurrentAdminPermissions';
import { useProgressiveUX } from '@/hooks/useProgressiveUX';

type UseSidebarNavigationOptions = {
  persona: SidebarPersona;
  isPlatformAdmin: boolean;
  showAdminMenu: boolean;
  commerceType?: StoreCommerceType | null;
  storeMetadata?: Record<string, unknown> | null;
};

export function useSidebarNavigation({
  persona,
  isPlatformAdmin,
  showAdminMenu,
  commerceType,
  storeMetadata,
}: UseSidebarNavigationOptions) {
  const { t } = useTranslation();
  const { isExpertMode } = useProgressiveUX();
  const { can, isSuperAdmin } = useCurrentAdminPermissions();

  const navBase = useMemo(
    () => ({
      persona,
      isPlatformAdmin,
      commerceType,
      storeMetadata,
      can,
      isSuperAdmin,
      isExpertMode,
      t,
    }),
    [persona, isPlatformAdmin, commerceType, storeMetadata, can, isSuperAdmin, isExpertMode, t]
  );

  const sidebarUserSections = useMemo(
    () => resolveNavSections({ scope: 'sidebar', ...navBase }),
    [navBase]
  );

  const commandPaletteSections = useMemo(() => {
    if (showAdminMenu) {
      return resolveNavSections({ scope: 'admin', ...navBase });
    }
    return resolveNavSections({ scope: 'command', ...navBase });
  }, [showAdminMenu, navBase]);

  const activeSections: NavSection[] = useMemo(() => {
    if (showAdminMenu) {
      return resolveNavSections({ scope: 'admin', ...navBase });
    }
    return sidebarUserSections;
  }, [showAdminMenu, sidebarUserSections, navBase]);

  return {
    activeSections,
    commandPaletteSections,
    sidebarUserSections,
  };
}
