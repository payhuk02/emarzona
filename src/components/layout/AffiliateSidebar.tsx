/**
 * Affiliate Sidebar - Sidebar contextuelle pour la section Tableau de bord Affilié
 * Design professionnel et totalement responsive
 */

import { useLocation } from 'react-router-dom';
import { BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
import { TrendingUp, GraduationCap, Users } from 'lucide-react';

// Navigation de l'affiliation
const affiliateNavItems = [
  {
    label: 'Tableau de bord',
    path: '/affiliate/dashboard',
    icon: TrendingUp,
  },
  {
    label: 'Cours Promus',
    path: '/affiliate/courses',
    icon: GraduationCap,
  },
  {
    label: 'Programme d’Affiliation',
    path: '/dashboard/affiliates',
    icon: Users,
  },
  {
    label: 'Parrainages',
    path: '/dashboard/referrals',
    icon: Users,
  },
];

export const AffiliateSidebar = () => {
  const location = useLocation();

  const getActiveSection = () => {
    if (location.pathname.includes('/courses')) return 'Cours Promus';
    if (location.pathname.includes('/affiliates')) return 'Programme d’Affiliation';
    if (location.pathname.includes('/referrals')) return 'Parrainages';
    return 'Tableau de bord';
  };

  const activeSection = getActiveSection();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Affiliation', path: '/affiliate/dashboard' },
    { label: activeSection },
  ];

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-1" aria-label="Navigation affiliation">
        {affiliateNavItems.map(item => {
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
