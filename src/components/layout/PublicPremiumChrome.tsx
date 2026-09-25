/**
 * Chrome public minimal : PremiumNav + offset, sans footer marketing.
 * Sur sous-domaine boutique (StorefrontAppLayout), le nav plateforme est omis —
 * le chrome boutique (header/footer) est déjà fourni par le layout parent.
 */

import type { ReactNode } from 'react';
import { PremiumNav } from '@/components/landing/premium/PremiumNav';
import { useStorefrontShell } from '@/contexts/StorefrontShellContext';
import { cn } from '@/lib/utils';
import '@/styles/landing-premium.css';

type PublicPremiumChromeProps = {
  children: ReactNode;
  className?: string;
  mainAriaLabel?: string;
};

export function PublicPremiumChrome({
  children,
  className,
  mainAriaLabel,
}: PublicPremiumChromeProps) {
  const storefrontShell = useStorefrontShell();
  const hidePlatformNav = Boolean(storefrontShell?.chromeProvided);

  return (
    <div
      className={cn(
        hidePlatformNav
          ? 'min-h-screen overflow-x-hidden bg-background'
          : 'landing-premium min-h-screen overflow-x-hidden bg-background',
        className
      )}
      role="main"
      id="main-content"
      aria-label={mainAriaLabel}
    >
      {!hidePlatformNav && <PremiumNav />}
      <div className={hidePlatformNav ? undefined : 'pt-[var(--lp-nav-offset)]'}>{children}</div>
    </div>
  );
}
