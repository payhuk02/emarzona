/**
 * Emails Sidebar - Sidebar contextuelle pour la section Emails
 * Inspiré de systeme.io
 */

import { NavLink, useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { cn } from '@/lib/utils';
import {
  Mail,
  Send,
  Workflow,
  Users,
  BarChart3,
  FileText,
} from 'lucide-react';

// Navigation des emails
const emailsNavItems = [
  {
    label: 'Campagnes',
    path: '/dashboard/emails/campaigns',
    icon: Send,
  },
  {
    label: 'Séquences',
    path: '/dashboard/emails/sequences',
    icon: Mail,
  },
  {
    label: 'Segments',
    path: '/dashboard/emails/segments',
    icon: Users,
  },
  {
    label: 'Workflows',
    path: '/dashboard/emails/workflows',
    icon: Workflow,
  },
  {
    label: 'Analytics',
    path: '/dashboard/emails/analytics',
    icon: BarChart3,
  },
  {
    label: 'Templates',
    path: '/dashboard/emails/templates/editor',
    icon: FileText,
  },
];

// Mapping des paths vers les labels
const pathToLabel: Record<string, string> = {
  campaigns: 'Campagnes',
  sequences: 'Séquences',
  segments: 'Segments',
  workflows: 'Workflows',
  analytics: 'Analytics',
  templates: 'Templates',
};

export const EmailsSidebar = () => {
  const location = useLocation();
  
  // Extraire la section active depuis le path
  const getActiveSection = () => {
    if (location.pathname.includes('/campaigns')) return 'campaigns';
    if (location.pathname.includes('/sequences')) return 'sequences';
    if (location.pathname.includes('/segments')) return 'segments';
    if (location.pathname.includes('/workflows')) return 'workflows';
    if (location.pathname.includes('/analytics')) return 'analytics';
    if (location.pathname.includes('/templates')) return 'templates';
    return 'campaigns';
  };

  const activeSection = getActiveSection();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Emails', path: '/dashboard/emails/campaigns' },
    { label: pathToLabel[activeSection] || 'Emails' },
  ];

  return (
    <aside className="hidden md:block fixed left-0 top-16 w-56 md:w-64 h-[calc(100vh-4rem)] border-r border-blue-800/30 bg-gradient-to-br from-slate-900 via-blue-950 to-black overflow-y-auto z-40 transition-all duration-300 scrollbar-thin">
      <div className="p-3 sm:p-4 md:p-5 space-y-4">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Navigation */}
        <nav className="space-y-1">
          {emailsNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           (item.path !== '/dashboard/emails/campaigns' && location.pathname.startsWith(item.path));
            
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

