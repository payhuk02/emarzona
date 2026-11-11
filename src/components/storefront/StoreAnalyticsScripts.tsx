/**
 * Scripts analytics boutique — différés après idle + consentement cookies.
 * Ne bloque pas le LCP (pixels tiers hors chemin critique).
 */

import { useEffect, useState } from 'react';
import { PixelsInit } from '@/components/analytics/PixelsInit';
import type { Store } from '@/hooks/useStores';
import { logger } from '@/lib/logger';
import { useDeferredMount } from '@/hooks/useDeferredMount';
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  getStoredCookiePreferences,
  hasAnalyticsCookieConsent,
  hasMarketingCookieConsent,
} from '@/lib/cookie-consent';
import type { CookiePreferences } from '@/types/legal';

interface StoreAnalyticsScriptsProps {
  store: Store;
}

export const StoreAnalyticsScripts = ({ store }: StoreAnalyticsScriptsProps) => {
  const idleReady = useDeferredMount(true, 2500);
  const [prefs, setPrefs] = useState<Partial<CookiePreferences> | null>(() =>
    getStoredCookiePreferences()
  );

  useEffect(() => {
    const refresh = () => setPrefs(getStoredCookiePreferences());
    refresh();
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  useEffect(() => {
    const allowCustomScripts =
      import.meta.env.DEV && import.meta.env.VITE_ALLOW_CUSTOM_TRACKING_SCRIPTS === 'true';

    if (!allowCustomScripts) {
      if (store.custom_scripts_enabled && store.custom_tracking_scripts) {
        logger.warn('Custom tracking scripts are disabled for security reasons.', {
          storeId: (store as unknown as { id?: string }).id,
        });
      }
      return;
    }

    if (store.custom_scripts_enabled && store.custom_tracking_scripts) {
      const marker = document.createElement('meta');
      marker.setAttribute('name', 'emarzona-custom-tracking-scripts');
      marker.setAttribute('content', 'disabled-execution-dev-marker');
      document.head.appendChild(marker);
      return () => {
        marker.remove();
      };
    }
  }, [store]);

  if (!idleReady) return null;

  const allowAnalytics = hasAnalyticsCookieConsent(prefs);
  const allowMarketing = hasMarketingCookieConsent(prefs);

  if (!allowAnalytics && !allowMarketing) return null;

  return (
    <PixelsInit
      googleAnalyticsId={
        allowAnalytics && store.google_analytics_enabled && store.google_analytics_id
          ? store.google_analytics_id
          : undefined
      }
      facebookPixelId={
        allowMarketing && store.facebook_pixel_enabled && store.facebook_pixel_id
          ? store.facebook_pixel_id
          : undefined
      }
      googleTagManagerId={
        allowAnalytics && store.google_tag_manager_enabled && store.google_tag_manager_id
          ? store.google_tag_manager_id
          : undefined
      }
      tiktokPixelId={
        allowMarketing && store.tiktok_pixel_enabled && store.tiktok_pixel_id
          ? store.tiktok_pixel_id
          : undefined
      }
    />
  );
};
