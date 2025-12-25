/**
 * Settings Sidebar - Sidebar contextuelle pour les paramètres
 * Design professionnel et totalement responsive
 */

import { useSearchParams } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
import {
  User,
  Building2,
  Globe,
  Bell,
  Palette,
  Download,
  Shield,
} from 'lucide-react';

// Navigation des paramètres
const settingsNavItems = [
  {
    label: 'Profil',
    path: '/dashboard/settings?tab=profile',
    icon: User,
  },
  {
    label: 'Boutique',
    path: '/dashboard/settings?tab=store',
    icon: Building2,
  },
  {
    label: 'Domaines',
    path: '/dashboard/settings?tab=domain',
    icon: Globe,
  },
  {
    label: 'Notifications',
    path: '/dashboard/settings?tab=notifications',
    icon: Bell,
  },
  {
    label: 'Apparence',
    path: '/dashboard/settings?tab=appearance',
    icon: Palette,
  },
  {
    label: 'Import/Export',
    path: '/dashboard/settings?tab=import-export',
    icon: Download,
  },
  {
    label: 'Sécurité',
    path: '/dashboard/settings?tab=security',
    icon: Shield,
  },
];

// Mapping des tabs vers les labels
const tabToLabel: Record<string, string> = {
  profile: 'Profil',
  store: 'Boutique',
  domain: 'Domaines',
  notifications: 'Notifications',
  appearance: 'Apparence',
  'import-export': 'Import/Export',
  security: 'Sécurité',
};

export const SettingsSidebar = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Paramètres', path: '/dashboard/settings' },
    { label: tabToLabel[activeTab] || 'Paramètres' },
  ];

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-1" aria-label="Navigation paramètres">
        {settingsNavItems.map((item) => {
          const itemTab = item.path.split('tab=')[1]?.split('&')[0];
          const isActive = activeTab === itemTab;
          
          return (
            <ContextSidebarNavItem
              key={item.path}
              label={item.label}
              path={item.path}
              icon={item.icon}
              isActive={isActive}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setTimeout(() => {
                    const event = new Event('close-mobile-sidebar');
                    window.dispatchEvent(event);
                  }, 100);
                }
              }}
            />
          );
        })}
      </nav>
    </BaseContextSidebar>
  );
};

