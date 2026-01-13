/**
 * Composant 404 pour boutique inexistante
 *
 * Affiche une page d'erreur personnalisée quand une boutique
 * n'est pas trouvée pour un sous-domaine donné
 *
 * Date: 1 Février 2025
 */

import { Link } from 'react-router-dom';
import { Store, AlertCircle, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StoreNotFoundProps {
  subdomain: string;
  error?: string;
}

export function StoreNotFound({ subdomain, error }: StoreNotFoundProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <Store className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Boutique introuvable</CardTitle>
          <CardDescription className="mt-2">
            La boutique <span className="font-mono font-semibold">{subdomain}</span> n'existe pas ou
            n'est plus active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Vérifiez que :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>L'URL est correcte</li>
              <li>La boutique est active</li>
              <li>Le sous-domaine est bien configuré</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button asChild className="w-full">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/marketplace">
                <Search className="mr-2 h-4 w-4" />
                Explorer le marketplace
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Vous êtes vendeur ?{' '}
              <Link to="/auth" className="text-primary hover:underline">
                Connectez-vous
              </Link>{' '}
              pour créer votre boutique.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
