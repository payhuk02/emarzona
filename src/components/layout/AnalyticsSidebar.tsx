/**
 * Analytics Sidebar - Sidebar contextuelle pour Analytics & SEO
 * Design professionnel et totalement responsive
 */

import { useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
import {
  BarChart3,
  Target,
  Search,
} from 'lucide-react';

const analyticsNavItems = [
  {
    label: 'Statistiques',
    path: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    label: 'Mes Pixels',
    path: '/dashboard/pixels',
    icon: Target,
  },
  {
    label: 'Mon SEO',
    path: '/dashboard/seo',
    icon: Search,
  },
];

export const AnalyticsSidebar = () => {
  const location = useLocation();

  const getActiveSection = () => {
    const activeItem = analyticsNavItems.find(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(item.path)
    );
    return activeItem?.label || 'Analytics & SEO';
  };

  const activeSection = getActiveSection();

  const  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Analytics & SEO', path: '/dashboard/analytics' },
    { label: activeSection },
  ];

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-1" aria-label="Navigation analytics">
        {analyticsNavItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path);

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






