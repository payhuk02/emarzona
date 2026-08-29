import type { ServiceOrderMilestoneRow } from '@/lib/payments/service-order-milestone-flow';
import { orderHasProjectMilestones } from '@/lib/payments/service-order-milestone-flow';
import type { ServiceProjectMilestoneComputed } from '@/lib/service/service-project-milestones';

export type CustomerOrderMilestoneContext = {
  remaining_amount?: number | null;
  payment_status?: string | null;
  metadata?: Record<string, unknown> | null;
};

export function orderHasMilestonePaymentContext(
  order: CustomerOrderMilestoneContext,
  milestones: ServiceOrderMilestoneRow[]
): boolean {
  const metadata =
    order.metadata && typeof order.metadata === 'object' && !Array.isArray(order.metadata)
      ? order.metadata
      : {};
  return milestones.length > 0 || orderHasProjectMilestones(metadata);
}

export function orderMilestoneBalanceDue(milestones: ServiceOrderMilestoneRow[]): boolean {
  return milestones.some(
    row => row.trigger_type === 'delivery_approved' && row.status === 'awaiting_payment'
  );
}

export function orderMilestoneBalanceBlocked(
  order: CustomerOrderMilestoneContext,
  milestones: ServiceOrderMilestoneRow[]
): boolean {
  const remaining = Number(order.remaining_amount ?? 0);
  return (
    orderHasMilestonePaymentContext(order, milestones) &&
    !orderMilestoneBalanceDue(milestones) &&
    remaining > 0 &&
    order.payment_status !== 'completed'
  );
}

export function canPayMilestoneBalance(
  order: CustomerOrderMilestoneContext,
  milestones: ServiceOrderMilestoneRow[]
): boolean {
  const remaining = Number(order.remaining_amount ?? 0);
  if (remaining <= 0 || order.payment_status === 'completed') return false;
  if (!orderHasMilestonePaymentContext(order, milestones)) {
    return remaining > 0 && order.payment_status === 'partial';
  }
  return orderMilestoneBalanceDue(milestones);
}

export function milestonesToTimelineRows(
  milestones: ServiceOrderMilestoneRow[]
): ServiceProjectMilestoneComputed[] {
  return milestones.map(row => ({
    id: row.id,
    sort_order: row.sort_order,
    label: row.label,
    percentage: row.percentage,
    amount: row.amount,
    trigger: row.trigger_type === 'delivery_approved' ? 'delivery_approved' : 'order_placed',
  }));
}
