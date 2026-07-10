import React, { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName?: string;
}

export const FeatureErrorBoundary = ({
  children,
  featureName = 'ce composant',
}: FeatureErrorBoundaryProps) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/50">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <h3 className="font-medium text-red-700 dark:text-red-400 text-center">
            Échec du chargement de {featureName}
          </h3>
          <p className="text-sm text-red-600/80 dark:text-red-400/80 text-center mb-4 mt-1 max-w-sm">
            Une erreur inattendue s'est produite ici, mais le reste de l'application fonctionne
            normalement.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 hover:bg-red-100 text-red-700 dark:border-red-800 dark:hover:bg-red-900 dark:text-red-300"
            onClick={() => window.location.reload()}
          >
            Recharger la page
          </Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};
