/**
 * Charge la configuration admin du Studio IA (enabled, modèle, presets).
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_STUDIO_PRESETS, type StudioPreset } from '@/lib/images/studio-presets';

export interface ImageEnhancerAdminSettings {
  enabled: boolean;
  model: string;
  defaultInstruction: string;
  presets?: StudioPreset[];
  inferenceMaxPx?: number;
}

const DEFAULTS: ImageEnhancerAdminSettings = {
  enabled: true,
  model: 'google/gemini-3.1-flash-image-preview',
  defaultInstruction: DEFAULT_STUDIO_PRESETS[0].instruction,
  presets: DEFAULT_STUDIO_PRESETS,
  inferenceMaxPx: 2048,
};

function mergePresets(adminPresets?: StudioPreset[]): StudioPreset[] {
  if (!adminPresets?.length) return DEFAULT_STUDIO_PRESETS;
  return adminPresets.filter(p => p.label && p.instruction);
}

export function useImageEnhancerSettings() {
  const [settings, setSettings] = useState<ImageEnhancerAdminSettings>(DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc('get_ai_management_settings');
        if (error) throw error;
        const raw = (data as { imageEnhancer?: Partial<ImageEnhancerAdminSettings> })
          ?.imageEnhancer;
        if (!cancelled && raw) {
          setSettings({
            ...DEFAULTS,
            ...raw,
            presets: mergePresets(raw.presets),
          });
        }
      } catch {
        if (!cancelled) setSettings(DEFAULTS);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    settings,
    presets: settings.presets ?? DEFAULT_STUDIO_PRESETS,
    isLoading,
    isEnabled: settings.enabled !== false,
  };
}
