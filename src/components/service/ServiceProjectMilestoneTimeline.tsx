import { Badge } from '@/components/ui/badge';
import { Check, Clock, Lock, Unlock } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import type { ServiceProjectMilestoneComputed } from '@/lib/service/service-project-milestones';
import type { ServiceOrderMilestoneStatus } from '@/lib/payments/service-order-milestone-flow';

const TRIGGER_LABELS: Record<string, string> = {
  order_placed: 'À la commande',
  delivery_approved: 'À la livraison',
};

const STATUS_LABELS: Record<ServiceOrderMilestoneStatus, string> = {
  pending: 'En attente',
  awaiting_payment: 'À payer',
  held: 'Sécurisé',
  released: 'Libéré',
  paid: 'Payé',
  cancelled: 'Annulé',
};

interface ServiceProjectMilestoneTimelineProps {
  milestones: ServiceProjectMilestoneComputed[];
  currency?: string;
  compact?: boolean;
  className?: string;
  /** Statuts persistés (commande) — prioritaire sur l'heuristique trigger */
  milestoneStatuses?: Array<{
    id?: string;
    sort_order: number;
    status: ServiceOrderMilestoneStatus;
  }>;
}

function resolveMilestoneStatus(
  milestone: ServiceProjectMilestoneComputed,
  index: number,
  milestoneStatuses?: ServiceProjectMilestoneTimelineProps['milestoneStatuses']
): ServiceOrderMilestoneStatus {
  const persisted =
    milestoneStatuses?.find(
      row => row.id === milestone.id || row.sort_order === milestone.sort_order
    )?.status ?? milestoneStatuses?.[index]?.status;
  if (persisted) return persisted;
  return milestone.trigger === 'order_placed' ? 'awaiting_payment' : 'pending';
}

export function ServiceProjectMilestoneTimeline({
  milestones,
  currency = 'XOF',
  compact = false,
  className,
  milestoneStatuses,
}: ServiceProjectMilestoneTimelineProps) {
  if (milestones.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {!compact && (
        <p className="text-sm font-medium flex items-center gap-2">
          <Lock className="h-4 w-4 text-yellow-600" />
          Paiement sécurisé en {milestones.length} jalons
        </p>
      )}
      <ol className="space-y-2">
        {milestones.map((milestone, index) => {
          const status = resolveMilestoneStatus(milestone, index, milestoneStatuses);
          const dueNow = status === 'awaiting_payment';
          const isComplete = status === 'released' || status === 'paid' || status === 'held';
          return (
            <li
              key={milestone.id}
              className={cn(
                'flex items-start justify-between gap-3 rounded-lg border p-3',
                dueNow && 'border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/20',
                isComplete && !dueNow && 'border-green-200 bg-green-50/40 dark:bg-green-950/20'
              )}
            >
              <div className="flex items-start gap-2 min-w-0">
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    isComplete
                      ? 'bg-green-600 text-white'
                      : dueNow
                        ? 'bg-yellow-600 text-white'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{milestone.label}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>{TRIGGER_LABELS[milestone.trigger] || milestone.trigger}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <Badge variant="outline" className="text-[10px] whitespace-nowrap shrink-0">
                      {STATUS_LABELS[status]}
                    </Badge>
                    {dueNow && (
                      <Badge variant="secondary" className="text-[10px] whitespace-nowrap shrink-0">
                        Dû maintenant
                      </Badge>
                    )}
                    {status === 'held' && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] flex items-center gap-0.5 whitespace-nowrap shrink-0"
                      >
                        <Lock className="h-2.5 w-2.5" />
                        Escrow
                      </Badge>
                    )}
                    {status === 'released' && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] flex items-center gap-0.5 whitespace-nowrap shrink-0"
                      >
                        <Unlock className="h-2.5 w-2.5" />
                        Vendeur
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm">
                  {formatCurrency(milestone.amount, currency)}
                </p>
                <p className="text-xs text-muted-foreground">{milestone.percentage} %</p>
              </div>
            </li>
          );
        })}
      </ol>
      {!compact && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Check className="h-3 w-3" />
          Les jalons « à la commande » sont retenus jusqu&apos;à validation de l&apos;étape.
        </p>
      )}
    </div>
  );
}
