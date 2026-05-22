import { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { SkipToMainContent } from '@/components/accessibility/SkipToMainContent';
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

/**
 * Layout dashboard standard : sidebar principale + zone #main-content.
 * À utiliser pour toute page /dashboard/* sans layout dédié (ex. Studio IA, Assistant IA).
 */
export function DashboardShellLayout({
  children,
  className,
  maxWidth = 'default',
}: DashboardShellLayoutProps) {
  return (
    <SidebarProvider>
      <SkipToMainContent />
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main id="main-content" className="flex-1 overflow-auto" role="main" tabIndex={-1}>
          <div
            className={cn(
              'container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6',
              maxWidthClass[maxWidth],
              className
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
