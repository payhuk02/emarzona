/**
 * Systems Sidebar - Sidebar contextuelle pour Systèmes & Intégrations
 */

import { NavLink, useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { cn } from '@/lib/utils';
import {
  Settings,
  Webhook,
  Star,
  Gift,
} from 'lucide-react';

const systemsNavItems = [
  {
    label: 'Intégrations',
    path: '/dashboard/integrations',
    icon: Settings,
  },
  {
    label: 'Webhooks',
    path: '/dashboard/webhooks',
    icon: Webhook,
  },
  {
    label: 'Webhooks Produits Digitaux',
    path: '/dashboard/digital-webhooks',
    icon: Webhook,
  },
  {
    label: 'Webhooks Produits Physiques',
    path: '/dashboard/physical-webhooks',
    icon: Webhook,
  },
  {
    label: 'Programme de Fidélité',
    path: '/dashboard/loyalty',
    icon: Star,
  },
  {
    label: 'Cartes Cadeaux',
    path: '/dashboard/gift-cards',
    icon: Gift,
  },
];

const systemsNavGroups = [
  {
    label: 'Intégrations',
    items: systemsNavItems.slice(0, 1),
  },
  {
    label: 'Webhooks',
    items: systemsNavItems.slice(1, 4),
  },
  {
    label: 'Programmes',
    items: systemsNavItems.slice(4),
  },
];

export const SystemsSidebar = () => {
  const location = useLocation();

  const getActiveSection = () => {
    const activeItem = systemsNavItems.find(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(item.path)
    );
    return activeItem?.label || 'Systèmes & Intégrations';
  };

  const activeSection = getActiveSection();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Systèmes & Intégrations', path: '/dashboard/integrations' },
    { label: activeSection },
  ];

  return (
    <aside className="hidden md:block fixed left-0 top-16 w-56 md:w-64 h-[calc(100vh-4rem)] border-r border-blue-800/30 bg-gradient-to-br from-slate-900 via-blue-950 to-black overflow-y-auto z-40 transition-all duration-300 scrollbar-thin">
      <div className="p-3 sm:p-4 md:p-5 space-y-4 md:space-y-6">
        <Breadcrumb items={breadcrumbItems} />

        <nav className="space-y-6">
          {systemsNavGroups.map((group, groupIndex) => (
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

