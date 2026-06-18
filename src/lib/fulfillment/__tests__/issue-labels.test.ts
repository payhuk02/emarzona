import { describe, expect, it } from 'vitest';
import { getFulfillmentIssueLabel } from '@/lib/fulfillment/issue-labels';

describe('fulfillment issue-labels', () => {
  it('returns French label for known issue types', () => {
    expect(getFulfillmentIssueLabel('digital_license_missing')).toBe('Licence digitale manquante');
  });

  it('falls back to raw issue type', () => {
    expect(getFulfillmentIssueLabel('custom_issue')).toBe('custom_issue');
  });
});
