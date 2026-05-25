/**
 * Fallback affiché quand un chunk de page ne peut pas être chargé (réseau, cache SW, deploy).
 */
import { Button } from '@/components/ui/button';

interface PageLoadErrorProps {
  pageName?: string;
}

export function PageLoadError({ pageName }: PageLoadErrorProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h2 className="text-xl font-semibold">Erreur de chargement</h2>
        <p className="text-muted-foreground text-sm">
          {pageName
            ? `Impossible de charger « ${pageName} ». Une mise à jour peut être en cours.`
            : 'Impossible de charger cette page. Une mise à jour peut être en cours.'}
        </p>
        <Button type="button" onClick={() => window.location.reload()}>
          Recharger la page
        </Button>
      </div>
    </div>
  );
}
