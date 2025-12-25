/**
 * Hook: useAffiliateProducts
 * Description: Récupère tous les produits avec affiliation activée (tous stores confondus)
 * Utilisé pour la sélection de produit lors de la création de lien d'affiliation
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface AffiliateProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url?: string;
  store_id: string;
  store: {
    id: string;
    name: string;
    slug: string;
  };
  settings: {
    commission_rate: number;
    commission_type: 'percentage' | 'fixed';
    fixed_commission_amount?: number;
  };
}

export const useAffiliateProducts = (searchQuery?: string) => {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('product_affiliate_settings')
        .select(`
          *,
          product:products!inner(
            id,
            name,
            slug,
            price,
            image_url,
            is_active,
            store:stores!inner(
              id,
              name,
              slug
            )
          )
        `)
        .eq('affiliate_enabled', true)
        .eq('product.is_active', true);

      // Recherche par nom ou slug du produit
      if (searchQuery && searchQuery.trim()) {
        query = query.or(`product.name.ilike.%${searchQuery}%,product.slug.ilike.%${searchQuery}%`);
      }

      // Trier par created_at de la table principale (product_affiliate_settings)
      // On ne peut pas trier directement par product.created_at dans Supabase
      const { data, error } = await query.order('created_at', { ascending: false }).limit(100);

      if (error) throw error;

      // Transformer les données
      const transformedProducts: AffiliateProduct[] = (data || []).map((item: any) => ({
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        image_url: item.product.image_url,
        store_id: item.product.store.id,
        store: {
          id: item.product.store.id,
          name: item.product.store.name,
          slug: item.product.store.slug,
        },
        settings: {
          commission_rate: item.commission_rate,
          commission_type: item.commission_type,
          fixed_commission_amount: item.fixed_commission_amount,
        },
      }));

      setProducts(transformedProducts);
    } catch (error: any) {
      logger.error('Error fetching affiliate products:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de charger les produits',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    refetch: fetchProducts,
  };
};

