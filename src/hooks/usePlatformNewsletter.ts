import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSubscribePlatformNewsletter() {
  return useMutation({
    mutationFn: async ({
      email,
      source = 'footer',
      locale = 'fr',
    }: {
      email: string;
      source?: string;
      locale?: string;
    }) => {
      const normalized = email.trim().toLowerCase();
      if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        throw new Error('Adresse e-mail invalide.');
      }

      const { data, error } = await supabase.rpc('subscribe_platform_newsletter', {
        p_email: normalized,
        p_source: source,
        p_locale: locale,
      });

      if (error) throw error;

      const result = data as { ok?: boolean; error?: string; already_subscribed?: boolean } | null;
      if (result && result.ok === false && result.error) {
        throw new Error(result.error);
      }

      return result;
    },
  });
}
