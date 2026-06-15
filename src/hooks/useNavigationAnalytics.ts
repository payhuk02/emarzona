import {
  readSidebarJsonPref,
  SIDEBAR_PREF_KEYS,
  writeSidebarJsonPref,
} from '@/lib/navigation/sidebar-prefs-storage';

const MAX_TRACKED_URLS = 200;

type ClickCounts = Record<string, number>;

function readCounts(): ClickCounts {
  return readSidebarJsonPref<ClickCounts>(SIDEBAR_PREF_KEYS.navClickCounts) ?? {};
}

function writeCounts(counts: ClickCounts) {
  const entries = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, MAX_TRACKED_URLS);
  writeSidebarJsonPref(SIDEBAR_PREF_KEYS.navClickCounts, Object.fromEntries(entries));
}

/** Record a sidebar / command palette navigation click. */
export function recordNavClick(url: string) {
  const path = url.split('?')[0];
  const counts = readCounts();
  counts[path] = (counts[path] ?? 0) + 1;
  writeCounts(counts);
}

export function getNavClickCount(url: string): number {
  return readCounts()[url.split('?')[0]] ?? 0;
}

export function sortEntriesByNavFrequency<T extends { url: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const diff = getNavClickCount(b.url) - getNavClickCount(a.url);
    if (diff !== 0) return diff;
    return a.url.localeCompare(b.url);
  });
}

export const NAV_CLICK_COUNTS_KEY = SIDEBAR_PREF_KEYS.navClickCounts;
