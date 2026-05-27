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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement des paramètres');
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateSettings = useCallback(
    async (partial: Record<string, unknown>) => {
      const next = { ...(settings || {}), ...(partial || {}) } as PlatformSettings;
      const { error: upsertError } = await supabase
        .from('admin_config')
        .upsert(
          { key, settings: next, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
      if (upsertError) {
        setError(upsertError.message);
        return false;
      }
      setSettings(next);
      setError(null);
      return true;
    },
    [key, settings]
  );

  return { loading, error, settings, refresh, updateSettings };
};
