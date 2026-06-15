export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
}

export function formatSearchShortcutKey(): string {
  return isApplePlatform() ? '⌘K' : 'Ctrl+K';
}

export function formatSidebarToggleShortcutKey(): string {
  return isApplePlatform() ? '⌘B' : 'Ctrl+B';
}

export function isSafeInternalNavUrl(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}
