/**
 * Responsive Container - Phase 2 UX
 * Container optimisé pour toutes les tailles d'écran
 */

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  fluid?: boolean;
}

/**
 * Container responsive avec padding et max-width adaptatifs
 */
export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md',
  fluid = false,
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 sm:px-6',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-4 sm:px-6 lg:px-8 xl:px-12',
  };

  return (
    <div
      className={cn(
        'w-full mx-auto',
        !fluid && maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Container pour le contenu principal avec skip link target
 */
export function MainContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main
      id="main-content"
      className={cn('min-h-screen', className)}
      role="main"
      aria-label="Contenu principal"
    >
      {children}
    </main>
  );
}

/**
 * Section responsive avec espacement adaptatif
 */
export function ResponsiveSection({
  children,
  className,
  spacing = 'md',
}: {
  children: ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const spacingClasses = {
    sm: 'py-4 sm:py-6',
    md: 'py-6 sm:py-8 lg:py-12',
    lg: 'py-8 sm:py-12 lg:py-16',
    xl: 'py-12 sm:py-16 lg:py-24',
  };

  return (
    <section className={cn(spacingClasses[spacing], className)}>
      {children}
    </section>
  );
}



