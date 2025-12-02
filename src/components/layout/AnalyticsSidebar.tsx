/**
 * Analytics Sidebar - Sidebar contextuelle pour la section Analytics
 */

import { NavLink, useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Target,
  Search,
  TrendingUp,
} from 'lucide-react';

// Navigation des analytics
const analyticsNavItems = [
  {
    label: 'Statistiques',
    path: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    label: 'Pixels',
    path: '/dashboard/pixels',
    icon: Target,
  },
  {
    label: 'SEO',
    path: '/dashboard/seo',
    icon: Search,
  },
];

export const AnalyticsSidebar = () => {
  const location = useLocation();
  
  const getActiveSection = () => {
    if (location.pathname.includes('/pixels')) return 'Pixels';
    if (location.pathname.includes('/seo')) return 'SEO';
    if (location.pathname.includes('/performance')) return 'Performance';
    return 'Analytics';
  };

  const activeSection = getActiveSection();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Analytics', path: '/dashboard/analytics' },
    { label: activeSection },
  ];

  return (
    <aside className="hidden lg:block fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] border-r bg-background overflow-y-auto z-40">
      <div className="p-4 space-y-4">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Navigation */}
        <nav className="space-y-1">
          {analyticsNavItems.map((item) => {
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

