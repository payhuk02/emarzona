/**
 * Emails Sidebar - Sidebar contextuelle pour la section Emails
 * Design professionnel et totalement responsive
 */

import { useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
import {
  Mail,
  Send,
  Workflow,
  Users,
  BarChart3,
  FileText,
  Tag,
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
    label: 'Tags',
    path: '/dashboard/emails/tags',
    icon: Tag,
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
const  pathToLabel: Record<string, string> = {
  campaigns: 'Campagnes',
  sequences: 'Séquences',
  segments: 'Segments',
  workflows: 'Workflows',
  tags: 'Tags',
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
    if (location.pathname.includes('/tags')) return 'tags';
    if (location.pathname.includes('/analytics')) return 'analytics';
    if (location.pathname.includes('/templates')) return 'templates';
    return 'campaigns';
  };

  const activeSection = getActiveSection();

  const  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Emails', path: '/dashboard/emails/campaigns' },
    { label: pathToLabel[activeSection] || 'Emails' },
  ];

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-1" aria-label="Navigation emails">
        {emailsNavItems.map((item) => {
          const isActive = location.pathname === item.path || 
                         (item.path !== '/dashboard/emails/campaigns' && location.pathname.startsWith(item.path));
          
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







