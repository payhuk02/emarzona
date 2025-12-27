/**
 * Courses Sidebar - Sidebar contextuelle pour la section Cours
 * Design professionnel et totalement responsive
 */

import { useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
import {
  GraduationCap,
  Plus,
  BookOpen,
  BarChart3,
} from 'lucide-react';

// Navigation des cours
const coursesNavItems = [
  {
    label: 'Mes Cours',
    path: '/account/courses',
    icon: BookOpen,
  },
  {
    label: 'Créer un Cours',
    path: '/dashboard/courses/new',
    icon: Plus,
  },
  {
    label: 'Gestion Cours',
    path: '/dashboard/my-courses',
    icon: GraduationCap,
  },
  {
    label: 'Analytics Cours',
    path: '/dashboard/courses/analytics',
    icon: BarChart3,
  },
];

export const CoursesSidebar = () => {
  const location = useLocation();
  
  const getActiveSection = () => {
    if (location.pathname.includes('/courses/new')) return 'Créer un Cours';
    if (location.pathname.includes('/my-courses')) return 'Gestion Cours';
    if (location.pathname.includes('/courses/analytics')) return 'Analytics Cours';
    return 'Mes Cours';
  };

  const activeSection = getActiveSection();

  const  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Cours', path: '/account/courses' },
    { label: activeSection },
  ];

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-1" aria-label="Navigation cours">
        {coursesNavItems.map((item) => {
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







