/**
 * Store Sidebar - Sidebar contextuelle pour la section Boutique
 * Design professionnel et totalement responsive
 */

import { useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
import {
  Store,
  Users,
  Settings,
} from 'lucide-react';

// Navigation de la boutique
const storeNavItems = [
  {
    label: 'Ma Boutique',
    path: '/dashboard/store',
    icon: Store,
  },
  {
    label: 'Équipe',
    path: '/dashboard/store/team',
    icon: Users,
  },
  {
    label: 'Paramètres Boutique',
    path: '/dashboard/store/settings',
    icon: Settings,
  },
];

export const StoreSidebar = () => {
  const location = useLocation();
  
  const getActiveSection = () => {
    if (location.pathname.includes('/team')) return 'Équipe';
    if (location.pathname.includes('/settings')) return 'Paramètres';
    return 'Boutique';
  };

  const activeSection = getActiveSection();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Boutique', path: '/dashboard/store' },
    { label: activeSection },
  ];

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-1" aria-label="Navigation boutique">
        {storeNavItems.map((item) => {
          const isActive = location.pathname === item.path || 
                         location.pathname.startsWith(item.path + '/');
          
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

