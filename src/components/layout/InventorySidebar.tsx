/**
 * Inventory Sidebar - Sidebar contextuelle pour la section Inventaire
 */

import { NavLink, useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { cn } from '@/lib/utils';
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

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Inventaire', path: '/dashboard/inventory' },
    { label: activeSection },
  ];

  return (
    <aside className="hidden md:block fixed left-0 top-16 w-56 md:w-64 h-[calc(100vh-4rem)] border-r border-blue-800/30 bg-gradient-to-br from-slate-900 via-blue-950 to-black overflow-y-auto z-40 transition-all duration-300 scrollbar-thin">
      <div className="p-3 sm:p-4 md:p-5 space-y-4">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Navigation */}
        <nav className="space-y-1">
          {inventoryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           location.pathname.startsWith(item.path + '/');
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-blue-600/30 text-blue-200 shadow-sm'
                    : 'text-slate-300 hover:bg-blue-900/30 hover:text-white hover:translate-x-1'
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

