import { describe, expect, it } from 'vitest';
import { parseServiceProjectOrderMetadata } from '../service-project-order-summary';

describe('parseServiceProjectOrderMetadata', () => {
  it('returns null for appointment orders', () => {
    expect(parseServiceProjectOrderMetadata({ fulfillment_mode: 'appointment' })).toBeNull();
  });

  it('parses project package and brief answers', () => {
    const summary = parseServiceProjectOrderMetadata({
      fulfillment_mode: 'project',
      delivery_package_id: 'pkg-1',
      package_name: 'Standard',
      delivery_days: 7,
      extras_total: 5000,
      server_quoted_total: 100000,
      brief_answers: { 'brief-project': 'Logo + charte', rush: true },
    });

    expect(summary?.packageName).toBe('Standard');
    expect(summary?.deliveryDays).toBe(7);
    expect(summary?.extrasTotal).toBe(5000);
    expect(summary?.briefAnswers['brief-project']).toBe('Logo + charte');
    expect(summary?.briefAnswers.rush).toBe(true);
  });
});
