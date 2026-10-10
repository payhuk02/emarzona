/**
 * Total admin unread for platform contact chat (nav badge).
 */
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchAdminContactUnreadTotal } from '@/lib/support/platform-contact';
import { logger } from '@/lib/logger';

const POLL_MS = 45_000;

export function useAdminContactUnreadCount(enabled = true) {
  const location = useLocation();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const total = await fetchAdminContactUnreadTotal();
      setCount(total);
    } catch (err) {
      logger.warn('Admin contact unread fetch failed', { error: err });
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_MS);
    const onFocus = () => void refresh();
    const onLocal = () => void refresh();
    window.addEventListener('focus', onFocus);
    window.addEventListener('emarzona:contact-unread', onLocal);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('emarzona:contact-unread', onLocal);
    };
  }, [enabled, refresh]);

  // Refresh on route change (nav badge stays in sync after reading inbox)
  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, location.pathname, refresh]);

  return { count, refresh };
}

/** Notify admin chrome to refresh contact unread badge. */
export function notifyAdminContactUnreadChanged() {
  window.dispatchEvent(new Event('emarzona:contact-unread'));
}
