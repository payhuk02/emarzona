import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  HEARTBEAT_INTERVAL_MS,
  consumeUnflushedDurationMs,
  shouldTrackPath,
  touchSessionActiveMs,
  trackPlatformVisitorEvent,
} from '@/lib/analytics/platform-visitor-tracking';

/**
 * Tracks platform visits globally: pages, devices, geo, time on site.
 * Mount once near the app root (inside Router + Auth).
 */
export function PlatformVisitorTracker() {
  const location = useLocation();
  const { user } = useAuth();
  const lastPathRef = useRef<string | null>(null);
  const lastTickRef = useRef<number>(Date.now());
  const visibleRef = useRef(
    typeof document === 'undefined' ? true : document.visibilityState === 'visible'
  );

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      if (visibleRef.current) {
        touchSessionActiveMs(now - lastTickRef.current);
      }
      lastTickRef.current = now;
    };

    const onVisibility = () => {
      tick();
      visibleRef.current = document.visibilityState === 'visible';
      lastTickRef.current = Date.now();
    };

    const heartbeat = window.setInterval(() => {
      tick();
      if (!visibleRef.current) return;
      if (!shouldTrackPath(window.location.pathname)) return;
      const duration = consumeUnflushedDurationMs();
      if (duration < 1000) return;
      void trackPlatformVisitorEvent({
        event_type: 'session_heartbeat',
        page_path: window.location.pathname,
        page_url: window.location.href,
        duration_ms: duration,
        user_id: user?.id ?? null,
      });
    }, HEARTBEAT_INTERVAL_MS);

    const onPageHide = () => {
      tick();
      if (!shouldTrackPath(window.location.pathname)) return;
      const duration = consumeUnflushedDurationMs();
      void trackPlatformVisitorEvent({
        event_type: 'session_end',
        page_path: window.location.pathname,
        page_url: window.location.href,
        duration_ms: duration,
        user_id: user?.id ?? null,
      });
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [user?.id]);

  useEffect(() => {
    const path = location.pathname;
    if (!shouldTrackPath(path)) {
      lastPathRef.current = path;
      return;
    }
    if (lastPathRef.current === path) return;
    lastPathRef.current = path;

    void trackPlatformVisitorEvent({
      event_type: 'page_view',
      page_path: path,
      page_url: window.location.href,
      referrer: document.referrer || null,
      duration_ms: 0,
      user_id: user?.id ?? null,
      event_data: { search: location.search || null },
    });
  }, [location.pathname, location.search, user?.id]);

  return null;
}
