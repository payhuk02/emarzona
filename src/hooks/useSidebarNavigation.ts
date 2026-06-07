import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { NavSection, SidebarPersona } from '@/config/navigation.types';
import { resolveNavSections } from '@/lib/navigation/resolveNavItems';
import { useCurrentAdminPermissions } from '@/hooks/useCurrentAdminPermissions';

type UseSidebarNavigationOptions = {
  persona: SidebarPersona;
  isPlatformAdmin: boolean;
  showAdminMenu: boolean;
};

export function useSidebarNavigation({
  persona,
  isPlatformAdmin,
  showAdminMenu,
}: UseSidebarNavigationOptions) {
  const { t } = useTranslation();
  const { can, isSuperAdmin } = useCurrentAdminPermissions();

  const sidebarUserSections = useMemo(
    () =>
      resolveNavSections({
        scope: 'sidebar',
        persona,
        isPlatformAdmin,
        can,
        isSuperAdmin,
        t,
      }),
    [persona, isPlatformAdmin, can, isSuperAdmin, t]
  );

  const commandPaletteSections = useMemo(() => {
    if (showAdminMenu) {
      return resolveNavSections({
        scope: 'admin',
        persona,
        isPlatformAdmin,
        can,
        isSuperAdmin,
        t,
      });
    }
    return resolveNavSections({
      scope: 'command',
      persona,
      isPlatformAdmin,
      can,
      isSuperAdmin,
      t,
    });
  }, [showAdminMenu, persona, isPlatformAdmin, can, isSuperAdmin, t]);

  const activeSections: NavSection[] = useMemo(() => {
    if (showAdminMenu) {
      return resolveNavSections({
        scope: 'admin',
        persona,
        isPlatformAdmin,
        can,
        isSuperAdmin,
        t,
      });
    }
    return sidebarUserSections;
  }, [showAdminMenu, persona, isPlatformAdmin, sidebarUserSections, can, isSuperAdmin, t]);

  return {
    activeSections,
    commandPaletteSections,
    sidebarUserSections,
  };
}
