/**
 * Physical Portal Sidebar - Sidebar contextuelle pour le Portail Produits Physiques
 * Design professionnel et totalement responsive
 */

import { useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
import {
  ShoppingBag,
  Package,
  Warehouse,
  BarChart3,
  Hash,
} from 'lucide-react';

// Navigation du portail produits physiques
const physicalPortalNavItems = [
  {
    label: 'Portail Physique',
    path: '/account/physical',
    icon: ShoppingBag,
  },
  {
    label: 'Mes Commandes',
    path: '/account/orders',
    icon: Package,
  },
  {
    label: 'Inventaire',
    path: '/dashboard/physical-inventory',
    icon: Warehouse,
  },
  {
    label: 'Analytics',
    path: '/dashboard/physical-analytics',
    icon: BarChart3,
  },
  {
    label: 'Traçabilité',
    path: '/dashboard/physical-serial-tracking',
    icon: Hash,
  },
];

export const PhysicalPortalSidebar = () => {
  const location = useLocation();
  
  const getActiveSection = () => {
    if (location.pathname.includes('/orders')) return 'Mes Commandes';
    if (location.pathname.includes('/physical-inventory')) return 'Inventaire';
    if (location.pathname.includes('/physical-analytics')) return 'Analytics';
    if (location.pathname.includes('/physical-serial-tracking')) return 'Traçabilité';
    return 'Portail Physique';
  };

  const activeSection = getActiveSection();

  const  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Portail Physique', path: '/account/physical' },
    { label: activeSection },
  ];

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-1" aria-label="Navigation portail physique">
        {physicalPortalNavItems.map((item) => {
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







