/**
 * Error boundary for marketplace / checkout critical paths.
 * Resets on navigation so a crashed product card doesn't block the next page.
 */
import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertCircle, RefreshCw, Home, ShoppingBag } from 'lucide-react';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { Button } from '@/components/ui/button';

type CommercePageErrorBoundaryProps = {
  children: ReactNode;
  /** Label shown in fallback, e.g. "Marketplace" or "Checkout" */
  pageName: string;
  /** Safe recovery path when the page is unusable */
  homeHref?: string;
};

function CommercePageFallback({
  pageName,
  homeHref,
  onRetry,
}: {
  pageName: string;
  homeHref: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6"
      role="alert"
      data-testid="commerce-page-error-boundary"
    >
      <AlertCircle className="h-10 w-10 text-destructive" aria-hidden />
      <h1 className="text-xl font-semibold text-foreground text-center">
        Impossible d&apos;afficher {pageName}
      </h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        Une erreur inattendue s&apos;est produite. Vous pouvez réessayer ou continuer vos achats
        ailleurs — le reste de la plateforme reste disponible.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" variant="default" size="sm" className="gap-2" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
          <Link to={homeHref}>
            <ShoppingBag className="h-4 w-4" />
            Marketplace
          </Link>
        </Button>
        <Button type="button" variant="ghost" size="sm" className="gap-2" asChild>
          <Link to="/">
            <Home className="h-4 w-4" />
            Accueil
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function CommercePageErrorBoundary({
  children,
  pageName,
  homeHref = '/marketplace',
}: CommercePageErrorBoundaryProps) {
  const location = useLocation();
  const resetKey = `${location.pathname}${location.search}`;

  return (
    <ErrorBoundary
      resetKey={resetKey}
      fallback={
        <CommercePageFallback
          pageName={pageName}
          homeHref={homeHref}
          onRetry={() => window.location.reload()}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}
