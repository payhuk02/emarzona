import { Link } from 'react-router-dom';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useStorePhysicalAccess } from '@/hooks/billing/useStorePhysicalAccess';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { physicalPlanLabel } from '@/lib/billing/physical-plan-display';

interface PhysicalSubscriptionAlertProps {
  storeId?: string | null;
}

export function PhysicalSubscriptionAlert({ storeId }: PhysicalSubscriptionAlertProps) {
  const access = useStorePhysicalAccess(storeId);

  if (access.loading || access.status === 'none' || access.status === 'cancelled') {
    return null;
  }

  if (access.allowed && access.status !== 'trialing') {
    return null;
  }

  const billingUrl = '/dashboard/billing/physical';
  const periodEndLabel = access.currentPeriodEnd
    ? format(new Date(access.currentPeriodEnd), 'dd MMM yyyy', { locale: fr })
    : null;

  if (access.status === 'expired') {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Abonnement produits physiques expiré</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Vos produits physiques sont suspendus. Réactivez votre abonnement{' '}
            {access.planName ? `(${physicalPlanLabel(access.planSlug)})` : ''} pour reprendre les
            ventes.
          </span>
          <Button asChild size="sm" variant="outline" className="shrink-0 border-destructive/40">
            <Link to={billingUrl}>Réactiver</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (access.status === 'past_due') {
    return (
      <Alert variant="destructive" className="mb-6">
        <CreditCard className="h-4 w-4" />
        <AlertTitle>Paiement en retard</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Votre abonnement produits physiques est en retard
            {periodEndLabel ? ` (échéance ${periodEndLabel})` : ''}. Sans régularisation, vos
            produits seront suspendus à la fin de la période de grâce (7 jours).
          </span>
          <Button asChild size="sm" variant="outline" className="shrink-0 border-destructive/40">
            <Link to={billingUrl}>Régulariser</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (
    access.status === 'trialing' &&
    access.trialDaysRemaining !== null &&
    access.trialDaysRemaining <= 7
  ) {
    return (
      <Alert className="mb-6 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-900 dark:text-amber-100">
          Essai gratuit — {access.trialDaysRemaining} jour{access.trialDaysRemaining > 1 ? 's' : ''}{' '}
          restant{access.trialDaysRemaining > 1 ? 's' : ''}
        </AlertTitle>
        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-amber-900/90 dark:text-amber-100/90">
          <span>
            Choisissez un plan avant la fin de l&apos;essai pour conserver l&apos;accès aux produits
            physiques.
          </span>
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link to={billingUrl}>Choisir un plan</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
