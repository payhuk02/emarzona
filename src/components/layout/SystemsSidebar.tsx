/**
 * Systems Sidebar - Sidebar contextuelle pour Systèmes & Intégrations
 * Design professionnel et totalement responsive
 */

import { useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
import {
  Settings,
  Webhook,
  Star,
  Gift,
} from 'lucide-react';

const systemsNavItems = [
  {
    label: 'Intégrations',
    path: '/dashboard/integrations',
    icon: Settings,
  },
  {
    label: 'Webhooks',
    path: '/dashboard/webhooks',
    icon: Webhook,
    // Système unifié pour tous les types de webhooks (digitaux, physiques, services, etc.)
  },
  {
    label: 'Programme de Fidélité',
    path: '/dashboard/loyalty',
    icon: Star,
  },
  {
    label: 'Cartes Cadeaux',
    path: '/dashboard/gift-cards',
    icon: Gift,
  },
];

const systemsNavGroups = [
  {
    label: 'Intégrations',
    items: systemsNavItems.slice(0, 1),
  },
  {
    label: 'Webhooks',
    items: systemsNavItems.slice(1, 2),
  },
  {
    label: 'Programmes',
    items: systemsNavItems.slice(2),
  },
];

export const SystemsSidebar = () => {
  const location = useLocation();

  const getActiveSection = () => {
    const activeItem = systemsNavItems.find(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(item.path)
    );
    return activeItem?.label || 'Systèmes & Intégrations';
  };

  const activeSection = getActiveSection();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Systèmes & Intégrations', path: '/dashboard/integrations' },
    { label: activeSection },
  ];

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-4 md:space-y-6" aria-label="Navigation systèmes">
        {systemsNavGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-2">
            <h3 className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-200/80 uppercase tracking-wider border-b border-blue-800/30">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  location.pathname.startsWith(item.path);

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
            </div>
          </div>
        ))}
      </nav>
    </BaseContextSidebar>
  );
};

