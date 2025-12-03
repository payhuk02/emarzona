/**
 * Bookings Sidebar - Sidebar contextuelle pour la section Réservations & Services
 */

import { NavLink, useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { cn } from '@/lib/utils';
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
    <aside className="hidden md:block fixed left-0 top-16 w-56 md:w-64 h-[calc(100vh-4rem)] border-r border-blue-800/30 bg-gradient-to-br from-slate-900 via-blue-950 to-black overflow-y-auto z-40 transition-all duration-300 scrollbar-thin">
      <div className="p-3 sm:p-4 md:p-5 space-y-4">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Navigation */}
        <nav className="space-y-1">
          {bookingsNavItems.map((item) => {
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

