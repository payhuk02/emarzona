/**
 * Epic 3.6.2 — Timeline visuelle pour le portail client
 */

import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderTimelineStep } from '@/lib/customer/order-timeline';

interface OrderTimelineProps {
  steps: OrderTimelineStep[];
  className?: string;
}

function StepIcon({ status }: { status: OrderTimelineStep['status'] }) {
  if (status === 'done') {
    return <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" aria-hidden />;
  }
  if (status === 'current') {
    return <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" aria-hidden />;
  }
  if (status === 'error') {
    return <XCircle className="h-5 w-5 text-destructive shrink-0" aria-hidden />;
  }
  return <Circle className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden />;
}

export function OrderTimeline({ steps, className }: OrderTimelineProps) {
  if (steps.length === 0) return null;

  return (
    <ol className={cn('space-y-4', className)} aria-label="Suivi de commande">
      {steps.map((step, index) => (
        <li key={step.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <StepIcon status={step.status} />
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-px flex-1 min-h-[1.5rem] mt-1',
                  step.status === 'done' ? 'bg-green-300' : 'bg-border'
                )}
              />
            )}
          </div>
          <div className="pb-2 min-w-0">
            <p
              className={cn(
                'font-medium text-sm',
                step.status === 'error' && 'text-destructive',
                step.status === 'current' && 'text-primary'
              )}
            >
              {step.label}
            </p>
            {step.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
