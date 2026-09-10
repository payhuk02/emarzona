/**
 * Chrome public minimal : PremiumNav + offset, sans footer marketing.
 */

import type { ReactNode } from 'react';
import { PremiumNav } from '@/components/landing/premium/PremiumNav';
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
  return (
    <div
      className={cn('landing-premium min-h-screen overflow-x-hidden bg-background', className)}
      role="main"
      id="main-content"
      aria-label={mainAriaLabel}
    >
      <PremiumNav />
      <div className="pt-[var(--lp-nav-offset)]">{children}</div>
    </div>
  );
}
