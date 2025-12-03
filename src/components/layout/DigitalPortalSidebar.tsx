/**
 * Digital Portal Sidebar - Sidebar contextuelle pour le Portail Digital
 */

import { NavLink, useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { cn } from '@/lib/utils';
import {
  Package,
  Download,
  Key,
  BarChart3,
  Sparkles,
} from 'lucide-react';

// Navigation du portail digital
const digitalPortalNavItems = [
  {
    label: 'Portail Digital',
    path: '/account/digital',
    icon: Package,
  },
  {
    label: 'Mes Téléchargements',
    path: '/account/downloads',
    icon: Download,
  },
  {
    label: 'Mes Licences',
    path: '/dashboard/my-licenses',
    icon: Key,
  },
  {
    label: 'Analytics',
    path: '/account/digital/analytics',
    icon: BarChart3,
  },
  {
    label: 'Mises à jour',
    path: '/dashboard/digital/updates',
    icon: Sparkles,
  },
];

export const DigitalPortalSidebar = () => {
  const location = useLocation();
  
  const getActiveSection = () => {
    if (location.pathname.includes('/downloads')) return 'Mes Téléchargements';
    if (location.pathname.includes('/my-licenses')) return 'Mes Licences';
    if (location.pathname.includes('/analytics')) return 'Analytics';
    if (location.pathname.includes('/updates')) return 'Mises à jour';
    return 'Portail Digital';
  };

  const activeSection = getActiveSection();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Portail Digital', path: '/account/digital' },
    { label: activeSection },
  ];

  return (
    <aside className="hidden md:block fixed left-0 top-16 w-56 md:w-64 h-[calc(100vh-4rem)] border-r border-blue-800/30 bg-gradient-to-br from-slate-900 via-blue-950 to-black overflow-y-auto z-40 transition-all duration-300 scrollbar-thin">
      <div className="p-3 sm:p-4 md:p-5 space-y-4">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Navigation */}
        <nav className="space-y-1">
          {digitalPortalNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           location.pathname.startsWith(item.path + '/');
            
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

