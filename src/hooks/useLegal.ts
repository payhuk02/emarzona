/**
 * Hooks pour gérer le système légal et RGPD
 * Date: 27 octobre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { 
  LegalDocument, 
  UserConsent, 
  CookiePreferences, 
  GDPRRequest,
  LegalDocumentType,
  GDPRRequestType
} from '@/types/legal';

// Hook: Obtenir un document légal
export const useLegalDocument = (
  type: LegalDocumentType,
  language: 'fr' | 'en' | 'es' | 'pt' = 'fr'
) => {
  return useQuery({
    queryKey: ['legal-document', type, language],
    queryFn: async (): Promise<LegalDocument | null> => {
      const { data, error } = await supabase.rpc('get_latest_legal_document', {
        doc_type: type,
        doc_language: language
      });

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    },
  });
};

// Hook: Enregistrer consentement
export const useRecordConsent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      documentType,
      documentVersion,
      ipAddress,
      userAgent,
      consentMethod = 'settings'
    }: {
      userId: string;
      documentType: string;
      documentVersion: string;
      ipAddress?: string;
      userAgent?: string;
      consentMethod?: string;
    }) => {
      const { data, error } = await supabase.rpc('record_user_consent', {
        p_user_id: userId,
        p_document_type: documentType,
        p_document_version: documentVersion,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_consent_method: consentMethod
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-consents'] });
    },
  });
};

// Hook: Obtenir les consentements utilisateur
export const useUserConsents = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-consents', userId],
    queryFn: async (): Promise<UserConsent[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', userId)
        .order('consented_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

// Hook: Gérer les préférences cookies
export const useCookiePreferences = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['cookie-preferences', userId],
    queryFn: async (): Promise<CookiePreferences | null> => {
      if (!userId) {
        // Vérifier localStorage pour utilisateurs non connectés
        const saved = localStorage.getItem('cookiePreferences');
        return saved ? JSON.parse(saved) : null;
      }

      try {
        const { data, error } = await supabase
          .from('cookie_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(); // Utiliser maybeSingle au lieu de single pour éviter erreur si pas de ligne

        // PGRST116 = aucune ligne trouvée (normal si l'utilisateur n'a pas encore configuré)
        // Ignorer les erreurs 404 et PGRST116
        if (error) {
          // Codes d'erreur à ignorer (table inexistante ou aucune ligne)
          if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('404') || error.message?.includes('does not exist')) {
            return null;
          }
          // Pour les autres erreurs, log mais ne pas throw
          logger.warn('Erreur lors de la récupération des préférences cookies', { error, userId });
          return null;
        }
        
        return data || null;
      } catch (err: unknown) {
        const errorObj = err as { code?: string; message?: string };
        // Gérer les erreurs inattendues (table n'existe pas, etc.)
        if (errorObj?.code === '42P01' || errorObj?.message?.includes('does not exist') || errorObj?.message?.includes('404')) {
          return null; // Table n'existe pas, retourner null silencieusement
        }
        logger.warn('Erreur inattendue lors de la récupération des préférences cookies', { error: err, userId });
        return null;
      }
    },
    enabled: !!userId,
  });
};

// Hook: Mettre à jour préférences cookies
export const useUpdateCookiePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      preferences
    }: {
      userId?: string;
      preferences: Partial<CookiePreferences>;
    }) => {
      if (!userId) {
        // Sauvegarder en localStorage
        localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
        return preferences;
      }

      try {
        const { data, error } = await supabase
          .from('cookie_preferences')
          .upsert({
            user_id: userId,
            ...preferences,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })
          .select()
          .maybeSingle(); // Utiliser maybeSingle pour éviter erreur si pas de ligne

        // Si la table n'existe pas, sauvegarder en localStorage comme fallback
        if (error && (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('404'))) {
          logger.warn('Table cookie_preferences n\'existe pas, sauvegarde en localStorage', { userId });
          localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
          return preferences as Partial<CookiePreferences>;
        }

        if (error) {
          // Pour les autres erreurs, fallback localStorage
          logger.warn('Erreur lors de la sauvegarde des préférences cookies', { error, userId });
          localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
          return preferences as Partial<CookiePreferences>;
        }
        
        return data || preferences as Partial<CookiePreferences>;
      } catch (err: unknown) {
        const errorObj = err as { code?: string; message?: string };
        // Fallback: sauvegarder en localStorage si erreur Supabase
        if (errorObj?.code === '42P01' || errorObj?.message?.includes('does not exist') || errorObj?.message?.includes('404')) {
          // Table n'existe pas, utiliser localStorage silencieusement
          localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
          return preferences as Partial<CookiePreferences>;
        }
        logger.warn('Erreur lors de la sauvegarde des préférences cookies, fallback localStorage', { error: err, userId });
        localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
        return preferences as Partial<CookiePreferences>;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cookie-preferences', variables.userId] });
    },
  });
};

// Hook: Créer demande RGPD
export const useCreateGDPRRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      requestType,
      notes
    }: {
      userId: string;
      requestType: GDPRRequestType;
      notes?: string;
    }) => {
      const { data, error} = await supabase
        .from('gdpr_requests')
        .insert({
          user_id: userId,
          request_type: requestType,
          notes,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gdpr-requests'] });
    },
  });
};

// Hook: Obtenir demandes RGPD utilisateur
export const useGDPRRequests = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['gdpr-requests', userId],
    queryFn: async (): Promise<GDPRRequest[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('gdpr_requests')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

