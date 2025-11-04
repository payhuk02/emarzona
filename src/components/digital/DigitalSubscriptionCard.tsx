/**
 * Digital Subscription Card Component
 * Date: 27 Janvier 2025
 * 
 * Composant pour afficher une carte d'abonnement de produit digital
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { DigitalProductSubscription } from '@/hooks/digital/useDigitalSubscriptions';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DigitalSubscriptionCardProps {
  subscription: DigitalProductSubscription;
  showActions?: boolean;
  onCancel?: (subscriptionId: string) => void;
  onReactivate?: (subscriptionId: string) => void;
  onViewPayments?: (subscriptionId: string) => void;
  className?: string;
}

const STATUS_CONFIG = {
  active: {
    label: 'Actif',
    color: 'bg-green-500',
    icon: CheckCircle2,
    variant: 'default' as const,
  },
  cancelled: {
    label: 'Annulé',
    color: 'bg-gray-500',
    icon: XCircle,
    variant: 'outline' as const,
  },
  expired: {
    label: 'Expiré',
    color: 'bg-red-500',
    icon: XCircle,
    variant: 'destructive' as const,
  },
  past_due: {
    label: 'En retard',
    color: 'bg-yellow-500',
    icon: AlertCircle,
    variant: 'secondary' as const,
  },
  trialing: {
    label: 'Essai',
    color: 'bg-blue-500',
    icon: Clock,
    variant: 'secondary' as const,
  },
  paused: {
    label: 'En pause',
    color: 'bg-orange-500',
    icon: Pause,
    variant: 'secondary' as const,
  },
  suspended: {
    label: 'Suspendu',
    color: 'bg-red-500',
    icon: AlertCircle,
    variant: 'destructive' as const,
  },
};

const INTERVAL_LABELS = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
  yearly: 'Annuel',
};

export const DigitalSubscriptionCard = ({
  subscription,
  showActions = true,
  onCancel,
  onReactivate,
  onViewPayments,
  className,
}: DigitalSubscriptionCardProps) => {
  const statusConfig = STATUS_CONFIG[subscription.status] || STATUS_CONFIG.active;
  const StatusIcon = statusConfig.icon;

  // Calculer le pourcentage de la période écoulée
  const now = new Date();
  const periodStart = new Date(subscription.current_period_start);
  const periodEnd = new Date(subscription.current_period_end);
  const totalPeriod = periodEnd.getTime() - periodStart.getTime();
  const elapsed = now.getTime() - periodStart.getTime();
  const progressPercentage = Math.min(
    Math.max((elapsed / totalPeriod) * 100, 0),
    100
  );

  // Vérifier si en période d'essai
  const isTrialing = subscription.status === 'trialing' && subscription.trial_end;
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null;

  // Vérifier si sera annulé à la fin de la période
  const willCancel = subscription.cancel_at_period_end;

  return (
    <Card
      className={cn(
        "group hover:shadow-lg transition-all duration-300",
        subscription.status === 'active' && "border-green-500",
        subscription.status === 'past_due' && "border-yellow-500",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2 mb-2">
              {subscription.digital_product?.name || 'Produit digital'}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 flex-wrap">
              <Badge variant={statusConfig.variant} className="text-xs">
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {INTERVAL_LABELS[subscription.subscription_interval]}
              </Badge>
              {isTrialing && (
                <Badge variant="secondary" className="text-xs">
                  Essai gratuit
                </Badge>
              )}
              {willCancel && (
                <Badge variant="destructive" className="text-xs">
                  Annulation programmée
                </Badge>
              )}
            </CardDescription>
          </div>
          {subscription.digital_product?.image_url && (
            <img
              src={subscription.digital_product.image_url}
              alt={subscription.digital_product.name}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pricing */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">
            {subscription.subscription_price.toLocaleString()} {subscription.currency}
          </span>
          <span className="text-sm text-muted-foreground">
            / {INTERVAL_LABELS[subscription.subscription_interval].toLowerCase()}
          </span>
        </div>

        {/* Période actuelle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Période actuelle</span>
            <span className="font-medium">
              {format(periodStart, 'dd MMM yyyy', { locale: fr })} - {format(periodEnd, 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>
          {subscription.status === 'active' && (
            <Progress value={progressPercentage} className="h-2" />
          )}
        </div>

        {/* Période d'essai */}
        {isTrialing && trialEnd && (
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                Essai gratuit jusqu'au {format(trialEnd, 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
          </div>
        )}

        {/* Prochain paiement */}
        {subscription.next_billing_date && subscription.status === 'active' && !isTrialing && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Prochain paiement
            </span>
            <span className="font-medium">
              {format(new Date(subscription.next_billing_date), 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{subscription.total_payments}</div>
            <div className="text-xs text-muted-foreground">Paiements</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {subscription.total_amount_paid.toLocaleString()} {subscription.currency}
            </div>
            <div className="text-xs text-muted-foreground">Total payé</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{subscription.failed_payment_attempts}</div>
            <div className="text-xs text-muted-foreground">Échecs</div>
          </div>
        </div>

        {/* Message d'annulation */}
        {willCancel && (
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 text-sm text-yellow-900 dark:text-yellow-100">
              <AlertCircle className="h-4 w-4" />
              <span>
                L'abonnement sera annulé le {format(periodEnd, 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="flex gap-2">
          {subscription.status === 'active' && !willCancel && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onCancel?.(subscription.id)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          )}
          {willCancel && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onReactivate?.(subscription.id)}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Réactiver
            </Button>
          )}
          {subscription.status === 'cancelled' && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onReactivate?.(subscription.id)}
            >
              <Play className="h-4 w-4 mr-2" />
              Réactiver
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onViewPayments?.(subscription.id)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Historique
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

/**
 * Subscriptions Grid - Grille d'abonnements
 */
export const DigitalSubscriptionsGrid = ({
  subscriptions,
  loading,
  onCancel,
  onReactivate,
  onViewPayments,
}: {
  subscriptions: DigitalProductSubscription[];
  loading?: boolean;
  onCancel?: (subscriptionId: string) => void;
  onReactivate?: (subscriptionId: string) => void;
  onViewPayments?: (subscriptionId: string) => void;
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucun abonnement</h3>
          <p className="text-muted-foreground">
            Vos abonnements de produits digitaux apparaîtront ici
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {subscriptions.map((subscription) => (
        <DigitalSubscriptionCard
          key={subscription.id}
          subscription={subscription}
          onCancel={onCancel}
          onReactivate={onReactivate}
          onViewPayments={onViewPayments}
        />
      ))}
    </div>
  );
};

