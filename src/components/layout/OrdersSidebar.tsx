/**
 * Orders Sidebar - Sidebar contextuelle pour la section Commandes
 * Design professionnel et totalement responsive
 */

import { useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
import {
  ShoppingCart,
  MessageSquare,
  RotateCcw,
  Truck,
  DollarSign,
} from 'lucide-react';

// Navigation des commandes
const ordersNavItems = [
  {
    label: 'Toutes les commandes',
    path: '/dashboard/orders',
    icon: ShoppingCart,
  },
  {
    label: 'Commandes avancées',
    path: '/dashboard/advanced-orders',
    icon: ShoppingCart,
  },
  {
    label: 'Messages clients',
    path: '/vendor/messaging',
    icon: MessageSquare,
  },
  {
    label: 'Retours',
    path: '/admin/returns',
    icon: RotateCcw,
  },
  {
    label: 'Expéditions',
    path: '/dashboard/shipping',
    icon: Truck,
  },
  {
    label: 'Paiements',
    path: '/dashboard/payments',
    icon: DollarSign,
  },
];

export const OrdersSidebar = () => {
  const location = useLocation();
  
  const getActiveSection = () => {
    if (location.pathname.includes('/advanced-orders')) return 'Commandes avancées';
    if (location.pathname.includes('/messaging')) return 'Messages';
    if (location.pathname.includes('/returns')) return 'Retours';
    if (location.pathname.includes('/shipping')) return 'Expéditions';
    if (location.pathname.includes('/payments')) return 'Paiements';
    return 'Commandes';
  };

  const activeSection = getActiveSection();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Commandes', path: '/dashboard/orders' },
    { label: activeSection },
  ];

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-1" aria-label="Navigation des commandes">
        {ordersNavItems.map((item) => {
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

