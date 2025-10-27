/**
 * Composant pour initialiser automatiquement les pixels configurés
 * S'utilise dans les pages de cours pour tracker les événements
 * Date : 27 octobre 2025
 */

import { useEffect } from 'react';
import {
  initGoogleAnalytics,
  initFacebookPixel,
  initGoogleTagManager,
  initTikTokPixel,
} from '@/lib/analytics/initPixels';

interface PixelsInitProps {
  googleAnalyticsId?: string | null;
  facebookPixelId?: string | null;
  googleTagManagerId?: string | null;
  tiktokPixelId?: string | null;
}

/**
 * Composant invisible qui initialise les pixels au montage
 * Usage: <PixelsInit googleAnalyticsId="G-..." facebookPixelId="123..." />
 */
export const PixelsInit = ({
  googleAnalyticsId,
  facebookPixelId,
  googleTagManagerId,
  tiktokPixelId,
}: PixelsInitProps) => {
  useEffect(() => {
    // Initialiser Google Analytics
    if (googleAnalyticsId) {
      initGoogleAnalytics(googleAnalyticsId);
    }

    // Initialiser Facebook Pixel
    if (facebookPixelId) {
      initFacebookPixel(facebookPixelId);
    }

    // Initialiser Google Tag Manager
    if (googleTagManagerId) {
      initGoogleTagManager(googleTagManagerId);
    }

    // Initialiser TikTok Pixel
    if (tiktokPixelId) {
      initTikTokPixel(tiktokPixelId);
    }
  }, [googleAnalyticsId, facebookPixelId, googleTagManagerId, tiktokPixelId]);

  // Composant invisible
  return null;
};

