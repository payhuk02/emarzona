/**
 * Hook: useAffiliateShortLinks
 * Description: Gestion des liens courts d'affiliation
 * Date: 31/01/2025
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AffiliateShortLink, CreateShortLinkForm } from '@/types/affiliate';
import { logger } from '@/lib/logger';
import { handleSupabaseError, AffiliateErrors, AffiliateError, AffiliateErrorCode } from '@/lib/affiliate-errors';

/**
 * Hook pour gérer les liens courts d'un lien d'affiliation spécifique
 */
export const useAffiliateShortLinks = (affiliateLinkId?: string) => {
  const [shortLinks, setShortLinks] = useState<AffiliateShortLink[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchShortLinks = useCallback(async () => {
    if (!affiliateLinkId) {
      setShortLinks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('affiliate_short_links')
        .select('*')
        .eq('affiliate_link_id', affiliateLinkId)
        .order('created_at', { ascending: false });

      // Si la table n'existe pas encore (404), retourner une liste vide silencieusement
      if (error) {
        // Erreur 404 ou table non trouvée = migration pas encore exécutée
        if (error.code === 'PGRST301' || error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('404')) {
          logger.debug('Table affiliate_short_links n\'existe pas encore. Migration à exécuter.');
          setShortLinks([]);
          return;
        }
        throw error;
      }

      setShortLinks(data || []);
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error fetching short links:', affiliateError);
      // Ne pas afficher de toast si c'est juste que la table n'existe pas
      if (!(error && typeof error === 'object' && 'code' in error && 
            (error.code === 'PGRST301' || error.code === '42P01'))) {
        toast({
          title: 'Erreur',
          description: affiliateError.getUserMessage(),
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [affiliateLinkId, toast]);

  useEffect(() => {
    fetchShortLinks();
  }, [fetchShortLinks]);

  /**
   * Créer un nouveau lien court
   */
  const createShortLink = useCallback(async (
    formData: CreateShortLinkForm
  ): Promise<AffiliateShortLink | null> => {
    try {
      // Récupérer le lien d'affiliation pour obtenir l'URL cible
      const { data: affiliateLink, error: linkError } = await supabase
        .from('affiliate_links')
        .select('id, full_url, affiliate_id')
        .eq('id', formData.affiliate_link_id)
        .single();

      if (linkError || !affiliateLink) {
        throw AffiliateErrors.linkNotFound(formData.affiliate_link_id);
      }

      // Vérifier si un alias personnalisé est fourni et s'il est disponible
      if (formData.custom_alias) {
        const { data: existingAlias, error: aliasError } = await supabase
          .from('affiliate_short_links')
          .select('id')
          .eq('custom_alias', formData.custom_alias.toLowerCase())
          .maybeSingle(); // Utiliser maybeSingle pour éviter erreur si aucun alias

        // Si la table n'existe pas encore, on peut continuer
        if (aliasError && aliasError.code !== 'PGRST301' && aliasError.code !== '42P01' && !aliasError.message?.includes('does not exist') && !aliasError.message?.includes('404')) {
          throw handleSupabaseError(aliasError);
        }

        if (!aliasError && existingAlias) {
          throw new AffiliateError(
            'Cet alias est déjà utilisé',
            AffiliateErrorCode.VALIDATION_ERROR,
            400,
            { custom_alias: formData.custom_alias }
          );
        }
      }

      // Générer le code court
      let shortCode: string;
      
      if (formData.custom_alias) {
        // Utiliser l'alias personnalisé comme code
        shortCode = formData.custom_alias.toLowerCase();
      } else {
        // Générer un code aléatoire via RPC
        const codeLength = formData.short_code_length || 6;
        const { data: codeData, error: codeError } = await supabase.rpc('generate_short_link_code', {
          p_length: codeLength,
        });

        if (codeError) {
          // Fallback côté client si RPC échoue
          logger.warn('RPC function unavailable, using client-side code generation:', codeError);
          shortCode = await generateShortCodeClientSide(codeLength);
        } else {
          shortCode = Array.isArray(codeData) ? codeData[0] : (codeData as string);
        }
      }

      // Créer le lien court
      const { data, error } = await supabase
        .from('affiliate_short_links')
        .insert({
          affiliate_link_id: formData.affiliate_link_id,
          affiliate_id: affiliateLink.affiliate_id,
          short_code: shortCode,
          target_url: affiliateLink.full_url,
          custom_alias: formData.custom_alias?.toLowerCase() || null,
          expires_at: formData.expires_at || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        // Si la table n'existe pas encore (404), informer l'utilisateur
        if (error.code === 'PGRST301' || error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('404')) {
          throw new AffiliateError(
            'La fonctionnalité de liens courts n\'est pas encore disponible. Veuillez exécuter la migration SQL: 20250131_affiliate_short_links.sql',
            AffiliateErrorCode.DATABASE_ERROR,
            503,
            { migration: '20250131_affiliate_short_links.sql' }
          );
        }
        throw handleSupabaseError(error);
      }

      toast({
        title: 'Lien court créé ! 🎉',
        description: `Votre lien court : ${shortCode}`,
      });

      // Rafraîchir la liste
      await fetchShortLinks();

      return data;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error creating short link:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
      return null;
    }
  }, [fetchShortLinks, toast]);

  /**
   * Supprimer un lien court
   */
  const deleteShortLink = useCallback(async (shortLinkId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('affiliate_short_links')
        .delete()
        .eq('id', shortLinkId);

      if (error) throw error;

      toast({
        title: 'Lien court supprimé',
        description: 'Le lien court a été supprimé avec succès',
      });

      await fetchShortLinks();
      return true;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error deleting short link:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchShortLinks, toast]);

  /**
   * Désactiver/Activer un lien court
   */
  const toggleShortLink = useCallback(async (shortLinkId: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('affiliate_short_links')
        .update({ is_active: isActive })
        .eq('id', shortLinkId);

      if (error) throw error;

      toast({
        title: isActive ? 'Lien court activé' : 'Lien court désactivé',
        description: `Le lien court a été ${isActive ? 'activé' : 'désactivé'} avec succès`,
      });

      await fetchShortLinks();
      return true;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error toggling short link:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchShortLinks, toast]);

  return {
    shortLinks,
    loading,
    createShortLink,
    deleteShortLink,
    toggleShortLink,
    refetch: fetchShortLinks,
  };
};

/**
 * Fonction de fallback pour générer un code court côté client
 */
async function generateShortCodeClientSide(length: number = 6): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclut 0, O, I, 1
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

