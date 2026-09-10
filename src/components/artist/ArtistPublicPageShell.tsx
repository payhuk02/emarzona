/**
 * Coque layout publique marketplace pour parcours œuvres d'artiste (acheteur).
 */

import type { ReactNode } from 'react';
import { PremiumNav } from '@/components/landing/premium/PremiumNav';
import { isStoreSubdomainContext } from '@/lib/subdomain-store-context';
import { cn } from '@/lib/utils';
import '@/styles/landing-premium.css';

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
  const showPlatformHeader = !hideHeader && !isStoreSubdomainContext();

  return (
    <div className={cn('min-h-screen bg-background', showPlatformHeader && 'landing-premium')}>
      {showPlatformHeader && <PremiumNav />}
      <main
        className={cn(
          showPlatformHeader && 'pt-[var(--lp-nav-offset)]',
          bleed ? 'w-full' : 'container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}
