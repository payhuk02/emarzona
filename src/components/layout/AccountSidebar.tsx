/**
 * Account Sidebar - Sidebar contextuelle pour le portail client
 */

import { NavLink, useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { cn } from '@/lib/utils';
import {
  User,
  ShoppingCart,
  Download,
  Package,
  ShoppingBag,
  GraduationCap,
  Heart,
  Bell,
  Receipt,
  RotateCcw,
  Gift,
  Trophy,
} from 'lucide-react';

// Navigation du portail client
const accountNavItems = [
  {
    label: 'Mon profil',
    path: '/account/profile',
    icon: User,
  },
  {
    label: 'Mes commandes',
    path: '/account/orders',
    icon: ShoppingCart,
  },
  {
    label: 'Mes téléchargements',
    path: '/account/downloads',
    icon: Download,
  },
  {
    label: 'Portail digital',
    path: '/account/digital',
    icon: Package,
  },
  {
    label: 'Portail physique',
    path: '/account/physical',
    icon: ShoppingBag,
  },
  {
    label: 'Mes cours',
    path: '/account/courses',
    icon: GraduationCap,
  },
  {
    label: 'Liste de souhaits',
    path: '/account/wishlist',
    icon: Heart,
  },
  {
    label: 'Mes alertes',
    path: '/account/alerts',
    icon: Bell,
  },
  {
    label: 'Mes factures',
    path: '/account/invoices',
    icon: Receipt,
  },
  {
    label: 'Mes retours',
    path: '/account/returns',
    icon: RotateCcw,
  },
  {
    label: 'Cartes cadeaux',
    path: '/account/gift-cards',
    icon: Gift,
  },
  {
    label: 'Gamification',
    path: '/dashboard/gamification',
    icon: Trophy,
  },
];

export const AccountSidebar = () => {
  const location = useLocation();
  
  const getActiveSection = () => {
    if (location.pathname.includes('/orders')) return 'Commandes';
    if (location.pathname.includes('/downloads')) return 'Téléchargements';
    if (location.pathname.includes('/digital')) return 'Portail digital';
    if (location.pathname.includes('/physical')) return 'Portail physique';
    if (location.pathname.includes('/courses')) return 'Cours';
    if (location.pathname.includes('/wishlist')) return 'Liste de souhaits';
    if (location.pathname.includes('/alerts')) return 'Alertes';
    if (location.pathname.includes('/invoices')) return 'Factures';
    if (location.pathname.includes('/returns')) return 'Retours';
    if (location.pathname.includes('/gift-cards')) return 'Cartes cadeaux';
    if (location.pathname.includes('/gamification')) return 'Gamification';
    return 'Mon compte';
  };

  const activeSection = getActiveSection();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Mon compte', path: '/account' },
    { label: activeSection },
  ];

  return (
    <aside className="hidden md:block fixed left-0 top-16 w-56 md:w-64 h-[calc(100vh-4rem)] border-r border-blue-800/30 bg-gradient-to-br from-slate-900 via-blue-950 to-black overflow-y-auto z-40 transition-all duration-300 scrollbar-thin">
      <div className="p-3 sm:p-4 md:p-5 space-y-4">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Navigation */}
        <nav className="space-y-1">
          {accountNavItems.map((item) => {
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

