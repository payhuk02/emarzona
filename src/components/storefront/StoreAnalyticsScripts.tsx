/**
 * Composant qui injecte les scripts de tracking analytics pour une boutique
 * Utilise les configurations stockées dans la base de données
 */

import { useEffect } from 'react';
import { PixelsInit } from '@/components/analytics/PixelsInit';
import type { Store } from '@/hooks/useStores';
import { logger } from '@/lib/logger';

interface StoreAnalyticsScriptsProps {
  store: Store;
}

export const StoreAnalyticsScripts = ({ store }: StoreAnalyticsScriptsProps) => {
  useEffect(() => {
    // IMPORTANT (sécurité):
    // Ne jamais exécuter du HTML/JS arbitraire stocké en base en production.
    // Cela ouvre une XSS persistante avec prise de contrôle complète du navigateur.
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

    // Mode dev uniquement: fonctionnalité explicitement activée.
    // Note: même en dev, éviter d’exécuter des scripts non maîtrisés.
    // Ici on se contente d'injecter un marqueur texte pour faciliter le debug.
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

  return (
    <PixelsInit
      googleAnalyticsId={
        store.google_analytics_enabled && store.google_analytics_id
          ? store.google_analytics_id
          : undefined
      }
      facebookPixelId={
        store.facebook_pixel_enabled && store.facebook_pixel_id
          ? store.facebook_pixel_id
          : undefined
      }
      googleTagManagerId={
        store.google_tag_manager_enabled && store.google_tag_manager_id
          ? store.google_tag_manager_id
          : undefined
      }
      tiktokPixelId={
        store.tiktok_pixel_enabled && store.tiktok_pixel_id
          ? store.tiktok_pixel_id
          : undefined
      }
    />
  );
};







