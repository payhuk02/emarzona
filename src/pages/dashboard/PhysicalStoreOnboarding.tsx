import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Rocket, Sparkles } from 'lucide-react';
import { PHYSICAL_TRIAL_DAYS } from '@/hooks/billing/useStorePhysicalAccess';
import { useStore } from '@/hooks/useStore';
import { useAnalytics } from '@/hooks/useAnalytics';

const PhysicalStoreOnboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { store } = useStore();
  const seenTrackedRef = useRef(false);
  const storeIdFromQuery = searchParams.get('storeId');
  const analyticsStoreId = useMemo(
    () => storeIdFromQuery ?? store?.id ?? undefined,
    [storeIdFromQuery, store?.id]
  );
  const { trackEvent } = useAnalytics(analyticsStoreId);

  useEffect(() => {
    if (!analyticsStoreId || seenTrackedRef.current) {
      return;
    }

    seenTrackedRef.current = true;
    void trackEvent({
      storeId: analyticsStoreId,
      eventType: 'physical_onboarding_seen',
      eventData: {
        trial_days: PHYSICAL_TRIAL_DAYS,
        source: 'physical_store_onboarding',
      },
    });
  }, [analyticsStoreId, trackEvent]);

  return (
    <AppPageShell>
      <div className="container mx-auto max-w-3xl p-4 sm:p-6">
        <Card className="border-border/50 bg-card/70 backdrop-blur-sm">
          <CardHeader className="space-y-3">
            <Badge variant="secondary" className="w-fit">
              Boutique physique creee
            </Badge>
            <CardTitle className="text-xl sm:text-2xl">
              Votre boutique physique est prete.
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Vous beneficiez maintenant d&apos;un essai gratuit de {PHYSICAL_TRIAL_DAYS} jours.
              Vous pouvez commencer a vendre tout de suite, ou activer un abonnement maintenant pour
              profiter de plus de fonctionnalites avancees.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Gift className="h-4 w-4" aria-hidden />
                  Essai gratuit actif
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Commencez a utiliser votre espace physique sans paiement immediat.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Upgrade optionnel
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Activez un abonnement quand vous voulez pour debloquer plus de capacites.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={() => {
                  if (analyticsStoreId) {
                    void trackEvent({
                      storeId: analyticsStoreId,
                      eventType: 'trial_continue_clicked',
                      eventData: {
                        trial_days: PHYSICAL_TRIAL_DAYS,
                        source: 'physical_store_onboarding',
                      },
                    });
                  }
                  navigate('/dashboard');
                }}
                className="w-full sm:w-auto min-h-[44px] gap-2"
              >
                <Rocket className="h-4 w-4" aria-hidden />
                Continuer avec l&apos;essai gratuit
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (analyticsStoreId) {
                    void trackEvent({
                      storeId: analyticsStoreId,
                      eventType: 'billing_cta_clicked',
                      eventData: {
                        trial_days: PHYSICAL_TRIAL_DAYS,
                        source: 'physical_store_onboarding',
                      },
                    });
                  }
                  navigate('/dashboard/billing/physical');
                }}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Voir les abonnements maintenant
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppPageShell>
  );
};

export default PhysicalStoreOnboarding;
