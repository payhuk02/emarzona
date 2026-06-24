/**
 * Écran de blocage / onboarding abonnement produits physiques (Enterprise UX)
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useStorePhysicalAccess } from '@/hooks/billing/useStorePhysicalAccess';
import { PHYSICAL_TRIAL_DAYS } from '@/lib/billing/platform-pricing';
import { PHYSICAL_PLAN_CARDS, physicalPlanLabel } from '@/lib/billing/physical-plan-display';
import {
  detectUserCheckoutCurrency,
  formatPhysicalPlanPrice,
  resolvePhysicalPlanCheckout,
} from '@/lib/billing/physical-subscription-checkout';
import type { PhysicalPlanSlug } from '@/lib/billing/physical-plan-capabilities';
import { useUserCurrency } from '@/hooks/useCurrency';
import { Package, Lock, Sparkles, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { initiateBillingCheckout } from '@/lib/billing/initiate-billing-payment';

type PhysicalSubscriptionRequiredProps = {
  storeId: string;
  onBack?: () => void;
  compact?: boolean;
};

export function PhysicalSubscriptionRequired({
  storeId,
  onBack,
  compact = false,
}: PhysicalSubscriptionRequiredProps) {
  const access = useStorePhysicalAccess(storeId);
  const { toast } = useToast();
  const [checkingOutSlug, setCheckingOutSlug] = useState<string | null>(null);
  const userCurrency = useUserCurrency();

  if (access.loading) {
    return (
      <div className={compact ? 'p-4' : 'container mx-auto max-w-4xl p-6 space-y-4'}>
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const statusMessage = (() => {
    switch (access.status) {
      case 'trialing':
        return access.trialDaysRemaining != null
          ? `Essai gratuit — ${access.trialDaysRemaining} jour(s) restant(s). Vous pouvez activer un abonnement payant à tout moment pour débloquer les fonctionnalités avancées.`
          : `Essai gratuit — ${PHYSICAL_TRIAL_DAYS} jours. Vous pouvez activer un abonnement payant à tout moment.`;
      case 'expired':
        return 'Votre essai gratuit est terminé. Choisissez un plan pour continuer.';
      case 'past_due':
        return 'Paiement en retard — régularisez votre abonnement.';
      case 'cancelled':
        return 'Abonnement annulé — réactivez un plan pour vendre des produits physiques.';
      case 'active':
        return `Plan actif : ${physicalPlanLabel(access.planSlug) || access.planName || 'Physique'}`;
      default:
        return 'Abonnement requis pour activer l’e-commerce produits physiques.';
    }
  })();

  const canSubscribeNow = !access.allowed || access.status === 'trialing';

  return (
    <div className={compact ? 'space-y-4' : 'container mx-auto max-w-4xl p-4 sm:p-6 space-y-6'}>
      {!compact && onBack && (
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour au choix du type
        </Button>
      )}

      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-3">
          <Package className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Produits physiques — abonnement requis</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Seul le système <strong>produits physiques</strong> nécessite un abonnement mensuel (
            {PHYSICAL_TRIAL_DAYS} jours d&apos;essai gratuit). Les autres systèmes (digital,
            services, cours, œuvres) restent à <strong>commission 10%</strong> par vente réussie.
          </p>
        </div>
      </div>

      <Alert variant={access.allowed ? 'default' : 'destructive'}>
        {access.allowed ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        <AlertTitle>{access.allowed ? 'Accès autorisé' : 'Création bloquée'}</AlertTitle>
        <AlertDescription>{statusMessage}</AlertDescription>
      </Alert>

      {access.trialEndsAt && access.status === 'trialing' && (
        <p className="text-xs text-muted-foreground">
          Fin d&apos;essai :{' '}
          {format(new Date(access.trialEndsAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {PHYSICAL_PLAN_CARDS.map(plan => (
          <Card
            key={plan.slug}
            className={
              access.planSlug === plan.slug ? 'border-primary ring-1 ring-primary/30' : undefined
            }
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{plan.label}</CardTitle>
                {access.planSlug === plan.slug && <Badge variant="secondary">Plan actuel</Badge>}
              </div>
              <CardDescription>{plan.tagline}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatPhysicalPlanPrice(plan.priceUsd, 'USD')}</p>
              {userCurrency !== 'USD' && (
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {formatPhysicalPlanPrice(plan.priceUsd, userCurrency)} au checkout
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                / mois
                {access.status === 'trialing' ? ' (activation immédiate possible)' : ' après essai'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {canSubscribeNow && (
        <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">
                  {access.status === 'trialing'
                    ? 'Passez à un abonnement payant quand vous voulez'
                    : 'Activez votre abonnement physique'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {access.status === 'trialing'
                    ? "Pas besoin d'attendre la fin de l'essai : choisissez Starter, Professional ou Business pour débloquer plus de capacités."
                    : 'Consultez votre facturation ou choisissez un plan Starter / Professional / Business.'}
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0">
              <Link to="/dashboard/billing/physical">
                <Sparkles className="h-4 w-4 mr-2" />
                Voir la facturation
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {canSubscribeNow && (
        <Card>
          <CardHeader>
            <CardTitle>
              {access.status === 'trialing'
                ? 'Activer un abonnement maintenant'
                : 'Activer un plan'}
            </CardTitle>
            <CardDescription>
              Paiement sécurisé via la plateforme Emarzona. À confirmation, votre accès « produits
              physiques » est activé automatiquement — y compris pendant votre essai gratuit.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {PHYSICAL_PLAN_CARDS.map(plan => (
              <Button
                key={plan.slug}
                variant={plan.slug === 'physical_standard' ? 'default' : 'outline'}
                title={plan.tagline}
                disabled={checkingOutSlug !== null}
                onClick={async () => {
                  setCheckingOutSlug(plan.slug);
                  try {
                    const {
                      data: { user },
                      error: userErr,
                    } = await supabase.auth.getUser();
                    if (userErr) throw userErr;
                    if (!user?.email) {
                      throw new Error('Email requis pour initier le paiement.');
                    }

                    const checkout = resolvePhysicalPlanCheckout(
                      plan.slug as Exclude<PhysicalPlanSlug, null>,
                      detectUserCheckoutCurrency()
                    );

                    const checkoutUrl = await initiateBillingCheckout({
                      storeId,
                      amount: checkout.amount,
                      currency: checkout.currency,
                      description: `Abonnement produits physiques — ${plan.label}`,
                      customerEmail: user.email,
                      customerName:
                        (user.user_metadata?.full_name as string | undefined) ||
                        user.email.split('@')[0] ||
                        undefined,
                      purpose: 'physical_subscription',
                      planSlug: plan.slug,
                    });

                    window.location.href = checkoutUrl;
                  } catch (e: unknown) {
                    toast({
                      title: 'Erreur checkout',
                      description: e instanceof Error ? e.message : 'Erreur inconnue',
                      variant: 'destructive',
                    });
                  } finally {
                    setCheckingOutSlug(null);
                  }
                }}
              >
                {checkingOutSlug === plan.slug ? 'Redirection…' : `Choisir ${plan.label}`}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
