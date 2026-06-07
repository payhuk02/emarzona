import type { ComponentType } from 'react';
import { User, Building2, Globe, Bell, Palette, Download, Shield, Settings } from 'lucide-react';
import type { ContextSidebarConfig, StaticContextNavItem } from '@/config/navigation.context.types';

export type { StaticContextNavItem };

/** Settings tabs — not represented as separate routes in navigation.menus */
export const SETTINGS_TAB_ITEMS = [
  { title: 'Profil', url: '/dashboard/settings?tab=profile', icon: User, tab: 'profile' },
  { title: 'Boutique', url: '/dashboard/settings?tab=store', icon: Building2, tab: 'store' },
  { title: 'Domaines', url: '/dashboard/settings?tab=domain', icon: Globe, tab: 'domain' },
  {
    title: 'Notifications',
    url: '/dashboard/settings?tab=notifications',
    icon: Bell,
    tab: 'notifications',
  },
  {
    title: 'Apparence',
    url: '/dashboard/settings?tab=appearance',
    icon: Palette,
    tab: 'appearance',
  },
  {
    title: 'Import/Export',
    url: '/dashboard/settings?tab=import-export',
    icon: Download,
    tab: 'import-export',
  },
  { title: 'Sécurité', url: '/dashboard/settings?tab=security', icon: Shield, tab: 'security' },
] as const;

export const SETTINGS_CONTEXT_CONFIG: ContextSidebarConfig = {
  id: 'settings',
  sectionKey: 'configuration',
  rootPath: '/dashboard/settings',
  breadcrumbSectionKey: 'parametres',
  ariaLabel: 'Navigation paramètres',
  activeMatch: 'tab',
  staticItems: [...SETTINGS_TAB_ITEMS],
};
