import { ReactNode } from 'react';
import '@/styles/landing-premium.css';
import '@/styles/app-premium.css';
import '@/styles/app-ui-overrides.css';

interface AppPremiumShellProps {
  children: ReactNode;
}

/** Enveloppe thème premium (tokens landing) pour dashboard, admin, auth, etc. */
export function AppPremiumShell({ children }: AppPremiumShellProps) {
  return <div className="landing-premium app-premium min-h-screen w-full">{children}</div>;
}
