import { describe, expect, it } from 'vitest';
import {
  hasPhysicalFeatureAccess,
  requiredPlanForFeature,
} from '@/lib/billing/physical-plan-capabilities';
import { isSponsorshipVisibleInFeed } from '@/lib/sponsorship/marketplace-sponsorship';

describe('marketplace.sponsor capability', () => {
  it('requires physical_standard or higher', () => {
    expect(requiredPlanForFeature('marketplace.sponsor')).toBe('physical_standard');
    expect(hasPhysicalFeatureAccess(null, 'marketplace.sponsor')).toBe(false);
    expect(hasPhysicalFeatureAccess('physical_basic', 'marketplace.sponsor')).toBe(false);
    expect(hasPhysicalFeatureAccess('physical_standard', 'marketplace.sponsor')).toBe(true);
    expect(hasPhysicalFeatureAccess('physical_premium', 'marketplace.sponsor')).toBe(true);
  });
});

describe('sponsorship display visibility', () => {
  it('shows only active campaigns in public feed', () => {
    expect(isSponsorshipVisibleInFeed('active')).toBe(true);
    expect(isSponsorshipVisibleInFeed('paused')).toBe(false);
    expect(isSponsorshipVisibleInFeed('cancelled')).toBe(false);
    expect(isSponsorshipVisibleInFeed('expired')).toBe(false);
    expect(isSponsorshipVisibleInFeed('pending_payment')).toBe(false);
    expect(isSponsorshipVisibleInFeed('rejected')).toBe(false);
    expect(isSponsorshipVisibleInFeed(null)).toBe(false);
  });
});

describe('sponsorship ranking helpers', () => {
  it('promotes every active sponsored product before organic (no slot cap)', () => {
    type Row = {
      id: string;
      store_id: string;
      sponsored_at: string | null;
      feed_sponsored: boolean;
    };
    const rows: Row[] = [
      { id: 'organic-new', store_id: 's0', sponsored_at: null, feed_sponsored: false },
      { id: 'a', store_id: 's1', sponsored_at: '2026-01-01', feed_sponsored: true },
      { id: 'b', store_id: 's1', sponsored_at: '2026-01-02', feed_sponsored: true },
      { id: 'c', store_id: 's2', sponsored_at: '2026-01-03', feed_sponsored: true },
      { id: 'd', store_id: 's3', sponsored_at: '2026-01-04', feed_sponsored: true },
      { id: 'e', store_id: 's4', sponsored_at: '2026-01-05', feed_sponsored: true },
      { id: 'organic-old', store_id: 's9', sponsored_at: null, feed_sponsored: false },
    ];

    const sorted = [...rows].sort((a, b) => {
      if (a.feed_sponsored !== b.feed_sponsored) {
        return a.feed_sponsored ? -1 : 1;
      }
      if (a.feed_sponsored && b.feed_sponsored) {
        return (a.sponsored_at ?? '').localeCompare(b.sponsored_at ?? '');
      }
      return a.id.localeCompare(b.id);
    });

    expect(sorted.map(r => r.id)).toEqual(['a', 'b', 'c', 'd', 'e', 'organic-new', 'organic-old']);
  });

  it('sorts feed_sponsored products before organic ones', () => {
    const rows = [
      { id: 'organic-new', feed_sponsored: false, created_at: '2026-09-12' },
      { id: 'boost-1', feed_sponsored: true, created_at: '2026-01-01' },
      { id: 'organic-old', feed_sponsored: false, created_at: '2026-01-02' },
      { id: 'boost-2', feed_sponsored: true, created_at: '2026-02-01' },
    ];

    const sorted = [...rows].sort((a, b) => {
      if (a.feed_sponsored !== b.feed_sponsored) {
        return a.feed_sponsored ? -1 : 1;
      }
      return b.created_at.localeCompare(a.created_at);
    });

    expect(sorted.map(r => r.id)).toEqual(['boost-2', 'boost-1', 'organic-new', 'organic-old']);
  });
});
