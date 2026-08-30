import { describe, expect, it } from 'vitest';
import {
  amountDueAtProjectCheckout,
  computeServiceProjectMilestoneAmounts,
  DEFAULT_SERVICE_PROJECT_MILESTONES,
  projectMilestonesEnabled,
  serviceCheckoutMilestonesEnabled,
  toMilestoneOrderFields,
  validateServiceProjectMilestones,
} from '../service-project-milestones';

describe('validateServiceProjectMilestones', () => {
  it('accepts default 50/50 split', () => {
    expect(validateServiceProjectMilestones(DEFAULT_SERVICE_PROJECT_MILESTONES)).toEqual([]);
  });

  it('rejects when percentages do not sum to 100', () => {
    const errors = validateServiceProjectMilestones([
      { label: 'A', percentage: 40, trigger: 'order_placed' },
      { label: 'B', percentage: 40, trigger: 'delivery_approved' },
    ]);
    expect(errors.some(msg => /100/.test(msg))).toBe(true);
  });
});

describe('computeServiceProjectMilestoneAmounts', () => {
  it('allocates remainder on last milestone', () => {
    const rows = computeServiceProjectMilestoneAmounts(100_000, DEFAULT_SERVICE_PROJECT_MILESTONES);
    expect(rows[0].amount + rows[1].amount).toBe(100_000);
    expect(rows[0].amount).toBe(50_000);
  });
});

describe('amountDueAtProjectCheckout', () => {
  it('sums order_placed triggers only', () => {
    const rows = computeServiceProjectMilestoneAmounts(100_000, [
      { label: 'Start', percentage: 30, trigger: 'order_placed' },
      { label: 'End', percentage: 70, trigger: 'delivery_approved' },
    ]);
    expect(amountDueAtProjectCheckout(rows)).toBe(30_000);
  });
});

describe('projectMilestonesEnabled', () => {
  it('requires project checkout and delivery_secured', () => {
    expect(
      projectMilestonesEnabled(
        { payment_type: 'delivery_secured', use_project_milestones: true },
        true
      )
    ).toBe(true);
    expect(
      projectMilestonesEnabled(
        { payment_type: 'delivery_secured', use_project_milestones: true },
        false
      )
    ).toBe(false);
    expect(projectMilestonesEnabled({ payment_type: 'full' }, true)).toBe(false);
  });
});

describe('serviceCheckoutMilestonesEnabled', () => {
  const opts = {
    payment_type: 'delivery_secured' as const,
    use_project_milestones: true,
  };

  it('enables milestones for project checkout', () => {
    expect(serviceCheckoutMilestonesEnabled(opts, { isProjectCheckout: true })).toBe(true);
  });

  it('enables milestones for fixed-price buy now', () => {
    expect(serviceCheckoutMilestonesEnabled(opts, { isFixedPriceBuyNow: true })).toBe(true);
  });

  it('accepts string "true" for use_project_milestones', () => {
    expect(
      serviceCheckoutMilestonesEnabled(
        { payment_type: 'delivery_secured', use_project_milestones: 'true' },
        { isProjectCheckout: true }
      )
    ).toBe(true);
  });

  it('rejects when neither project nor fixed-price buy now', () => {
    expect(serviceCheckoutMilestonesEnabled(opts, {})).toBe(false);
  });
});

describe('toMilestoneOrderFields', () => {
  it('maps remaining balance for milestone checkout', () => {
    expect(toMilestoneOrderFields({ amountToPay: 50_000, remainingAmount: 50_000 })).toEqual({
      payment_type: 'delivery_secured',
      percentage_paid: 50_000,
      remaining_amount: 50_000,
    });
  });

  it('returns null when fully paid at checkout', () => {
    expect(toMilestoneOrderFields({ amountToPay: 100_000, remainingAmount: 0 })).toBeNull();
  });
});
