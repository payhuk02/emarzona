/**
 * Hook pour charger et appliquer les personnalisations de pages
 * Permet d'utiliser les valeurs personnalisées dans les composants
 */

import { useMemo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';

export const usePageCustomization = (pageId: string) => {
  const { t } = useTranslation();
  const { customizationData, setCustomizationData } = usePlatformCustomization();
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [localCustomization, setLocalCustomization] = useState<Record<string, any>>({});
  
  // Écouter les changements de personnalisation pour forcer le re-render
  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const updatedData = customEvent.detail?.customizationData;
      
      if (updatedData?.pages?.[pageId]) {
        // Mettre à jour les données locales immédiatement pour synchronisation temps réel
        setLocalCustomization(updatedData.pages[pageId]);
        setUpdateTrigger(prev => prev + 1);
      }
    };
    
    window.addEventListener('platform-customization-updated', handleUpdate);
    return () => {
      window.removeEventListener('platform-customization-updated', handleUpdate);
    };
  }, [pageId]);
  
  // Synchroniser avec les données du hook
  useEffect(() => {
    if (customizationData?.pages?.[pageId]) {
      setLocalCustomization(customizationData.pages[pageId]);
    }
  }, [customizationData, pageId]);
  
  const pageCustomization = useMemo(() => {
    // Priorité : données locales (temps réel) > données du hook (sauvegardées)
    return localCustomization && Object.keys(localCustomization).length > 0
      ? localCustomization
      : customizationData?.pages?.[pageId] || {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localCustomization, customizationData, pageId, updateTrigger]);

  /**
   * Récupère une valeur personnalisée pour un élément de page
   * Si une personnalisation existe, elle est utilisée, sinon on utilise i18n
   * Supporte les clés complètes (ex: 'landing.hero.badge') et les IDs (ex: 'badge')
   */
  const getCustomValue = useCallback((key: string, defaultValue?: string): string => {
    // Essayer avec la clé complète d'abord
    if (pageCustomization[key]) {
      return pageCustomization[key];
    }
    
    // Essayer avec l'ID (dernière partie de la clé après le dernier point)
    const keyParts = key.split('.');
    const elementId = keyParts[keyParts.length - 1];
    if (pageCustomization[elementId]) {
      return pageCustomization[elementId];
    }
    
    // Sinon, utiliser i18n
    const i18nValue = t(key);
    if (i18nValue !== key) {
      return i18nValue;
    }
    
    // En dernier recours, utiliser la valeur par défaut
    return defaultValue || '';
  }, [pageCustomization, t]);

  /**
   * Récupère une valeur personnalisée avec fallback sur i18n
   * Supporte les clés complètes (ex: 'landing.hero.badge') et les IDs (ex: 'badge')
   */
  const getValue = useCallback((key: string, fallbackKey?: string, defaultValue?: string): string => {
    // Essayer avec la clé complète d'abord
    if (pageCustomization[key]) {
      return pageCustomization[key];
    }
    
    // Essayer avec l'ID (dernière partie de la clé après le dernier point)
    const keyParts = key.split('.');
    const elementId = keyParts[keyParts.length - 1];
    if (pageCustomization[elementId]) {
      return pageCustomization[elementId];
    }
    
    // Essayer la clé de fallback
    if (fallbackKey) {
      if (pageCustomization[fallbackKey]) {
        return pageCustomization[fallbackKey];
      }
      // Essayer avec l'ID du fallback
      const fallbackParts = fallbackKey.split('.');
      const fallbackId = fallbackParts[fallbackParts.length - 1];
      if (pageCustomization[fallbackId]) {
        return pageCustomization[fallbackId];
      }
    }
    
    // Utiliser i18n
    const i18nValue = t(key);
    if (i18nValue !== key) {
      return i18nValue;
    }
    
    // Utiliser la valeur par défaut
    return defaultValue || '';
  }, [pageCustomization, t]);

  /**
   * Récupère une couleur personnalisée
   */
  const getColor = useCallback((key: string, defaultColor?: string): string => {
    return pageCustomization[key] || defaultColor || '#000000';
  }, [pageCustomization]);

  /**
   * Récupère une URL d'image personnalisée
   */
  const getImage = useCallback((key: string, defaultImage?: string): string | undefined => {
    return pageCustomization[key] || defaultImage;
  }, [pageCustomization]);

  return {
    pageCustomization,
    getCustomValue,
    getValue,
    getColor,
    getImage,
  };
};

