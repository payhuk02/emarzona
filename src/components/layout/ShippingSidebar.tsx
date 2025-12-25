/**
 * Shipping Sidebar - Sidebar contextuelle pour la section Expéditions
 * Design professionnel et totalement responsive
 */

import { useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
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
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-1" aria-label="Navigation expéditions">
        {shippingNavItems.map((item) => {
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

