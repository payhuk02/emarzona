import { describe, expect, it } from 'vitest';
import { applyAdminDomainSearchFilter } from '@/lib/admin/admin-domains-query';

describe('applyAdminDomainSearchFilter', () => {
  it('filters when search has 2+ chars', () => {
    const query = { or: vi.fn().mockReturnValue({ tag: 'filtered' }) };
    applyAdminDomainSearchFilter(query as never, 'shop');
    expect(query.or).toHaveBeenCalledWith(
      'domain.ilike.%shop%,stores.name.ilike.%shop%,stores.slug.ilike.%shop%'
    );
  });

  it('returns query unchanged for short search', () => {
    const query = { or: vi.fn() };
    const result = applyAdminDomainSearchFilter(query as never, 'a');
    expect(result).toBe(query);
    expect(query.or).not.toHaveBeenCalled();
  });
});
