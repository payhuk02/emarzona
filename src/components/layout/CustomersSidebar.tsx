/**
 * Customers Sidebar - Sidebar contextuelle pour la section Clients
 */

import { NavLink, useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { cn } from '@/lib/utils';
import {
  Users,
  UserPlus,
  TrendingUp,
  Heart,
  Bell,
} from 'lucide-react';

// Navigation des clients
const customersNavItems = [
  {
    label: 'Tous les clients',
    path: '/dashboard/customers',
    icon: Users,
  },
  {
    label: 'Parrainage',
    path: '/dashboard/referrals',
    icon: UserPlus,
  },
  {
    label: 'Affiliation',
    path: '/dashboard/affiliates',
    icon: TrendingUp,
  },
  {
    label: 'Liste de souhaits',
    path: '/account/wishlist',
    icon: Heart,
  },
  {
    label: 'Alertes',
    path: '/account/alerts',
    icon: Bell,
  },
];

export const CustomersSidebar = () => {
  const location = useLocation();
  
  const getActiveSection = () => {
    if (location.pathname.includes('/referrals')) return 'Parrainage';
    if (location.pathname.includes('/affiliates')) return 'Affiliation';
    if (location.pathname.includes('/wishlist')) return 'Liste de souhaits';
    if (location.pathname.includes('/alerts')) return 'Alertes';
    return 'Clients';
  };

  const activeSection = getActiveSection();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Clients', path: '/dashboard/customers' },
    { label: activeSection },
  ];

  return (
    <aside className="hidden lg:block fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] border-r bg-background overflow-y-auto z-40">
      <div className="p-4 space-y-4">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Navigation */}
        <nav className="space-y-1">
          {customersNavItems.map((item) => {
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

