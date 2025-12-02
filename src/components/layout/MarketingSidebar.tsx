/**
 * Marketing Sidebar - Sidebar contextuelle pour Marketing & Croissance
 */

import { NavLink, useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { cn } from '@/lib/utils';
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

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Marketing & Croissance', path: '/dashboard/marketing' },
    { label: activeSection },
  ];

  return (
    <aside className="hidden md:block fixed left-0 top-16 w-56 md:w-64 h-[calc(100vh-4rem)] border-r border-blue-800/30 bg-gradient-to-br from-slate-900 via-blue-950 to-black overflow-y-auto z-40 transition-all duration-300 scrollbar-thin">
      <div className="p-3 sm:p-4 md:p-5 space-y-4 md:space-y-6">
        <Breadcrumb items={breadcrumbItems} />

        <nav className="space-y-6">
          {marketingNavGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-2">
              <h3 className="px-3 py-1.5 text-xs font-semibold text-blue-200/80 uppercase tracking-wider border-b border-blue-800/30">
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    location.pathname.startsWith(item.path);

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
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

