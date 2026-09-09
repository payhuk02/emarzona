import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CheckoutChromeProps = {
  children: ReactNode;
  className?: string;
  /** Affiche le bandeau titre checkout (défaut true). */
  showHeader?: boolean;
  title?: string;
  description?: string;
};

/**
 * Chrome checkout minimal — pas de sidebar vendeur / AppPageShell.
 */
export function CheckoutChrome({
  children,
  className,
  showHeader = true,
  title = 'Finaliser la commande',
  description = 'Remplissez vos informations pour compléter votre achat',
}: CheckoutChromeProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'checkout-readable min-h-screen bg-gradient-to-b from-muted/40 via-background to-background',
        'py-4 px-3 sm:py-8 sm:px-6 lg:px-8 pb-[max(5rem,env(safe-area-inset-bottom))] md:pb-8',
        className
      )}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {showHeader && (
          <header className="space-y-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 -ml-2 text-muted-foreground"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Retour
            </Button>
            <div>
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold flex items-center gap-2">
                <ShoppingBag className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                {title}
              </h1>
              <p
                className="text-xs sm:text-sm text-muted-foreground mt-1"
                id="checkout-description"
              >
                {description}
              </p>
            </div>
          </header>
        )}
        {children}
      </div>
    </div>
  );
}
