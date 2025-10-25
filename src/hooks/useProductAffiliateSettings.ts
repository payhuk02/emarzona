/**
 * Hook: useProductAffiliateSettings
 * Description: Gestion des paramètres d'affiliation par produit
 * Date: 25/10/2025
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ProductAffiliateSettings, 
  ProductAffiliateSettingsForm 
} from '@/types/affiliate';
import { logger } from '@/lib/logger';

export const useProductAffiliateSettings = (productId?: string) => {
  const [settings, setSettings] = useState<ProductAffiliateSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    if (!productId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('product_affiliate_settings')
        .select(`
          *,
          product:products!inner(id, name, slug, price, image_url)
        `)
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setSettings(data || null);
    } catch (error: any) {
      logger.error('Error fetching product affiliate settings:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateSettings = async (
    productId: string,
    storeId: string,
    formData: ProductAffiliateSettingsForm
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('product_affiliate_settings')
        .upsert({
          product_id: productId,
          store_id: storeId,
          ...formData,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Paramètres d\'affiliation enregistrés',
      });

      await fetchSettings();
      return true;
    } catch (error: any) {
      logger.error('Error creating/updating affiliate settings:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleAffiliateEnabled = async (productId: string, enabled: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('product_affiliate_settings')
        .update({ affiliate_enabled: enabled })
        .eq('product_id', productId);

      if (error) throw error;

      toast({
        title: enabled ? 'Affiliation activée ✅' : 'Affiliation désactivée',
        description: enabled 
          ? 'Les affiliés peuvent maintenant promouvoir ce produit' 
          : 'Le programme d\'affiliation est désactivé pour ce produit',
      });

      await fetchSettings();
      return true;
    } catch (error: any) {
      logger.error('Error toggling affiliate enabled:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteSettings = async (productId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('product_affiliate_settings')
        .delete()
        .eq('product_id', productId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Paramètres d\'affiliation supprimés',
      });

      await fetchSettings();
      return true;
    } catch (error: any) {
      logger.error('Error deleting affiliate settings:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [productId]);

  return {
    settings,
    loading,
    hasSettings: !!settings,
    isEnabled: settings?.affiliate_enabled || false,
    createOrUpdateSettings,
    toggleAffiliateEnabled,
    deleteSettings,
    refetch: fetchSettings,
  };
};

/**
 * Hook: useStoreAffiliateProducts
 * Description: Liste des produits avec affiliation activée pour un store
 */
export const useStoreAffiliateProducts = (storeId?: string) => {
  const [products, setProducts] = useState<ProductAffiliateSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('product_affiliate_settings')
        .select(`
          *,
          product:products!inner(id, name, slug, price, image_url, is_active)
        `)
        .eq('store_id', storeId)
        .eq('affiliate_enabled', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error: any) {
      logger.error('Error fetching store affiliate products:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [storeId]);

  return {
    products,
    loading,
    refetch: fetchProducts,
  };
};

