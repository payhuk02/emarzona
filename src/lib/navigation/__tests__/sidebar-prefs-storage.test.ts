import { describe, expect, it, beforeEach } from 'vitest';
import {
  readSidebarJsonPref,
  setSidebarPrefsUserId,
  SIDEBAR_PREF_KEYS,
  writeSidebarJsonPref,
} from '@/lib/navigation/sidebar-prefs-storage';

describe('sidebar-prefs-storage', () => {
  beforeEach(() => {
    localStorage.clear();
    setSidebarPrefsUserId('user-1');
  });

  it('scopes keys per user id', () => {
    writeSidebarJsonPref(SIDEBAR_PREF_KEYS.pinnedUrls, ['a'], 'user-1');
    writeSidebarJsonPref(SIDEBAR_PREF_KEYS.pinnedUrls, ['b'], 'user-2');

    expect(readSidebarJsonPref<string[]>(SIDEBAR_PREF_KEYS.pinnedUrls, 'user-1')).toEqual(['a']);
    expect(readSidebarJsonPref<string[]>(SIDEBAR_PREF_KEYS.pinnedUrls, 'user-2')).toEqual(['b']);
  });

  it('migrates legacy unscoped values on first read', () => {
    localStorage.setItem(SIDEBAR_PREF_KEYS.recentUrls, JSON.stringify(['/dashboard']));

    expect(readSidebarJsonPref<string[]>(SIDEBAR_PREF_KEYS.recentUrls, 'user-1')).toEqual([
      '/dashboard',
    ]);
    expect(localStorage.getItem(`${SIDEBAR_PREF_KEYS.recentUrls}:user-1`)).toBe(
      JSON.stringify(['/dashboard'])
    );
    expect(localStorage.getItem(SIDEBAR_PREF_KEYS.recentUrls)).toBeNull();
  });

  it('does not migrate legacy prefs to a second user', () => {
    localStorage.setItem(SIDEBAR_PREF_KEYS.pinnedUrls, JSON.stringify(['/legacy']));

    expect(readSidebarJsonPref<string[]>(SIDEBAR_PREF_KEYS.pinnedUrls, 'user-1')).toEqual([
      '/legacy',
    ]);
    expect(readSidebarJsonPref<string[]>(SIDEBAR_PREF_KEYS.pinnedUrls, 'user-2')).toBeNull();
  });
});
