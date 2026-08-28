import { describe, expect, it } from 'vitest';
import { orderHasProjectMilestones } from '../service-order-milestone-flow';

describe('orderHasProjectMilestones', () => {
  it('detects milestone flag in order metadata', () => {
    expect(orderHasProjectMilestones({ project_milestones_enabled: true })).toBe(true);
    expect(orderHasProjectMilestones({ project_milestones_enabled: false })).toBe(false);
    expect(orderHasProjectMilestones(null)).toBe(false);
  });
});
