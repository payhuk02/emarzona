/**
 * Hook: useAffiliateLinks
 * Description: Gestion des liens d'affiliation
 * Date: 25/10/2025
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  AffiliateLink, 
  CreateAffiliateLinkForm,
  LinkFilters 
} from '@/types/affiliate';
import { logger } from '@/lib/logger';

export const useAffiliateLinks = (affiliateId?: string, filters?: LinkFilters) => {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLinks = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('affiliate_links')
        .select(`
          *,
          product:products!inner(
            id,
            name,
            slug,
            price,
            image_url,
            store:stores!inner(name, slug)
          ),
          affiliate:affiliates!inner(display_name, affiliate_code)
        `)
        .order('created_at', { ascending: false });

      if (affiliateId) {
        query = query.eq('affiliate_id', affiliateId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.product_id) {
        query = query.eq('product_id', filters.product_id);
      }

      if (filters?.store_id) {
        query = query.eq('store_id', filters.store_id);
      }

      if (filters?.search) {
        query = query.or(`link_code.ilike.%${filters.search}%,full_url.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLinks(data || []);
    } catch (error: any) {
      logger.error('Error fetching affiliate links:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createLink = async (
    affiliateId: string,
    formData: CreateAffiliateLinkForm
  ): Promise<AffiliateLink | null> => {
    try {
      // Vérifier que le produit a l'affiliation activée
      const { data: settingsData, error: settingsError } = await supabase
        .from('product_affiliate_settings')
        .select(`
          *,
          product:products!inner(slug, store_id, name)
        `)
        .eq('product_id', formData.product_id)
        .eq('affiliate_enabled', true)
        .single();

      if (settingsError) throw new Error('Ce produit n\'accepte pas l\'affiliation');

      // Récupérer le code de l'affilié
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('affiliate_code')
        .eq('id', affiliateId)
        .single();

      if (affiliateError) throw affiliateError;

      // Générer le code du lien
      const { data: codeData, error: codeError } = await supabase.rpc('generate_affiliate_link_code', {
        p_affiliate_code: affiliateData.affiliate_code,
        p_product_slug: settingsData.product.slug,
      });

      if (codeError) throw codeError;

      // Générer l'URL complète
      const baseUrl = window.location.origin;
      const storeSlug = settingsData.product.store_id; // TODO: Adapter selon votre routing
      const productUrl = `${baseUrl}/${storeSlug}/products/${settingsData.product.slug}`;
      const fullUrl = `${productUrl}?aff=${codeData}`;

      // Créer le lien
      const { data, error } = await supabase
        .from('affiliate_links')
        .insert({
          affiliate_id: affiliateId,
          product_id: formData.product_id,
          store_id: settingsData.product.store_id,
          link_code: codeData,
          full_url: fullUrl,
          utm_source: formData.utm_source,
          utm_medium: formData.utm_medium,
          utm_campaign: formData.utm_campaign,
          custom_parameters: formData.custom_parameters,
        })
        .select(`
          *,
          product:products(id, name, slug, price, image_url)
        `)
        .single();

      if (error) throw error;

      toast({
        title: 'Lien créé ! 🔗',
        description: `Lien pour "${settingsData.product.name}"`,
      });

      await fetchLinks();
      return data;
    } catch (error: any) {
      logger.error('Error creating affiliate link:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const pauseLink = async (linkId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('affiliate_links')
        .update({ status: 'paused' })
        .eq('id', linkId);

      if (error) throw error;

      toast({ 
        title: 'Lien mis en pause',
        description: 'Les clics ne seront plus comptabilisés' 
      });
      
      await fetchLinks();
      return true;
    } catch (error: any) {
      logger.error('Error pausing link:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const activateLink = async (linkId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('affiliate_links')
        .update({ status: 'active' })
        .eq('id', linkId);

      if (error) throw error;

      toast({ 
        title: 'Lien activé ✅',
        description: 'Le lien est à nouveau opérationnel' 
      });
      
      await fetchLinks();
      return true;
    } catch (error: any) {
      logger.error('Error activating link:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteLink = async (linkId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('affiliate_links')
        .update({ status: 'deleted' })
        .eq('id', linkId);

      if (error) throw error;

      toast({ 
        title: 'Lien supprimé',
        description: 'Le lien a été désactivé' 
      });
      
      await fetchLinks();
      return true;
    } catch (error: any) {
      logger.error('Error deleting link:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const copyLink = async (link: AffiliateLink): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(link.full_url);
      
      toast({
        title: 'Lien copié ! 📋',
        description: 'Le lien a été copié dans le presse-papier',
      });
      
      return true;
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le lien',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    if (affiliateId || filters) {
      fetchLinks();
    }
  }, [affiliateId, JSON.stringify(filters)]);

  return {
    links,
    loading,
    createLink,
    pauseLink,
    activateLink,
    deleteLink,
    copyLink,
    refetch: fetchLinks,
  };
};

/**
 * Hook: useLinkStats
 * Description: Statistiques d'un lien spécifique
 */
export const useLinkStats = (linkId?: string) => {
  const [stats, setStats] = useState<{
    total_clicks: number;
    total_sales: number;
    total_revenue: number;
    total_commission: number;
    conversion_rate: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!linkId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('affiliate_links')
          .select('total_clicks, total_sales, total_revenue, total_commission')
          .eq('id', linkId)
          .single();

        if (error) throw error;

        const conversion_rate = data.total_clicks > 0 
          ? (data.total_sales / data.total_clicks) * 100 
          : 0;

        setStats({
          ...data,
          conversion_rate,
        });
      } catch (error) {
        logger.error('Error fetching link stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [linkId]);

  return { stats, loading };
};

