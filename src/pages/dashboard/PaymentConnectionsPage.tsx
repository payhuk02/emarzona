/**
 * Connexions paiement vendeur — Stripe Connect, PayPal Commerce, MoneyFusion plateforme
 */
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { useStorePaymentConnections } from '@/hooks/payments/useStorePaymentConnections';
import { StripeConnectCard } from '@/components/payments/StripeConnectCard';
import { PayPalConnectCard } from '@/components/payments/PayPalConnectCard';
import { PaymentConnectionsOnboardingChecklist } from '@/components/payments/PaymentConnectionsOnboardingChecklist';
import { Wallet, Loader2, BookOpen } from 'lucide-react';
import { isPaymentOrchestrationV2Enabled } from '@/lib/payments/feature-flags';

export default function PaymentConnectionsPage() {
  const { store, loading: storeLoading } = useStore();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const orchestrationEnabled = isPaymentOrchestrationV2Enabled();

  const {
    connections,
    stripeConnection,
    paypalConnection,
    isLoading,
    connectStripe,
    syncStripe,
    connectPayPal,
    syncPayPal,
    refetch,
  } = useStorePaymentConnections();

  const moneyfusionConnection = connections.find(c => c.provider === 'moneyfusion');

  useEffect(() => {
    const stripeReturn = searchParams.get('stripe');
    if (!stripeReturn || !store?.id) return;

    syncStripe.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: 'Stripe mis à jour',
          description: 'Le statut de votre compte a été synchronisé.',
        });
        setSearchParams({}, { replace: true });
      },
      onError: (err: Error) => {
        toast({
          title: 'Erreur Stripe',
          description: err.message,
          variant: 'destructive',
        });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on return URL
  }, [searchParams.get('stripe'), store?.id]);

  useEffect(() => {
    const paypalReturn = searchParams.get('paypal');
    if (!paypalReturn || !store?.id) return;

    syncPayPal.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: 'PayPal mis à jour',
          description: 'Le statut de votre compte a été synchronisé.',
        });
        setSearchParams({}, { replace: true });
      },
      onError: (err: Error) => {
        toast({
          title: 'Erreur PayPal',
          description: err.message,
          variant: 'destructive',
        });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on return URL
  }, [searchParams.get('paypal'), store?.id]);

  const handleConnectStripe = () => {
    const origin = window.location.origin;
    connectStripe.mutate(
      {
        returnUrl: `${origin}/dashboard/payment-connections?stripe=return`,
        refreshUrl: `${origin}/dashboard/payment-connections?stripe=refresh`,
      },
      {
        onSuccess: data => {
          if (data.url) {
            window.location.href = data.url;
          }
        },
        onError: (err: Error) => {
          toast({ title: 'Connexion Stripe', description: err.message, variant: 'destructive' });
        },
      }
    );
  };

  const handleConnectPayPal = () => {
    const origin = window.location.origin;
    connectPayPal.mutate(
      {
        returnUrl: `${origin}/dashboard/payment-connections?paypal=return`,
      },
      {
        onSuccess: data => {
          if (data.url) {
            window.location.href = data.url;
          }
        },
        onError: (err: Error) => {
          toast({ title: 'Connexion PayPal', description: err.message, variant: 'destructive' });
        },
      }
    );
  };

  if (storeLoading || !store) {
    return (
      <AppPageShell layoutType="finance">
        <div className="container mx-auto flex min-h-[40vh] items-center justify-center p-4 md:p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell layoutType="finance">
      <div className="container mx-auto overflow-x-hidden p-4 md:p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Connexions paiement</h1>
          <p className="text-muted-foreground mt-1">
            Connectez vos comptes pour encaisser dans le monde entier. MoneyFusion est disponible
            pour l&apos;Afrique (XOF).
          </p>
          {!orchestrationEnabled && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
              Orchestration V2 désactivée en environnement — activez{' '}
              <code className="text-xs">VITE_PAYMENT_ORCHESTRATION_V2=true</code> pour le checkout
              Stripe.
            </p>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="space-y-6">
            <PaymentConnectionsOnboardingChecklist
              storeId={store.id}
              stripeConnection={stripeConnection}
              paypalConnection={paypalConnection}
              moneyfusionActive={
                !moneyfusionConnection || moneyfusionConnection.external_account_status === 'active'
              }
            />

            <StripeConnectCard
              connection={stripeConnection}
              isConnecting={connectStripe.isPending}
              isSyncing={syncStripe.isPending}
              onConnect={handleConnectStripe}
              onSync={() => syncStripe.mutate()}
            />

            <PayPalConnectCard
              connection={paypalConnection}
              isConnecting={connectPayPal.isPending}
              isSyncing={syncPayPal.isPending}
              onConnect={handleConnectPayPal}
              onSync={() => syncPayPal.mutate()}
            />

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">MoneyFusion (plateforme Emarzona)</CardTitle>
                    <CardDescription>
                      Mobile money et paiements locaux — toujours actif pour votre boutique.
                    </CardDescription>
                  </div>
                  <Badge className="ml-auto">Inclus</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Statut :{' '}
                  {moneyfusionConnection?.external_account_status === 'active'
                    ? 'Actif'
                    : 'Configuration plateforme'}
                </p>
              </CardContent>
            </Card>

            <Card id="guide-paiements">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" aria-hidden />
                  <CardTitle className="text-lg">Guide rapide</CardTitle>
                </div>
                <CardDescription>
                  Documentation vendeur :{' '}
                  <code className="text-xs">docs/USER_GUIDE_PAYMENT_CONNECTIONS.md</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  1. Connectez <strong>Stripe</strong> pour les cartes internationales (EUR, USD,
                  GBP).
                </p>
                <p>
                  2. Connectez <strong>PayPal</strong> pour les acheteurs US/EU préférant PayPal.
                </p>
                <p>
                  3. <strong>MoneyFusion</strong> reste actif pour l&apos;Afrique francophone (XOF)
                  sans configuration supplémentaire.
                </p>
                <p className="text-xs pt-2">
                  Test recommandé après activation : commande 1 € / 1 $ sur staging ou preview
                  Vercel.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <button
          type="button"
          className="sr-only"
          onClick={() => refetch()}
          aria-label="Rafraîchir"
        />
      </div>
    </AppPageShell>
  );
}
