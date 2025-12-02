/**
 * Orders Sidebar - Sidebar contextuelle pour la section Commandes
 */

import { NavLink, useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { cn } from '@/lib/utils';
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
    <aside className="hidden lg:block fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] border-r bg-background overflow-y-auto z-40">
      <div className="p-4 space-y-4">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Navigation */}
        <nav className="space-y-1">
          {ordersNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           location.pathname.startsWith(item.path + '/');
            
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

