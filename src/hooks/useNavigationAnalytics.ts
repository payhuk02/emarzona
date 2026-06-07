const NAV_CLICK_COUNTS_KEY = 'navClickCounts';
const MAX_TRACKED_URLS = 200;

type ClickCounts = Record<string, number>;

function readCounts(): ClickCounts {
  try {
    const raw = localStorage.getItem(NAV_CLICK_COUNTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ClickCounts;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeCounts(counts: ClickCounts) {
  try {
    const entries = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, MAX_TRACKED_URLS);
    localStorage.setItem(NAV_CLICK_COUNTS_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    /* ignore quota errors */
  }
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
