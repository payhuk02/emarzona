/**
 * Promotions Sidebar - Sidebar contextuelle pour la section Promotions
 * Design professionnel et totalement responsive
 */

import { useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
import { Tag, Percent, TrendingUp } from 'lucide-react';

// Navigation des promotions
const promotionsNavItems = [
  {
    label: 'Toutes les Promotions',
    path: '/dashboard/promotions',
    icon: Tag,
  },
  {
    label: 'Codes Promo',
    path: '/dashboard/coupons',
    icon: Percent,
  },
  {
    label: 'Statistiques',
    path: '/dashboard/promotions/stats',
    icon: TrendingUp,
  },
];

export const PromotionsSidebar = () => {
  const location = useLocation();

  const getActiveSection = () => {
    if (location.pathname.includes('/dashboard/coupons')) return 'Codes Promo';
    if (location.pathname.includes('/dashboard/promotions/stats')) return 'Statistiques';
    return 'Promotions';
  };

  const activeSection = getActiveSection();

  const  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Promotions', path: '/dashboard/promotions' },
    { label: activeSection },
  ];

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-1" aria-label="Navigation promotions">
        {promotionsNavItems.map(item => {
          const isActive =
            location.pathname === item.path || location.pathname.startsWith(item.path + '/');

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






