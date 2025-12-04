/**
 * Digital Portal Sidebar - Sidebar contextuelle pour le Portail Digital
 * Design professionnel et totalement responsive
 */

import { useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
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
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-1" aria-label="Navigation portail digital">
        {digitalPortalNavItems.map((item) => {
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

