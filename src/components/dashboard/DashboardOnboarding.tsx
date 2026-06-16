/**
 * Écran d'accueil dashboard pour les comptes sans boutique (post-inscription).
 * Composant léger : pas de stats, notifications ni realtime.
 */

import { useNavigate } from 'react-router-dom';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, ShoppingBag, Store, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePageCustomization } from '@/hooks/usePageCustomization';

export function DashboardOnboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getValue } = usePageCustomization('dashboard');

  return (
    <AppPageShell>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
          <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12">
            <LayoutDashboard
              className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500"
              aria-hidden
            />
            <p className="text-sm sm:text-base text-muted-foreground mb-2 text-center">
              {getValue('dashboard.welcome', 'dashboard.welcome', 'Bienvenue sur Emarzona !')}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mb-6 text-center">
              {t('dashboard.onboardingChoosePersona', 'Choisissez votre espace pour continuer.')}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Store className="h-4 w-4" aria-hidden />
                    {t('dashboard.onboardingSellerTitle', 'Je suis vendeur')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-xs text-muted-foreground mb-3">
                    {t(
                      'dashboard.onboardingSellerDescription',
                      'Créez votre boutique et commencez a vendre.'
                    )}
                  </p>
                  <Button
                    onClick={() => navigate('/dashboard/settings?tab=store&action=create')}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white min-h-[44px] text-sm touch-manipulation gap-2"
                  >
                    <Store className="h-4 w-4" aria-hidden />
                    {getValue(
                      'dashboard.createStoreButton',
                      'dashboard.createStoreButton',
                      'Creer ma boutique'
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" aria-hidden />
                    {t('dashboard.onboardingBuyerTitle', 'Je suis acheteur')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-2">
                  <p className="text-xs text-muted-foreground mb-3">
                    {t(
                      'dashboard.onboardingBuyerDescription',
                      'Accedez a votre espace client ou poursuivez vos achats.'
                    )}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/account')}
                    className="w-full min-h-[44px] text-sm touch-manipulation gap-2"
                  >
                    <User className="h-4 w-4" aria-hidden />
                    {t('dashboard.onboardingBuyerAccount', 'Acceder a Mon Espace Client')}
                  </Button>
                  <Button
                    onClick={() => navigate('/marketplace')}
                    className="w-full min-h-[44px] text-sm touch-manipulation gap-2"
                  >
                    <ShoppingBag className="h-4 w-4" aria-hidden />
                    {t('dashboard.onboardingBuyerMarketplace', 'Continuer mes achats')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppPageShell>
  );
}
