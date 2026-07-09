/**
 * Coque layout publique marketplace pour parcours œuvres d'artiste (acheteur).
 */

import type { ReactNode } from 'react';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import { cn } from '@/lib/utils';

export interface ArtistPublicPageShellProps {
  children: ReactNode;
  /** Contenu pleine largeur (hero, bannières) sans container */
  bleed?: boolean;
  className?: string;
  hideHeader?: boolean;
}

export function ArtistPublicPageShell({
  children,
  bleed = false,
  className,
  hideHeader = false,
}: ArtistPublicPageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {!hideHeader && <MarketplaceHeader />}
      <main
        className={cn(
          bleed ? 'w-full' : 'container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}
