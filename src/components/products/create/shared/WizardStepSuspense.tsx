import { Suspense, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function WizardStepFallback() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Chargement de l'étape">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-20 w-3/4" />
    </div>
  );
}

export function WizardStepSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<WizardStepFallback />}>{children}</Suspense>;
}
