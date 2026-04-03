/**
 * Composant qui injecte les scripts de tracking analytics pour une boutique
 * Utilise les configurations stockées dans la base de données
 */

import { useEffect } from 'react';
import { PixelsInit } from '@/components/analytics/PixelsInit';
import type { Store } from '@/hooks/useStores';

interface StoreAnalyticsScriptsProps {
  store: Store;
}

export const StoreAnalyticsScripts = ({ store }: StoreAnalyticsScriptsProps) => {
  useEffect(() => {
    // Injecter les scripts personnalisés si activés
    if (store.custom_scripts_enabled && store.custom_tracking_scripts) {
      const scriptElement = document.createElement('div');
      scriptElement.innerHTML = store.custom_tracking_scripts;
      document.head.appendChild(scriptElement);

      // Exécuter les scripts contenus
      const scripts = scriptElement.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;
        document.head.appendChild(newScript);
        document.head.removeChild(scriptElement);
      });
    }
  }, [store.custom_scripts_enabled, store.custom_tracking_scripts]);

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







