/**
 * Customers Sidebar - Sidebar contextuelle pour la section Clients
 * Design professionnel et totalement responsive
 */

import { useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
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

  const  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Clients', path: '/dashboard/customers' },
    { label: activeSection },
  ];

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-1" aria-label="Navigation clients">
        {customersNavItems.map((item) => {
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







