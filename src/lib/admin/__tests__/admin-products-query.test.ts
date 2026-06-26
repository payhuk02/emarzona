import { describe, expect, it } from 'vitest';
import { applyAdminProductSearchFilter } from '@/lib/admin/admin-products-query';

describe('applyAdminProductSearchFilter', () => {
  it('returns query unchanged when search is shorter than 2 chars', () => {
    const base = { tag: 'base' };
    const query = { or: vi.fn().mockReturnValue({ tag: 'filtered' }) };
    const result = applyAdminProductSearchFilter(query as never, 'a');
    expect(result).toBe(query);
    expect(query.or).not.toHaveBeenCalled();
    expect(base.tag).toBe('base');
  });

  it('applies ilike filter on name and store name', () => {
    const filtered = { tag: 'filtered' };
    const query = { or: vi.fn().mockReturnValue(filtered) };
    const result = applyAdminProductSearchFilter(query as never, '  robe  ');
    expect(query.or).toHaveBeenCalledWith('name.ilike.%robe%,stores.name.ilike.%robe%');
    expect(result).toBe(filtered);
  });
});
