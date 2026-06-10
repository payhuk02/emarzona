/**
 * Facturation vendeur — abonnement produits physiques
 */

import { Link } from 'react-router-dom';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { useStore } from '@/hooks/useStore';
import { PhysicalSubscriptionRequired } from '@/components/billing/PhysicalSubscriptionRequired';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useStorePhysicalAccess } from '@/hooks/billing/useStorePhysicalAccess';
import { useSubscriptionInvoices } from '@/hooks/billing/useSubscriptionInvoices';
import { useSubscriptionBillingMandate } from '@/hooks/billing/useSubscriptionBillingMandate';
import { initiateSubscriptionRenewalCheckout } from '@/lib/billing/subscription-renewal';
import { PhysicalPlanChangeSection } from '@/components/billing/PhysicalPlanChangeSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

export default function StorePhysicalBilling() {
  const { store, loading } = useStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const access = useStorePhysicalAccess(store?.id);
  const { data: invoices = [], isLoading: invoicesLoading } = useSubscriptionInvoices(store?.id);
  const { data: billingMandate } = useSubscriptionBillingMandate(store?.id);
  const [renewing, setRenewing] = useState(false);

  const autoRenewEnabled = billingMandate?.mandate?.auto_renew_enabled ?? false;
  const pendingCheckoutUrl = billingMandate?.pendingCheckout?.checkout_url ?? null;

  useEffect(() => {
    // Message contextuel en cas de redirection depuis un guard de route
    const navState = window.history.state?.usr as
      | { blockedPath?: string; requiredPlan?: string }
      | undefined;
    if (navState?.blockedPath) {
      toast({
        title: 'Upgrade requis',
        description: `${navState.blockedPath} requiert le plan ${navState.requiredPlan ?? 'supérieur'}.`,
      });
      // purge one-shot
      window.history.replaceState({ ...window.history.state, usr: {} }, document.title);
    }
  }, [toast]);

  useEffect(() => {
    const success = searchParams.get('success');
    const cancel = searchParams.get('cancel');
    const planChange = searchParams.get('plan_change');
    if (!success && !cancel) return;

    if (success) {
      toast({
        title: planChange ? 'Upgrade confirmé' : 'Paiement reçu',
        description: planChange
          ? 'Votre nouveau plan sera actif dans quelques secondes.'
          : "Nous confirmons votre paiement. L'activation peut prendre quelques secondes.",
      });
      access.refresh();
    }

    if (cancel) {
      toast({
        title: 'Paiement annulé',
        description: "Aucun débit n'a été effectué. Vous pouvez réessayer à tout moment.",
        variant: 'destructive',
      });
    }

    // Nettoyer l'URL (évite de rejouer les toasts au refresh)
    searchParams.delete('success');
    searchParams.delete('cancel');
    setSearchParams(searchParams, { replace: true });
  }, [access, searchParams, setSearchParams, toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <p className="text-muted-foreground">Aucune boutique sélectionnée.</p>
      </div>
    );
  }

  return (
    <AppPageShell mainClassName="overflow-x-hidden">
      <div className="border-b px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/products')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Mes produits
        </Button>
      </div>
      <PhysicalSubscriptionRequired storeId={store.id} />

      <div className="container mx-auto max-w-4xl px-4 pb-6 space-y-4">
        {access.planSlug && (
          <PhysicalPlanChangeSection
            storeId={store.id}
            currentPlanSlug={access.planSlug}
            subscriptionStatus={access.status}
            onChanged={() => access.refresh()}
          />
        )}

        {autoRenewEnabled && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Renouvellement automatique</CardTitle>
              <CardDescription>
                Votre profil de paiement Moneroo est enregistré. Un checkout pré-rempli sera généré
                automatiquement avant chaque échéance — confirmez sur mobile money.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Auto-renouvellement actif</Badge>
              {billingMandate?.mandate?.customer_email && (
                <span className="text-xs text-muted-foreground">
                  {billingMandate.mandate.customer_email}
                </span>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historique de facturation</CardTitle>
            <CardDescription>Factures d&apos;abonnement produits physiques</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingCheckoutUrl && (
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-2">
                <p className="text-sm font-medium">Paiement de renouvellement en attente</p>
                <p className="text-xs text-muted-foreground">
                  Un checkout Moneroo a été préparé automatiquement. Confirmez le paiement pour
                  prolonger votre abonnement.
                </p>
                <Button asChild size="sm">
                  <a href={pendingCheckoutUrl}>Confirmer le paiement Moneroo</a>
                </Button>
              </div>
            )}

            {(access.status === 'past_due' || access.status === 'active') &&
              access.planSlug &&
              !pendingCheckoutUrl && (
                <Button
                  disabled={renewing}
                  onClick={async () => {
                    setRenewing(true);
                    try {
                      const {
                        data: { user },
                      } = await supabase.auth.getUser();
                      if (!user?.email) throw new Error('Email requis');
                      const url = await initiateSubscriptionRenewalCheckout(
                        store.id,
                        access.planSlug!,
                        user.email,
                        (user.user_metadata?.full_name as string | undefined) ?? undefined
                      );
                      window.location.href = url;
                    } catch (e: unknown) {
                      toast({
                        title: 'Erreur',
                        description: e instanceof Error ? e.message : 'Paiement impossible',
                        variant: 'destructive',
                      });
                    } finally {
                      setRenewing(false);
                    }
                  }}
                >
                  {renewing
                    ? 'Redirection…'
                    : access.status === 'past_due'
                      ? 'Régulariser le paiement'
                      : 'Renouveler maintenant'}
                </Button>
              )}

            {invoicesLoading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune facture pour le moment.</p>
            ) : (
              <ul className="space-y-2">
                {invoices.map(inv => (
                  <li
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(inv.period_start), 'dd MMM yyyy', { locale: fr })} →{' '}
                        {format(new Date(inv.period_end), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {formatCurrency(Number(inv.amount))} {inv.currency}
                      </span>
                      <Badge variant={inv.status === 'paid' ? 'secondary' : 'outline'}>
                        {inv.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="container mx-auto max-w-4xl px-4 pb-8">
        <p className="text-xs text-muted-foreground">
          Besoin d&apos;aide ?{' '}
          <Link to="/dashboard/support" className="text-primary hover:underline">
            Contacter le support
          </Link>
        </p>
      </div>
    </AppPageShell>
  );
}
