import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, Sparkles } from 'lucide-react';
import { StoreOnboardingChecklist } from '@/components/store/StoreOnboardingChecklist';
import { useStoreContext } from '@/contexts/StoreContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { parseStoreCommerceType } from '@/lib/billing/store-commerce-access';
import {
  getStoreOnboardingSteps,
  getStoreVerticalProfile,
} from '@/lib/commerce/store-vertical-config';
import { STORE_COMMERCE_TYPE_LABELS } from '@/constants/store-commerce-types';

const StoreVerticalOnboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { stores, selectedStore, switchStore } = useStoreContext();

  const storeIdFromQuery = searchParams.get('storeId');
  const typeFromQuery = parseStoreCommerceType(searchParams.get('type'));

  const store = useMemo(() => {
    if (storeIdFromQuery) {
      return stores.find(s => s.id === storeIdFromQuery) ?? null;
    }
    return selectedStore;
  }, [storeIdFromQuery, stores, selectedStore]);

  const commerceType = store
    ? parseStoreCommerceType(store.commerce_type ?? store.metadata?.commerce_type ?? typeFromQuery)
    : typeFromQuery;

  const profile = getStoreVerticalProfile(commerceType);
  const steps = getStoreOnboardingSteps(commerceType, store?.id ?? storeIdFromQuery ?? '');
  const { trackEvent } = useAnalytics(store?.id ?? storeIdFromQuery ?? undefined);

  useEffect(() => {
    if (storeIdFromQuery && store?.id !== storeIdFromQuery) {
      const exists = stores.some(s => s.id === storeIdFromQuery);
      if (exists) {
        switchStore(storeIdFromQuery);
      }
    }
  }, [storeIdFromQuery, store?.id, stores, switchStore]);

  useEffect(() => {
    if (!store?.id) return;
    void trackEvent({
      storeId: store.id,
      eventType: 'store_onboarding_seen',
      eventData: {
        commerce_type: commerceType,
        source: 'store_vertical_onboarding',
      },
    });
  }, [store?.id, commerceType, trackEvent]);

  return (
    <AppPageShell>
      <div className="container mx-auto max-w-3xl p-4 sm:p-6 space-y-6">
        <Card className="border-border/50 bg-card/70 backdrop-blur-sm">
          <CardHeader className="space-y-3">
            <Badge variant="secondary" className="w-fit">
              {STORE_COMMERCE_TYPE_LABELS[commerceType]}
            </Badge>
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden />
              Votre boutique est prête
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">{profile.tagline}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {store?.subdomain && (
              <p className="text-sm text-muted-foreground">
                URL publique :{' '}
                <span className="font-medium text-foreground">
                  https://{store.subdomain}.myemarzona.shop
                </span>
              </p>
            )}
            <Button
              variant="outline"
              className="w-full sm:w-auto min-h-[44px] gap-2"
              onClick={() => navigate('/dashboard')}
            >
              <Rocket className="h-4 w-4" aria-hidden />
              Aller au tableau de bord
            </Button>
          </CardContent>
        </Card>

        <StoreOnboardingChecklist
          steps={steps}
          description={`Adapté à votre activité ${profile.label.toLowerCase()}`}
        />
      </div>
    </AppPageShell>
  );
};

export default StoreVerticalOnboarding;
