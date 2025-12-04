/**
 * Bookings Sidebar - Sidebar contextuelle pour la section Réservations & Services
 * Design professionnel et totalement responsive
 */

import { useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
import {
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  Settings,
} from 'lucide-react';

// Navigation des réservations
const bookingsNavItems = [
  {
    label: 'Réservations',
    path: '/dashboard/bookings',
    icon: Calendar,
  },
  {
    label: 'Calendrier Avancé',
    path: '/dashboard/advanced-calendar',
    icon: Calendar,
  },
  {
    label: 'Gestion des Services',
    path: '/dashboard/service-management',
    icon: Settings,
  },
  {
    label: 'Réservations Récurrentes',
    path: '/dashboard/recurring-bookings',
    icon: Clock,
  },
  {
    label: 'Calendrier Staff',
    path: '/dashboard/services/staff-availability',
    icon: Users,
  },
  {
    label: 'Conflits Ressources',
    path: '/dashboard/services/resource-conflicts',
    icon: AlertTriangle,
  },
];

export const BookingsSidebar = () => {
  const location = useLocation();
  
  const getActiveSection = () => {
    if (location.pathname.includes('/advanced-calendar')) return 'Calendrier Avancé';
    if (location.pathname.includes('/service-management')) return 'Gestion des Services';
    if (location.pathname.includes('/recurring-bookings')) return 'Réservations Récurrentes';
    if (location.pathname.includes('/staff-availability')) return 'Calendrier Staff';
    if (location.pathname.includes('/resource-conflicts')) return 'Conflits Ressources';
    return 'Réservations';
  };

  const activeSection = getActiveSection();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Réservations', path: '/dashboard/bookings' },
    { label: activeSection },
  ];

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-1" aria-label="Navigation réservations">
        {bookingsNavItems.map((item) => {
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

