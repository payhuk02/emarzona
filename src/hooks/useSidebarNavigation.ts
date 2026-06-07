import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { enrichNavSections, filterNavSections } from '@/config/navigation.enrich';
import { translateNavSections } from '@/config/navigation.i18n';
import {
  filterAdminNavSectionsByRbac,
  filterSellerNavSectionsByAccess,
} from '@/config/navigation.rbac';
import { adminMenuSections, userMenuSections } from '@/config/navigation.menus';
import type { NavSection, SidebarPersona } from '@/config/navigation.types';
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

  const enrichedUserSections = useMemo(() => enrichNavSections(userMenuSections), []);
  const enrichedAdminSections = useMemo(() => enrichNavSections(adminMenuSections), []);

  const navPersona = persona === 'buyer' ? 'buyer' : 'seller';

  const sidebarUserSections = useMemo(() => {
    let sections = filterNavSections(enrichedUserSections, navPersona, { sidebarOnly: true });
    sections = filterSellerNavSectionsByAccess(sections, { isPlatformAdmin });
    return translateNavSections(sections, t);
  }, [enrichedUserSections, navPersona, isPlatformAdmin, t]);

  const commandPaletteSections = useMemo(() => {
    if (showAdminMenu) {
      const filtered = filterAdminNavSectionsByRbac(enrichedAdminSections, can, isSuperAdmin);
      return translateNavSections(filtered, t);
    }
    let sections = filterNavSections(enrichedUserSections, navPersona, { sidebarOnly: false });
    sections = filterSellerNavSectionsByAccess(sections, { isPlatformAdmin });
    return translateNavSections(sections, t);
  }, [
    showAdminMenu,
    enrichedAdminSections,
    enrichedUserSections,
    navPersona,
    isPlatformAdmin,
    can,
    isSuperAdmin,
    t,
  ]);

  const activeSections: NavSection[] = useMemo(() => {
    if (showAdminMenu) {
      const filtered = filterAdminNavSectionsByRbac(enrichedAdminSections, can, isSuperAdmin);
      return translateNavSections(filtered, t);
    }
    return sidebarUserSections;
  }, [showAdminMenu, enrichedAdminSections, sidebarUserSections, can, isSuperAdmin, t]);

  return {
    activeSections,
    commandPaletteSections,
    sidebarUserSections,
  };
}
