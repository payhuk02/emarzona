/**
 * AppPageShell — shell dashboard unifié (Sprint 3)
 * AppSidebar + sidebar contextuelle optionnelle + UtilityBar + #main-content
 */

import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { UtilityBarHeader } from '@/components/layout/UtilityBarHeader';
import { ConfigContextSidebar } from '@/components/layout/SectionContextSidebar';
import { getContextSidebarConfigId } from '@/config/contextSidebar.registry';
import { detectLayoutType } from '@/config/layoutTypeDetection';
import type { LayoutType } from '@/components/layout/layout.types';
import { cn } from '@/lib/utils';

export type AppPageShellProps = {
  children: ReactNode;
  /** Override auto-detected layout type from pathname */
  layoutType?: LayoutType;
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
  layoutType,
  shellClassName,
  className,
  mainClassName,
  showUtilityBar = true,
}: AppPageShellProps) {
  const location = useLocation();
  const detectedType = layoutType ?? detectLayoutType(location.pathname);
  const contextConfigId = getContextSidebarConfigId(detectedType);
  const hasContextSidebar = Boolean(contextConfigId);

  return (
    <SidebarProvider>
      <div
        className={cn('flex min-h-screen w-full bg-background overflow-x-hidden', shellClassName)}
      >
        <AppSidebar />
        {contextConfigId && <ConfigContextSidebar configId={contextConfigId} />}
        <div
          className={cn(
            'flex flex-1 flex-col min-w-0 min-h-screen',
            hasContextSidebar && 'pb-16 md:pb-0',
            className
          )}
        >
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
