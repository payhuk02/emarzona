import { describe, expect, it } from 'vitest';
import {
  canPayMilestoneBalance,
  orderHasMilestonePaymentContext,
  orderMilestoneBalanceBlocked,
  orderMilestoneBalanceDue,
} from '../customer-order-milestones';
import type { ServiceOrderMilestoneRow } from '@/lib/payments/service-order-milestone-flow';

const baseMilestones: ServiceOrderMilestoneRow[] = [
  {
    id: 'm1',
    order_id: 'o1',
    sort_order: 0,
    label: 'Démarrage',
    percentage: 50,
    amount: 50000,
    trigger_type: 'order_placed',
    status: 'held',
    paid_at: null,
    released_at: null,
  },
  {
    id: 'm2',
    order_id: 'o1',
    sort_order: 1,
    label: 'Livraison',
    percentage: 50,
    amount: 50000,
    trigger_type: 'delivery_approved',
    status: 'pending',
    paid_at: null,
    released_at: null,
  },
];

describe('customer-order-milestones', () => {
  it('detects milestone payment context from metadata or rows', () => {
    expect(
      orderHasMilestonePaymentContext({ metadata: { project_milestones_enabled: true } }, [])
    ).toBe(true);
    expect(orderHasMilestonePaymentContext({}, baseMilestones)).toBe(true);
  });

  it('blocks balance until delivery milestone is awaiting payment', () => {
    expect(orderMilestoneBalanceDue(baseMilestones)).toBe(false);
    expect(
      orderMilestoneBalanceBlocked(
        {
          remaining_amount: 50000,
          payment_status: 'partial',
          metadata: { project_milestones_enabled: true },
        },
        baseMilestones
      )
    ).toBe(true);

    const dueMilestones = baseMilestones.map((row, index) =>
      index === 1 ? { ...row, status: 'awaiting_payment' as const } : row
    );
    expect(orderMilestoneBalanceDue(dueMilestones)).toBe(true);
    expect(
      canPayMilestoneBalance(
        {
          remaining_amount: 50000,
          payment_status: 'partial',
          metadata: { project_milestones_enabled: true },
        },
        dueMilestones
      )
    ).toBe(true);
  });
});
