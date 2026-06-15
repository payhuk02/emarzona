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
  const trimmed = url.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return false;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith('/javascript:') || lower.includes('://')) return false;

  try {
    const parsed = new URL(trimmed, 'https://navigation.invalid');
    return parsed.origin === 'https://navigation.invalid' && parsed.pathname.startsWith('/');
  } catch {
    return false;
  }
}
