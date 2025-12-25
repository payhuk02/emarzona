/**
 * Finance Sidebar - Sidebar contextuelle pour Finance & Paiements
 * Design professionnel et totalement responsive
 */

import { useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
import {
  CreditCard,
  DollarSign,
  FileText,
} from 'lucide-react';

const financeNavItems = [
  {
    label: 'Paiements',
    path: '/dashboard/payments',
    icon: CreditCard,
  },
  {
    label: 'Solde à Payer',
    path: '/dashboard/pay-balance',
    icon: DollarSign,
  },
  {
    label: 'Gestion Paiements',
    path: '/dashboard/payment-management',
    icon: FileText,
  },
];

export const FinanceSidebar = () => {
  const location = useLocation();

  const getActiveSection = () => {
    const activeItem = financeNavItems.find(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(item.path)
    );
    return activeItem?.label || 'Finance & Paiements';
  };

  const activeSection = getActiveSection();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Finance & Paiements', path: '/dashboard/payments' },
    { label: activeSection },
  ];

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-1" aria-label="Navigation finance">
        {financeNavItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path);

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

