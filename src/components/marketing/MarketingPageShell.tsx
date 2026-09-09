import type { ReactNode } from 'react';
import '@/styles/landing-premium.css';
import { PremiumNav } from '@/components/landing/premium/PremiumNav';
import { PremiumFooter } from '@/components/landing/premium/PremiumFooter';

type Props = {
  children: ReactNode;
};

/** Same public chrome as the landing / blog: sticky nav + footer. */
export function MarketingPageShell({ children }: Props) {
  return (
    <div className="landing-premium min-h-screen bg-[var(--lp-surface,#fafaf9)]">
      <PremiumNav />
      <main className="pt-[var(--lp-nav-offset)]">{children}</main>
      <PremiumFooter />
    </div>
  );
}
