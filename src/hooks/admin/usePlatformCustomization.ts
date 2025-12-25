/**
 * Hook pour gérer la personnalisation de la plateforme
 * Centralise toutes les opérations de sauvegarde et chargement
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { logger } from '@/lib/logger';
import { validateSection, validateCustomizationData } from '@/lib/schemas/platform-customization';
import type { PlatformCustomizationSchemaType } from '@/lib/schemas/platform-customization';

// Types pour les structures flexibles (emails, notifications, etc.)
export interface EmailTemplateData {
  subject?: string;
  html_content?: string;
  text_content?: string;
  variables?: Record<string, string>;
}

export interface NotificationTemplateData {
  title?: string;
  message?: string;
  action_url?: string;
  variables?: Record<string, string>;
}

export interface IntegrationConfig {
  enabled?: boolean;
  api_key?: string;
  api_secret?: string;
  webhook_url?: string;
  [key: string]: unknown;
}

export interface PermissionConfig {
  roles?: string[];
  permissions?: string[];
  [key: string]: unknown;
}

export interface ChannelConfig {
  enabled?: boolean;
  api_key?: string;
  [key: string]: unknown;
}

// Type principal basé sur le schéma Zod
export type PlatformCustomizationData = PlatformCustomizationSchemaType;

// Interface legacy pour compatibilité (dépréciée, utiliser PlatformCustomizationData)
export interface PlatformCustomizationDataLegacy {
  design?: {
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      success?: string;
      warning?: string;
      error?: string;
    };
    logo?: {
      light?: string;
      dark?: string;
      favicon?: string;
    };
    typography?: {
      fontFamily?: string;
      fontSize?: Record<string, string>;
    };
    theme?: 'light' | 'dark' | 'auto';
    tokens?: {
      borderRadius?: string;
      shadow?: string;
      spacing?: string;
    };
  };
  settings?: {
    commissions?: {
      platformRate?: number;
      referralRate?: number;
    };
    withdrawals?: {
      minAmount?: number;
      autoApprove?: boolean;
    };
    limits?: {
      maxProducts?: number;
      maxStores?: number;
    };
  };
  content?: {
    texts?: Record<string, string>;
    emails?: Record<string, EmailTemplateData>;
    notifications?: Record<string, NotificationTemplateData>;
  };
  integrations?: {
    payment?: Record<string, IntegrationConfig>;
    shipping?: Record<string, IntegrationConfig>;
    analytics?: Record<string, IntegrationConfig>;
  };
  security?: {
    requireAAL2?: string[];
    permissions?: Record<string, PermissionConfig>;
  };
  features?: {
    enabled?: string[];
    disabled?: string[];
  };
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    channels?: Record<string, ChannelConfig>;
  };
  pages?: Record<string, Record<string, string | number | boolean | null>>;
}

const PREVIEW_STORAGE_KEY = 'platform-customization-preview';
const LAST_SAVED_KEY = 'platform-customization-last-saved';

export const usePlatformCustomization = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [customizationData, setCustomizationData] = useState<PlatformCustomizationData>({});
  const customizationDataRef = useRef<PlatformCustomizationData>({});
  const lastSavedTimestampRef = useRef<string | null>(null);
  const { toast } = useToast();
  
  // Synchroniser le ref avec le state
  useEffect(() => {
    customizationDataRef.current = customizationData;
  }, [customizationData]);

  // Charger les données d'aperçu depuis localStorage au montage
  useEffect(() => {
    try {
      const savedPreview = localStorage.getItem(PREVIEW_STORAGE_KEY);
      if (savedPreview) {
        const previewData = JSON.parse(savedPreview);
        setCustomizationData(previewData);
        logger.debug('Données d\'aperçu restaurées depuis localStorage', { previewData });
      }
    } catch (error) {
      logger.warn('Erreur lors de la restauration des données d\'aperçu', { error });
    }
  }, []);

  // Sauvegarder les données d'aperçu dans localStorage
  const savePreviewToLocalStorage = useCallback((data: PlatformCustomizationData) => {
    try {
      localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(data));
      logger.debug('Données d\'aperçu sauvegardées dans localStorage');
    } catch (error) {
      logger.warn('Erreur lors de la sauvegarde des données d\'aperçu', { error });
    }
  }, []);

  // Charger le timestamp de dernière sauvegarde
  useEffect(() => {
    try {
      const lastSaved = localStorage.getItem(LAST_SAVED_KEY);
      if (lastSaved) {
        lastSavedTimestampRef.current = lastSaved;
      }
    } catch (error) {
      logger.warn('Erreur lors du chargement du timestamp de sauvegarde', { error });
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('settings, updated_at')
        .eq('key', 'customization')
        .maybeSingle();

      if (error) {
        // Si la table n'existe pas encore ou si la clé n'existe pas, on continue avec des données vides
        if (error.code === 'PGRST116' || error.code === '42P01' || error.message.includes('does not exist')) {
          logger.debug('Customization settings not found, using defaults');
          return;
        }
        // Pour les autres erreurs, on log dans Sentry
        logger.error('Error loading customization settings', {
          error: error.message,
          code: error.code,
          level: 'section',
          extra: { error },
        });
        return;
      }
      
      if (data?.settings) {
        // Valider les données chargées
        const validation = validateCustomizationData(data.settings);
        if (!validation.valid) {
          logger.warn('Données de personnalisation invalides', {
            errors: validation.errors,
            level: 'section',
          });
          // Utiliser les données validées si disponibles, sinon les données brutes
          if (validation.data) {
            setCustomizationData(validation.data);
          } else {
        setCustomizationData(data.settings as PlatformCustomizationData);
          }
        } else {
          setCustomizationData(validation.data || data.settings as PlatformCustomizationData);
        }
        
        // Sauvegarder le timestamp de dernière sauvegarde
        if (data.updated_at) {
          lastSavedTimestampRef.current = data.updated_at;
          try {
            localStorage.setItem(LAST_SAVED_KEY, data.updated_at);
          } catch (e) {
            // Ignorer les erreurs localStorage
          }
        }
      }
    } catch (error: unknown) {
      // Logger dans Sentry pour les erreurs inattendues
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error loading customization', {
        error: errorMessage,
        level: 'section',
        extra: { error },
      });
    }
  }, []);

  const save = useCallback(async (section: string, data: unknown) => {
    try {
      setIsSaving(true);
      
      // Valider les données de la section
      const validation = validateSection(section, data);
      if (!validation.valid) {
        const errorMessages = validation.errors.map(e => {
          const fieldName = e.path || 'champ inconnu';
          return `• ${fieldName}: ${e.message}`;
        });
        
        logger.warn('Validation échouée pour la section', {
          section,
          errors: validation.errors,
          level: 'section',
        });
        
        toast({
          title: 'Erreur de validation',
          description: `Données invalides pour "${section}":\n\n${errorMessages.join('\n')}`,
          variant: 'destructive',
          duration: 10000, // Afficher plus longtemps pour lire les erreurs
        });
        setIsSaving(false);
        return false;
      }
      
      // Utiliser le ref pour avoir les données les plus récentes
      const currentData = customizationDataRef.current;
      
      // Fusionner les données existantes avec les nouvelles
      const updatedData = {
        ...currentData,
        [section]: {
          ...currentData?.[section as keyof PlatformCustomizationData],
          ...data,
        },
      };
      
      // Mettre à jour l'état local immédiatement
      setCustomizationData(updatedData);
      
      // Déclencher l'événement immédiatement pour synchronisation temps réel
      // (avant même la sauvegarde en base)
      window.dispatchEvent(new CustomEvent('platform-customization-updated', {
        detail: { customizationData: updatedData }
      }));
      
      // Si on est en mode preview, sauvegarder dans localStorage
      if (previewMode) {
        savePreviewToLocalStorage(updatedData);
        setIsSaving(false);
        return true;
      }
      
      // Vérifier optimistic locking (conflit de modification)
      const { data: currentSettings, error: fetchError } = await supabase
        .from('platform_settings')
        .select('updated_at')
        .eq('key', 'customization')
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Si les données ont été modifiées depuis le dernier chargement
      if (currentSettings?.updated_at && lastSavedTimestampRef.current) {
        if (currentSettings.updated_at !== lastSavedTimestampRef.current) {
          logger.warn('Conflit de modification détecté', {
            lastSaved: lastSavedTimestampRef.current,
            current: currentSettings.updated_at,
            level: 'section',
          });
          toast({
            title: '⚠️ Conflit de modification',
            description: 'Les données ont été modifiées par un autre administrateur. Rechargez la page pour voir les dernières modifications.',
            variant: 'default',
          });
          // Recharger les données
          await load();
          setIsSaving(false);
          return false;
        }
      }
      
      // Sauvegarder dans Supabase
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'customization',
          settings: updatedData,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Mettre à jour le timestamp de dernière sauvegarde
      const newTimestamp = new Date().toISOString();
      lastSavedTimestampRef.current = newTimestamp;
      try {
        localStorage.setItem(LAST_SAVED_KEY, newTimestamp);
      } catch (e) {
        // Ignorer les erreurs localStorage
      }

      // Déclencher l'événement pour synchroniser avec la plateforme
      window.dispatchEvent(new CustomEvent('platform-customization-updated', {
        detail: { customizationData: updatedData }
      }));

      setIsSaving(false);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error saving customization', {
        error: errorMessage,
        section,
        level: 'section',
        extra: { error },
      });
      toast({
        title: 'Erreur de sauvegarde',
        description: error.message || 'Impossible de sauvegarder les modifications',
        variant: 'destructive',
      });
      setIsSaving(false);
      return false;
    }
  }, [toast, previewMode, savePreviewToLocalStorage, load]);

  const saveAll = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Si on est en mode preview, on ne sauvegarde pas en base
      if (previewMode) {
        logger.debug('Preview mode: changes not saved to database');
        setIsSaving(false);
        return true;
      }
      
      // Utiliser le ref pour avoir les données les plus récentes
      const currentData = customizationDataRef.current;
      
      // Valider toutes les données avant sauvegarde
      const validation = validateCustomizationData(currentData);
      if (!validation.valid) {
        const errorMessages = validation.errors.map(e => {
          const fieldName = e.path || 'champ inconnu';
          return `• ${fieldName}: ${e.message}`;
        });
        
        logger.warn('Validation échouée pour toutes les données', {
          errors: validation.errors,
          level: 'section',
        });
        
        toast({
          title: 'Erreur de validation',
          description: `Données invalides détectées:\n\n${errorMessages.join('\n')}`,
          variant: 'destructive',
          duration: 10000, // Afficher plus longtemps pour lire les erreurs
        });
        setIsSaving(false);
        return false;
      }
      
      // Vérifier optimistic locking
      const { data: currentSettings, error: fetchError } = await supabase
        .from('platform_settings')
        .select('updated_at')
        .eq('key', 'customization')
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (currentSettings?.updated_at && lastSavedTimestampRef.current) {
        if (currentSettings.updated_at !== lastSavedTimestampRef.current) {
          logger.warn('Conflit de modification détecté lors de la sauvegarde globale', {
            lastSaved: lastSavedTimestampRef.current,
            current: currentSettings.updated_at,
            level: 'section',
          });
          toast({
            title: '⚠️ Conflit de modification',
            description: 'Les données ont été modifiées par un autre administrateur. Rechargez la page pour voir les dernières modifications.',
            variant: 'default',
          });
          await load();
          setIsSaving(false);
          return false;
        }
      }
      
      // Supabase upsert avec gestion du conflit sur la clé primaire
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'customization',
          settings: validation.data || currentData,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Mettre à jour le timestamp
      const newTimestamp = new Date().toISOString();
      lastSavedTimestampRef.current = newTimestamp;
      try {
        localStorage.setItem(LAST_SAVED_KEY, newTimestamp);
      } catch (e) {
        // Ignorer les erreurs localStorage
      }

      // Nettoyer les données d'aperçu sauvegardées
      try {
        localStorage.removeItem(PREVIEW_STORAGE_KEY);
      } catch (e) {
        // Ignorer les erreurs localStorage
      }

      // Déclencher l'événement pour synchroniser avec la plateforme
      window.dispatchEvent(new CustomEvent('platform-customization-updated', {
        detail: { customizationData: validation.data || currentData }
      }));

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error saving all customization', {
        error: errorMessage,
        level: 'section',
        extra: { error },
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [previewMode, load, toast]);

  const togglePreview = useCallback(() => {
    setPreviewMode(prev => {
      const newMode = !prev;
      
      if (newMode) {
        // Activer le mode aperçu : sauvegarder l'état actuel dans localStorage
        savePreviewToLocalStorage(customizationDataRef.current);
        logger.debug('Mode aperçu activé', { level: 'section' });
      } else {
        // Désactiver le mode aperçu : restaurer depuis localStorage ou nettoyer
        try {
          const savedPreview = localStorage.getItem(PREVIEW_STORAGE_KEY);
          if (savedPreview) {
            const previewData = JSON.parse(savedPreview);
            setCustomizationData(previewData);
            logger.debug('Données d\'aperçu restaurées', { level: 'section' });
          }
        } catch (error) {
          logger.warn('Erreur lors de la restauration des données d\'aperçu', { error, level: 'section' });
        }
      }
      
      return newMode;
    });
  }, [savePreviewToLocalStorage]);

  return {
    customizationData,
    setCustomizationData,
    load,
    save,
    saveAll,
    isSaving,
    previewMode,
    togglePreview,
  };
};

