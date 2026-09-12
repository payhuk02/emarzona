import { describe, expect, it } from 'vitest';
import {
  hasPhysicalFeatureAccess,
  requiredPlanForFeature,
} from '@/lib/billing/physical-plan-capabilities';

describe('marketplace.sponsor capability', () => {
  it('requires physical_standard or higher', () => {
    expect(requiredPlanForFeature('marketplace.sponsor')).toBe('physical_standard');
    expect(hasPhysicalFeatureAccess(null, 'marketplace.sponsor')).toBe(false);
    expect(hasPhysicalFeatureAccess('physical_basic', 'marketplace.sponsor')).toBe(false);
    expect(hasPhysicalFeatureAccess('physical_standard', 'marketplace.sponsor')).toBe(true);
    expect(hasPhysicalFeatureAccess('physical_premium', 'marketplace.sponsor')).toBe(true);
  });
});

describe('sponsorship ranking helpers', () => {
  it('caps sponsored slots at 3 and one per store', () => {
    type Row = { id: string; store_id: string; sponsored_at: string };
    const sponsored: Row[] = [
      { id: 'a', store_id: 's1', sponsored_at: '2026-01-01' },
      { id: 'b', store_id: 's1', sponsored_at: '2026-01-02' },
      { id: 'c', store_id: 's2', sponsored_at: '2026-01-03' },
      { id: 'd', store_id: 's3', sponsored_at: '2026-01-04' },
      { id: 'e', store_id: 's4', sponsored_at: '2026-01-05' },
    ];

    const seenStores = new Set<string>();
    const eligible = sponsored.filter(row => {
      if (seenStores.has(row.store_id)) return false;
      seenStores.add(row.store_id);
      return true;
    });

    const feed = eligible.slice(0, 3).map(r => r.id);
    expect(feed).toEqual(['a', 'c', 'd']);
    expect(feed).not.toContain('b');
    expect(feed).not.toContain('e');
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
