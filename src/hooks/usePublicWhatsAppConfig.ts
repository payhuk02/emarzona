import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_WHATSAPP_BASE } from '@/lib/whatsapp/whatsapp-url';

export type PublicWhatsAppConfig = {
  click_url_base: string;
  enabled: boolean;
};

const FALLBACK: PublicWhatsAppConfig = {
  click_url_base: DEFAULT_WHATSAPP_BASE,
  enabled: true,
};

export function usePublicWhatsAppConfig() {
  return useQuery({
    queryKey: ['public-whatsapp-config'],
    queryFn: async (): Promise<PublicWhatsAppConfig> => {
      const { data, error } = await supabase.rpc('get_public_whatsapp_config');
      if (error) return FALLBACK;
      if (!data || typeof data !== 'object') return FALLBACK;

      const raw = data as Record<string, unknown>;
      return {
        click_url_base:
          typeof raw.click_url_base === 'string' && raw.click_url_base.trim()
            ? raw.click_url_base.trim()
            : DEFAULT_WHATSAPP_BASE,
        enabled: raw.enabled !== false,
      };
    },
    staleTime: 5 * 60_000,
  });
}
