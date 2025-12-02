/**
 * Settings Sidebar - Sidebar contextuelle pour les paramètres
 * Inspiré de systeme.io
 */

import { NavLink, useSearchParams } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { cn } from '@/lib/utils';
import {
  User,
  Building2,
  Globe,
  Bell,
  Palette,
  Download,
  Upload,
  Shield,
  Settings as SettingsIcon,
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
  debug: 'Debug',
};

export const SettingsSidebar = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Paramètres', path: '/dashboard/settings' },
    { label: tabToLabel[activeTab] || 'Paramètres' },
  ];

  return (
    <aside className="hidden lg:block fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] border-r bg-background overflow-y-auto z-40">
      <div className="p-4 space-y-4">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Navigation */}
        <nav className="space-y-1">
          {settingsNavItems.map((item) => {
            const Icon = item.icon;
            const itemTab = item.path.split('tab=')[1]?.split('&')[0];
            const isActive = activeTab === itemTab;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

