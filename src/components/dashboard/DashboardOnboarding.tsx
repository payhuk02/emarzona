/**
 * Écran d'accueil dashboard pour les comptes sans boutique (post-inscription).
 * Composant léger : pas de stats, notifications ni realtime.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Store } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePageCustomization } from '@/hooks/usePageCustomization';

export function DashboardOnboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getValue } = usePageCustomization('dashboard');

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
              <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
                <LayoutDashboard
                  className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500"
                  aria-hidden
                />
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  {getValue('dashboard.welcome', 'dashboard.welcome', 'Bienvenue sur Emarzona !')}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mb-6">
                  {t(
                    'dashboard.createStorePrompt',
                    'Créez votre première boutique pour commencer à vendre.'
                  )}
                </p>
                <Button
                  onClick={() => navigate('/dashboard/store')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white min-h-[44px] text-sm sm:text-base touch-manipulation gap-2"
                >
                  <Store className="h-4 w-4" aria-hidden />
                  {getValue(
                    'dashboard.createStoreButton',
                    'dashboard.createStoreButton',
                    'Créer ma boutique'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
