/**
 * Gate apex myemarzona.shop (et www.myemarzona.shop) :
 * pas de SPA plateforme — redirection + CTAs absolus vers www.emarzona.com.
 */

import { useEffect } from 'react';
import { Home, Search, Store, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getPlatformLoginUrl,
  getPlatformRegisterUrl,
  getPlatformUrl,
  PLATFORM_ORIGIN,
} from '@/lib/auth-routes';
import { softNavigateTo } from '@/lib/navigation/soft-navigate';

export function StoreDomainApexRedirect() {
  useEffect(() => {
    softNavigateTo(PLATFORM_ORIGIN);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md border-slate-200/80 shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">myemarzona.shop</CardTitle>
          <CardDescription className="mt-2">
            Domaine réservé aux boutiques vendeurs (
            <span className="font-mono text-xs">slug.myemarzona.shop</span>
            ). Redirection vers la plateforme Emarzona…
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full">
            <a href={getPlatformUrl('/')}>
              <Home className="mr-2 h-4 w-4" />
              Accueil Emarzona
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <a href={getPlatformUrl('/marketplace')}>
              <Search className="mr-2 h-4 w-4" />
              Explorer le marketplace
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <a href={getPlatformRegisterUrl()}>
              <Store className="mr-2 h-4 w-4" />
              Créer ma boutique
            </a>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <a href={getPlatformLoginUrl()}>
              <LogIn className="mr-2 h-4 w-4" />
              Connexion vendeur
            </a>
          </Button>
          <p className="pt-2 text-center text-xs text-muted-foreground">
            Si la redirection ne démarre pas, utilisez un des boutons ci-dessus.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
