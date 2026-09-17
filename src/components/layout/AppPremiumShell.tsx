import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import '@/styles/landing-premium.css';
import '@/styles/app-premium.css';
import '@/styles/app-ui-overrides.css';
import '@/styles/app-typography.css';
import '@/styles/dashboard-responsive.css';

interface AppPremiumShellProps {
  children: ReactNode;
  /**
   * Active les classes thème premium. Toujours monter ce wrapper (même si false)
   * pour éviter de remonter tout l'arbre `<Routes>` au changement marketplace ↔ app.
   */
  enabled?: boolean;
}

/** Enveloppe thème premium (tokens landing) pour dashboard, admin, auth, etc. */
export function AppPremiumShell({ children, enabled = true }: AppPremiumShellProps) {
  return (
    <div
      className={cn('min-h-screen w-full', enabled && 'landing-premium app-premium')}
      data-premium-theme={enabled ? 'on' : 'off'}
    >
      {children}
    </div>
  );
}
