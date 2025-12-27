/**
 * Inventory Sidebar - Sidebar contextuelle pour la section Inventaire
 * Design professionnel et totalement responsive
 */

import { useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
import {
  Warehouse,
  Package,
  Hash,
  Camera,
  TrendingUp,
  Boxes,
} from 'lucide-react';

// Navigation de l'inventaire
const inventoryNavItems = [
  {
    label: 'Inventaire Principal',
    path: '/dashboard/inventory',
    icon: Warehouse,
  },
  {
    label: 'Stocks Produits Physiques',
    path: '/dashboard/physical-inventory',
    icon: Package,
  },
  {
    label: 'Lots & Expiration',
    path: '/dashboard/physical-lots',
    icon: Boxes,
  },
  {
    label: 'Numéros de Série',
    path: '/dashboard/physical-serial-tracking',
    icon: Hash,
  },
  {
    label: 'Scanner Codes-barres',
    path: '/dashboard/physical-barcode-scanner',
    icon: Camera,
  },
  {
    label: 'Précommandes',
    path: '/dashboard/physical-preorders',
    icon: TrendingUp,
  },
  {
    label: 'Backorders',
    path: '/dashboard/physical-backorders',
    icon: Package,
  },
];

export const InventorySidebar = () => {
  const location = useLocation();
  
  const getActiveSection = () => {
    if (location.pathname.includes('/physical-inventory')) return 'Stocks Produits Physiques';
    if (location.pathname.includes('/physical-lots')) return 'Lots & Expiration';
    if (location.pathname.includes('/physical-serial-tracking')) return 'Numéros de Série';
    if (location.pathname.includes('/physical-barcode-scanner')) return 'Scanner Codes-barres';
    if (location.pathname.includes('/physical-preorders')) return 'Précommandes';
    if (location.pathname.includes('/physical-backorders')) return 'Backorders';
    return 'Inventaire';
  };

  const activeSection = getActiveSection();

  const  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Inventaire', path: '/dashboard/inventory' },
    { label: activeSection },
  ];

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-1" aria-label="Navigation inventaire">
        {inventoryNavItems.map((item) => {
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







