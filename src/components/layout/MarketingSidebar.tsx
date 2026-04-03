/**
 * Marketing Sidebar - Sidebar contextuelle pour Marketing & Croissance
 * Design professionnel et totalement responsive
 */

import { useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
import {
  Users,
  Tag,
  Mail,
  UserPlus,
  TrendingUp,
  GraduationCap,
} from 'lucide-react';

const marketingNavItems = [
  {
    label: 'Clients',
    path: '/dashboard/customers',
    icon: Users,
  },
  {
    label: 'Promotions',
    path: '/dashboard/promotions',
    icon: Tag,
  },
  {
    label: 'Campagnes Email',
    path: '/dashboard/emails/campaigns',
    icon: Mail,
  },
  {
    label: 'Séquences Email',
    path: '/dashboard/emails/sequences',
    icon: Mail,
  },
  {
    label: 'Segments d\'Audience',
    path: '/dashboard/emails/segments',
    icon: Users,
  },
  {
    label: 'Analytics Email',
    path: '/dashboard/emails/analytics',
    icon: TrendingUp,
  },
  {
    label: 'Workflows Email',
    path: '/dashboard/emails/workflows',
    icon: Mail,
  },
  {
    label: 'Éditeur Templates',
    path: '/dashboard/emails/templates/editor',
    icon: Mail,
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
    label: 'Cours Promus',
    path: '/affiliate/courses',
    icon: GraduationCap,
  },
];

const marketingNavGroups = [
  {
    label: 'Clients & Promotions',
    items: marketingNavItems.slice(0, 2),
  },
  {
    label: 'Email Marketing',
    items: marketingNavItems.slice(2, 8),
  },
  {
    label: 'Croissance',
    items: marketingNavItems.slice(8),
  },
];

export const MarketingSidebar = () => {
  const location = useLocation();

  const getActiveSection = () => {
    const activeItem = marketingNavItems.find(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(item.path)
    );
    return activeItem?.label || 'Marketing & Croissance';
  };

  const activeSection = getActiveSection();

  const  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Marketing & Croissance', path: '/dashboard/marketing' },
    { label: activeSection },
  ];

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-4 md:space-y-6" aria-label="Navigation marketing">
        {marketingNavGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-2">
            <h3 className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-200/80 uppercase tracking-wider border-b border-blue-800/30">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
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
            </div>
          </div>
        ))}
      </nav>
    </BaseContextSidebar>
  );
};







