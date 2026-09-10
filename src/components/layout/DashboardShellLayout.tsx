/**
 * Layout dashboard standard : zone contenu avec padding.
 * Le chrome (sidebar / utility bar) est fourni par AuthenticatedAppLayout.
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardShellLayoutProps {
  children: ReactNode;
  /** Classes additionnelles sur le conteneur interne */
  className?: string;
  /** largeur max du contenu (défaut: pleine largeur avec padding dashboard) */
  maxWidth?: 'default' | 'wide' | 'full';
}

const maxWidthClass = {
  default: 'max-w-7xl',
  wide: 'max-w-[90rem]',
  full: 'max-w-none',
};

export function DashboardShellLayout({
  children,
  className,
  maxWidth = 'default',
}: DashboardShellLayoutProps) {
  return (
    <div
      className={cn(
        'container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6',
        maxWidthClass[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}
