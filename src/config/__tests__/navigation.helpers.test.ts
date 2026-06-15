import { describe, expect, it } from 'vitest';
import { isNavItemActive } from '@/config/navigation.helpers';

describe('isNavItemActive', () => {
  describe('exact mode', () => {
    it('matches pathname only', () => {
      expect(isNavItemActive('/dashboard/products', '/dashboard/products', '')).toBe(true);
      expect(isNavItemActive('/dashboard/products', '/dashboard/products/new', '')).toBe(false);
    });

    it('matches pathname and query', () => {
      expect(
        isNavItemActive(
          '/dashboard/digital-products?view=analytics',
          '/dashboard/digital-products',
          '?view=analytics'
        )
      ).toBe(true);
      expect(
        isNavItemActive(
          '/dashboard/digital-products?view=analytics',
          '/dashboard/digital-products',
          ''
        )
      ).toBe(false);
    });
  });

  describe('prefix mode', () => {
    it('matches child routes without highlighting parent prefixes', () => {
      expect(isNavItemActive('/dashboard/products', '/dashboard/products/new', '', 'prefix')).toBe(
        true
      );
      expect(isNavItemActive('/dashboard', '/dashboard/products', '', 'prefix')).toBe(false);
      expect(isNavItemActive('/dashboard', '/dashboard', '', 'prefix')).toBe(true);
    });

    it('requires query match when item url includes search params', () => {
      expect(
        isNavItemActive('/marketplace?search=true', '/marketplace', '?search=true', 'prefix')
      ).toBe(true);
      expect(isNavItemActive('/marketplace?search=true', '/marketplace', '', 'prefix')).toBe(false);
    });

    it('does not treat root as prefix of every path', () => {
      expect(isNavItemActive('/', '/marketplace', '', 'prefix')).toBe(false);
      expect(isNavItemActive('/', '/', '', 'prefix')).toBe(true);
    });
  });
});
