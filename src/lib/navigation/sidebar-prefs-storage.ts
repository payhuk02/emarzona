export const SIDEBAR_PREF_KEYS = {
  pinnedUrls: 'sidebarPinnedUrls',
  recentUrls: 'sidebarRecentUrls',
  collapsedSections: 'sidebarCollapsedSections',
  storesExpanded: 'sidebarStoresExpanded',
  navClickCounts: 'navClickCounts',
  persona: 'sidebarPersona',
  personaOnboarded: 'sidebarPersonaOnboarded',
} as const;

export type SidebarPrefKey = (typeof SIDEBAR_PREF_KEYS)[keyof typeof SIDEBAR_PREF_KEYS];

let activeUserId: string | null = null;

export function setSidebarPrefsUserId(userId: string | null | undefined) {
  activeUserId = userId?.trim() || null;
}

export function getSidebarPrefsUserId(): string | null {
  return activeUserId;
}

function scopedStorageKey(baseKey: string, userId: string | null): string {
  return `${baseKey}:${userId ?? 'guest'}`;
}

export function readSidebarJsonPref<T>(baseKey: string, userId = activeUserId): T | null {
  try {
    const scopedKey = scopedStorageKey(baseKey, userId);
    let raw = localStorage.getItem(scopedKey);

    if (raw === null) {
      const legacy = localStorage.getItem(baseKey);
      if (legacy === null) return null;
      localStorage.setItem(scopedKey, legacy);
      localStorage.removeItem(baseKey);
      raw = legacy;
    }

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeSidebarJsonPref(baseKey: string, value: unknown, userId = activeUserId): void {
  try {
    localStorage.setItem(scopedStorageKey(baseKey, userId), JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

export function hasSidebarJsonPref(baseKey: string, userId = activeUserId): boolean {
  const scopedKey = scopedStorageKey(baseKey, userId);
  if (localStorage.getItem(scopedKey) !== null) return true;
  return localStorage.getItem(baseKey) !== null;
}
