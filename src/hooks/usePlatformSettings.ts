import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PlatformSettings = {
  require_aal2_routes?: string[];
  [key: string]: unknown;
};

export const usePlatformSettings = (key: string = 'admin') => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PlatformSettings>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('admin_config')
        .select('settings')
        .eq('key', key)
        .maybeSingle();
      if (error) throw error;
      setSettings((data?.settings as PlatformSettings) || {});
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateSettings = useCallback(async (partial: Record<string, unknown>) => {
    const next = { ...(settings || {}), ...(partial || {}) } as PlatformSettings;
    const { error } = await supabase
      .from('admin_config')
      .upsert({ key, settings: next, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (!error) setSettings(next);
    return !error;
  }, [key, settings]);

  return { loading, error, settings, refresh, updateSettings };
};

/**
 * Hook pour gérer les paramètres globaux de la plateforme
 * Gère CRUD de la table platform_settings (singleton)
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { logger } from '@/lib/logger';

// UUID fixe du singleton settings
const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

export interface PlatformSettings {
  id: string;
  platform_commission_rate: number;
  referral_commission_rate: number;
  min_withdrawal_amount: number;
  auto_approve_withdrawals: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

interface UsePlatformSettingsReturn {
  settings: PlatformSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<PlatformSettings>) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export const usePlatformSettings = (): UsePlatformSettingsReturn => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Récupérer les paramètres de la plateforme
   */
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', SETTINGS_ID)
        .single();

      if (fetchError) {
        logger.error('Error fetching platform settings:', fetchError);
        throw fetchError;
      }

      if (!data) {
        throw new Error('Aucun paramètre trouvé');
      }

      setSettings(data as PlatformSettings);
      logger.log('Platform settings loaded:', data);
    } catch (err: any) {
      const errorMsg = err?.message || 'Erreur lors du chargement des paramètres';
      setError(errorMsg);
      logger.error('Failed to fetch platform settings:', err);
      
      toast({
        title: 'Erreur',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mettre à jour les paramètres de la plateforme
   */
  const updateSettings = async (updates: Partial<PlatformSettings>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer l'ID utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Préparer les données de mise à jour
      const updateData = {
        ...updates,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };

      // Retirer les champs non modifiables
      delete (updateData as any).id;
      delete (updateData as any).created_at;

      logger.log('Updating platform settings:', updateData);

      const { data, error: updateError } = await supabase
        .from('platform_settings')
        .update(updateData)
        .eq('id', SETTINGS_ID)
        .select()
        .single();

      if (updateError) {
        logger.error('Error updating platform settings:', updateError);
        throw updateError;
      }

      if (!data) {
        throw new Error('Aucune donnée retournée après la mise à jour');
      }

      setSettings(data as PlatformSettings);
      logger.log('Platform settings updated successfully:', data);

      toast({
        title: 'Paramètres sauvegardés',
        description: 'Les paramètres ont été mis à jour avec succès.',
      });

      return true;
    } catch (err: any) {
      const errorMsg = err?.message || 'Erreur lors de la mise à jour des paramètres';
      setError(errorMsg);
      logger.error('Failed to update platform settings:', err);

      toast({
        title: 'Erreur de sauvegarde',
        description: errorMsg,
        variant: 'destructive',
      });

      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Rafraîchir les paramètres
   */
  const refetch = async () => {
    await fetchSettings();
  };

  // Charger les paramètres au montage
  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch,
  };
};

