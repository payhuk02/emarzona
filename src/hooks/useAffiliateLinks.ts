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
  LinkFilters,
  PaginationParams
} from '@/types/affiliate';
import { logger } from '@/lib/logger';
import { handleSupabaseError, AffiliateErrors } from '@/lib/affiliate-errors';

/**
 * Fonction de fallback pour générer le code de lien côté client
 * Utilisée temporairement si la fonction RPC n'est pas disponible
 * TODO: Retirer cette fonction une fois la migration SQL exécutée
 */
async function generateLinkCodeClientSide(affiliateCode: string, productSlug: string): Promise<string> {
  try {
    // Générer un UUID v4 côté client
    const uuid = crypto.randomUUID();
    
    // Créer la chaîne d'entrée
    const input = `${affiliateCode}-${productSlug}-${uuid}`;
    
    // Utiliser l'API Web Crypto native pour créer un hash SHA256
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convertir le hash en hexadécimal
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Prendre les 12 premiers caractères et les mettre en majuscules
    return hashHex.substring(0, 12).toUpperCase();
  } catch (error) {
    logger.error('Error in client-side link code generation:', error);
    // Fallback ultime : générer un code aléatoire simple
    const randomPart = Math.random().toString(36).substring(2, 14).toUpperCase();
    return randomPart.padEnd(12, '0').substring(0, 12);
  }
}

export const useAffiliateLinks = (
  affiliateId?: string, 
  filters?: LinkFilters,
  pagination?: PaginationParams
) => {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(pagination?.page || 1);
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 20);
  const { toast } = useToast();

  const fetchLinks = async (currentPage: number = page) => {
    try {
      setLoading(true);

      // Compter le total
      let countQuery = supabase
        .from('affiliate_links')
        .select('*', { count: 'exact', head: true });

      if (affiliateId) {
        countQuery = countQuery.eq('affiliate_id', affiliateId);
      }

      if (filters?.status) {
        countQuery = countQuery.eq('status', filters.status);
      }

      if (filters?.product_id) {
        countQuery = countQuery.eq('product_id', filters.product_id);
      }

      if (filters?.store_id) {
        countQuery = countQuery.eq('store_id', filters.store_id);
      }

      if (filters?.search) {
        countQuery = countQuery.or(`link_code.ilike.%${filters.search}%,full_url.ilike.%${filters.search}%`);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      setTotal(count || 0);

      // Requête principale avec pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

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
        .order('created_at', { ascending: false })
        .range(from, to);

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

      if (error) {
        const affiliateError = handleSupabaseError(error);
        throw affiliateError;
      }

      setLinks(data || []);
      setPage(currentPage);
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error fetching affiliate links:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
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
          product:products!inner(
            id,
            slug,
            store_id,
            name,
            store:stores!inner(id, slug)
          )
        `)
        .eq('product_id', formData.product_id)
        .eq('affiliate_enabled', true)
        .single();

      if (settingsError || !settingsData) {
        logger.error('Error fetching product affiliate settings:', { settingsError, productId: formData.product_id });
        throw AffiliateErrors.productAffiliateDisabled(formData.product_id);
      }

      // Vérifier que les données nécessaires sont présentes
      if (!settingsData.product || !settingsData.product.slug || !settingsData.product.store_id) {
        logger.error('Invalid product data in settings:', { settingsData });
        throw AffiliateErrors.productNotFound(formData.product_id);
      }

      // Vérifier si un lien existe déjà pour ce produit et cet affilié
      const { data: existingLink, error: existingLinkError } = await supabase
        .from('affiliate_links')
        .select('id, status, full_url, link_code')
        .eq('affiliate_id', affiliateId)
        .eq('product_id', formData.product_id)
        .maybeSingle(); // Utiliser maybeSingle au lieu de single pour éviter erreur si aucun lien

      // Si un lien existe et n'est pas supprimé, on ne peut pas en créer un nouveau
      if (existingLink && existingLink.status !== 'deleted') {
        // Inclure l'URL du lien existant dans l'erreur pour améliorer l'UX
        throw AffiliateErrors.linkAlreadyExists(formData.product_id, existingLink.full_url);
      }

      // Récupérer le code de l'affilié
      const { data: affiliateData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('affiliate_code')
        .eq('id', affiliateId)
        .single();

      if (affiliateError || !affiliateData) {
        throw AffiliateErrors.affiliateNotFound(affiliateId);
      }

      // Générer le code du lien
      // Solution temporaire : génération côté client si la fonction RPC échoue
      let linkCode: string;
      
      try {
        const { data: codeData, error: codeError } = await supabase.rpc('generate_affiliate_link_code', {
          p_affiliate_code: affiliateData.affiliate_code,
          p_product_slug: settingsData.product.slug,
        });

        if (codeError) {
          // Si l'erreur est liée à la fonction manquante (404) ou à pgcrypto (42883),
          // utiliser la génération côté client comme fallback
          if (codeError.code === '42883' || codeError.code === 'PGRST301' || codeError.message?.includes('digest')) {
            logger.warn('RPC function unavailable, using client-side code generation as fallback:', codeError);
            linkCode = await generateLinkCodeClientSide(affiliateData.affiliate_code, settingsData.product.slug);
          } else {
            logger.error('Error generating affiliate link code:', codeError);
            throw handleSupabaseError(codeError);
          }
        } else {
          // La fonction RPC retourne directement le TEXT
          // Gérer le cas où Supabase pourrait retourner un tableau ou une valeur directe
          if (Array.isArray(codeData)) {
            linkCode = codeData[0] as string;
          } else if (typeof codeData === 'string') {
            linkCode = codeData;
          } else {
            logger.error('Invalid link code returned from RPC:', { codeData, type: typeof codeData });
            throw AffiliateErrors.databaseError(new Error('Impossible de générer le code du lien d\'affiliation'));
          }

          if (!linkCode || linkCode.trim() === '') {
            logger.error('Empty link code returned from RPC:', { codeData, linkCode });
            throw AffiliateErrors.databaseError(new Error('Le code du lien généré est vide'));
          }
        }
      } catch (error: unknown) {
        // Fallback vers génération côté client en cas d'erreur réseau ou autre
        if (error instanceof Error && (error.message.includes('404') || error.message.includes('digest'))) {
          logger.warn('Using client-side code generation as fallback due to error:', error);
          linkCode = await generateLinkCodeClientSide(affiliateData.affiliate_code, settingsData.product.slug);
        } else {
          throw error;
        }
      }

      // Générer l'URL complète avec le slug du store
      const baseUrl = window.location.origin;
      const storeSlug = settingsData.product.store?.slug || settingsData.product.store_id;
      const productUrl = `${baseUrl}/stores/${storeSlug}/products/${settingsData.product.slug}`;
      const fullUrl = `${productUrl}?aff=${linkCode}`;

      // Créer le lien
      const { data, error } = await supabase
        .from('affiliate_links')
        .insert({
          affiliate_id: affiliateId,
          product_id: formData.product_id,
          store_id: settingsData.product.store_id,
          link_code: linkCode,
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

      if (error) {
        throw handleSupabaseError(error);
      }

      toast({
        title: 'Lien créé ! 🔗',
        description: `Lien pour "${settingsData.product.name}"`,
      });

      await fetchLinks(page);
      return data;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error creating affiliate link:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
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

      if (error) {
        throw handleSupabaseError(error);
      }

      toast({ 
        title: 'Lien mis en pause',
        description: 'Les clics ne seront plus comptabilisés' 
      });
      
      await fetchLinks(page);
      return true;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error pausing link:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
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

      if (error) {
        throw handleSupabaseError(error);
      }

      toast({ 
        title: 'Lien activé ✅',
        description: 'Le lien est à nouveau opérationnel' 
      });
      
      await fetchLinks(page);
      return true;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error activating link:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
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

      if (error) {
        throw handleSupabaseError(error);
      }

      toast({ 
        title: 'Lien supprimé',
        description: 'Le lien a été désactivé' 
      });
      
      await fetchLinks(page);
      return true;
    } catch (error: unknown) {
      const affiliateError = handleSupabaseError(error);
      logger.error('Error deleting link:', affiliateError);
      toast({
        title: 'Erreur',
        description: affiliateError.getUserMessage(),
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
      fetchLinks(page);
    }
  }, [affiliateId, JSON.stringify(filters), page, pageSize]);

  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchLinks(newPage);
    }
  };

  const nextPage = () => {
    if (hasNextPage) {
      goToPage(page + 1);
    }
  };

  const previousPage = () => {
    if (hasPreviousPage) {
      goToPage(page - 1);
    }
  };

  return {
    links,
    loading,
    // Pagination
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    // Navigation
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    // CRUD
    createLink,
    pauseLink,
    activateLink,
    deleteLink,
    copyLink,
    refetch: () => fetchLinks(page),
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

