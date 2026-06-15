import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getNavClickCount,
  recordNavClick,
  sortEntriesByNavFrequency,
} from '@/hooks/useNavigationAnalytics';
import { setSidebarPrefsUserId } from '@/lib/navigation/sidebar-prefs-storage';

describe('useNavigationAnalytics', () => {
  beforeEach(() => {
    setSidebarPrefsUserId('test-user');
    vi.stubGlobal('localStorage', {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null;
      },
      setItem(key: string, value: string) {
        this.store[key] = value;
      },
      removeItem(key: string) {
        delete this.store[key];
      },
    });
  });

  it('increments click counts per URL path', () => {
    recordNavClick('/dashboard/products');
    recordNavClick('/dashboard/products');
    recordNavClick('/dashboard/orders');
    expect(getNavClickCount('/dashboard/products')).toBe(2);
    expect(getNavClickCount('/dashboard/orders')).toBe(1);
  });

  it('sorts entries by frequency descending', () => {
    recordNavClick('/b');
    recordNavClick('/a');
    recordNavClick('/a');
    const sorted = sortEntriesByNavFrequency([
      { url: '/b', title: 'B' },
      { url: '/a', title: 'A' },
      { url: '/c', title: 'C' },
    ]);
    expect(sorted.map(e => e.url)).toEqual(['/a', '/b', '/c']);
  });
});
