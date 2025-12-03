/**
 * Shipping Sidebar - Sidebar contextuelle pour la section Expéditions
 */

import { NavLink, useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { cn } from '@/lib/utils';
import {
  Truck,
  Settings,
  Phone,
  PackageSearch,
} from 'lucide-react';

// Navigation des expéditions
const shippingNavItems = [
  {
    label: 'Expéditions',
    path: '/dashboard/shipping',
    icon: Truck,
  },
  {
    label: 'Services de Livraison',
    path: '/dashboard/shipping-services',
    icon: Settings,
  },
  {
    label: 'Contacter un Service',
    path: '/dashboard/contact-shipping-service',
    icon: Phone,
  },
  {
    label: 'Expéditions Batch',
    path: '/dashboard/batch-shipping',
    icon: PackageSearch,
  },
];

export const ShippingSidebar = () => {
  const location = useLocation();
  
  const getActiveSection = () => {
    if (location.pathname.includes('/shipping-services')) return 'Services de Livraison';
    if (location.pathname.includes('/contact-shipping-service')) return 'Contacter un Service';
    if (location.pathname.includes('/batch-shipping')) return 'Expéditions Batch';
    return 'Expéditions';
  };

  const activeSection = getActiveSection();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Expéditions', path: '/dashboard/shipping' },
    { label: activeSection },
  ];

  return (
    <aside className="hidden md:block fixed left-0 top-16 w-56 md:w-64 h-[calc(100vh-4rem)] border-r border-blue-800/30 bg-gradient-to-br from-slate-900 via-blue-950 to-black overflow-y-auto z-40 transition-all duration-300 scrollbar-thin">
      <div className="p-3 sm:p-4 md:p-5 space-y-4">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Navigation */}
        <nav className="space-y-1">
          {shippingNavItems.map((item) => {
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

