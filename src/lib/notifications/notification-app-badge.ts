/** Nombre max affiché sur le badge PWA (aligné sur NotificationBell). */
export const NOTIFICATION_BADGE_MAX = 99;

export function formatNotificationBadgeCount(count: number): number | null {
  if (!Number.isFinite(count) || count <= 0) return null;
  return Math.min(Math.floor(count), NOTIFICATION_BADGE_MAX);
}

type NavigatorWithBadge = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

/**
 * Met à jour le badge sur l'icône PWA (Badging API) si disponible.
 */
export async function syncNotificationAppBadge(unreadCount: number): Promise<void> {
  if (typeof navigator === 'undefined') return;

  const nav = navigator as NavigatorWithBadge;
  const badgeValue = formatNotificationBadgeCount(unreadCount);

  try {
    if (badgeValue === null) {
      if (typeof nav.clearAppBadge === 'function') {
        await nav.clearAppBadge();
      }
      return;
    }

    if (typeof nav.setAppBadge === 'function') {
      await nav.setAppBadge(badgeValue);
    }
  } catch {
    // Badging API non supportée ou refusée — ignorer
  }
}

export const EMARZONA_UNREAD_COUNT_MESSAGE = 'EMARZONA_UNREAD_COUNT';

export type EmarzonaUnreadCountMessage = {
  type: typeof EMARZONA_UNREAD_COUNT_MESSAGE;
  unreadCount?: number;
};

export function isEmarzonaUnreadCountMessage(data: unknown): data is EmarzonaUnreadCountMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as EmarzonaUnreadCountMessage).type === EMARZONA_UNREAD_COUNT_MESSAGE
  );
}
