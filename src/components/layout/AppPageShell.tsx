/**
 * AppPageShell — shell unifié sidebar + barre utilitaire + zone contenu (P0)
 */

import { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { UtilityBarHeader } from '@/components/layout/UtilityBarHeader';
import { cn } from '@/lib/utils';

export type AppPageShellProps = {
  children: ReactNode;
  /** Classes on outer flex row (sidebar + content) */
  shellClassName?: string;
  /** Classes on content column wrapper */
  className?: string;
  /** Classes on <main id="main-content"> */
  mainClassName?: string;
  showUtilityBar?: boolean;
};

export function AppPageShell({
  children,
  shellClassName,
  className,
  mainClassName,
  showUtilityBar = true,
}: AppPageShellProps) {
  return (
    <SidebarProvider>
      <div
        className={cn('flex min-h-screen w-full bg-background overflow-x-hidden', shellClassName)}
      >
        <AppSidebar />
        <div className={cn('flex flex-1 flex-col min-w-0 min-h-screen', className)}>
          {showUtilityBar && <UtilityBarHeader />}
          <main
            id="main-content"
            role="main"
            tabIndex={-1}
            aria-label="Contenu principal"
            className={cn('flex-1 overflow-auto', mainClassName)}
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
