import { describe, expect, it } from 'vitest';
import { filterServicesBySearch } from '@/hooks/service/filter-service-products';

describe('filterServicesBySearch', () => {
  const services = [
    { id: '1', product: { name: 'Coaching SEO' } },
    { id: '2', product: { name: 'Audit site web' } },
    { id: '3', product: null },
  ];

  it('keeps every row when the query is empty, including missing product names', () => {
    expect(filterServicesBySearch(services, '')).toHaveLength(3);
    expect(filterServicesBySearch(services, '   ')).toHaveLength(3);
  });

  it('filters by product name without dropping unmatched-null rows only when searching', () => {
    expect(filterServicesBySearch(services, 'seo').map(s => s.id)).toEqual(['1']);
  });
});
