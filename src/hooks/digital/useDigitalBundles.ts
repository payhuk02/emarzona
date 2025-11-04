/**
 * Digital Product Bundles Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les bundles de produits digitaux
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface DigitalProductBundle {
  id: string;
  store_id: string;
  product_id: string;
  name: string;
  description?: string;
  short_description?: string;
  slug: string;
  bundle_price: number;
  currency: string;
  promotional_price?: number;
  discount_percentage?: number;
  digital_product_ids: string[];
  image_url?: string;
  is_featured: boolean;
  display_order: number;
  is_active: boolean;
  is_draft: boolean;
  total_sales: number;
  total_revenue: number;
  total_downloads: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Relations
  products?: Array<{
    id: string;
    name: string;
    price: number;
    image_url?: string;
  }>;
}

export interface CreateBundleData {
  store_id: string;
  name: string;
  description?: string;
  short_description?: string;
  slug: string;
  bundle_price: number;
  currency?: string;
  promotional_price?: number;
  digital_product_ids: string[];
  image_url?: string;
  is_featured?: boolean;
  display_order?: number;
}

export interface UpdateBundleData extends Partial<CreateBundleData> {
  is_active?: boolean;
  is_draft?: boolean;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useDigitalBundles - Liste tous les bundles d'un store
 */
export const useDigitalBundles = (storeId?: string) => {
  return useQuery({
    queryKey: ['digitalBundles', storeId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      let query = supabase
        .from('digital_product_bundles')
        .select('*')
        .eq('is_draft', false)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('store_id', storeId);
      } else {
        // Récupérer tous les stores de l'utilisateur
        const { data: stores } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user.id);

        if (stores && stores.length > 0) {
          query = query.in('store_id', stores.map(s => s.id));
        } else {
          return [];
        }
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching bundles', { error, storeId });
        throw error;
      }

      return (data || []) as DigitalProductBundle[];
    },
    enabled: true,
  });
};

/**
 * useDigitalBundle - Récupère un bundle par ID
 */
export const useDigitalBundle = (bundleId: string | undefined) => {
  return useQuery({
    queryKey: ['digitalBundle', bundleId],
    queryFn: async () => {
      if (!bundleId) throw new Error('Bundle ID manquant');

      const { data, error } = await supabase
        .from('digital_product_bundles')
        .select(`
          *,
          products:products!digital_product_bundles_product_id_fkey (
            id,
            name,
            price,
            image_url
          )
        `)
        .eq('id', bundleId)
        .single();

      if (error) {
        logger.error('Error fetching bundle', { error, bundleId });
        throw error;
      }

      // Récupérer les produits digitaux du bundle
      if (data.digital_product_ids && data.digital_product_ids.length > 0) {
        const { data: bundleProducts } = await supabase
          .from('products')
          .select('id, name, price, image_url')
          .in('id', data.digital_product_ids);

        return {
          ...data,
          products: bundleProducts || [],
        } as DigitalProductBundle;
      }

      return data as DigitalProductBundle;
    },
    enabled: !!bundleId,
  });
};

/**
 * useActiveBundles - Récupère les bundles actifs (pour marketplace)
 */
export const useActiveBundles = (limit: number = 6, storeId?: string) => {
  return useQuery({
    queryKey: ['activeBundles', storeId, limit],
    queryFn: async () => {
      let query = supabase
        .from('digital_product_bundles')
        .select('*')
        .eq('is_active', true)
        .eq('is_draft', false)
        .order('display_order', { ascending: true })
        .order('total_sales', { ascending: false })
        .limit(limit);

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching active bundles', { error, storeId });
        throw error;
      }

      return (data || []) as DigitalProductBundle[];
    },
  });
};

/**
 * useFeaturedBundles - Récupère les bundles mis en avant
 */
export const useFeaturedBundles = (storeId?: string, limit: number = 6) => {
  return useQuery({
    queryKey: ['featuredBundles', storeId, limit],
    queryFn: async () => {
      let query = supabase
        .from('digital_product_bundles')
        .select('*')
        .eq('is_active', true)
        .eq('is_draft', false)
        .eq('is_featured', true)
        .order('display_order', { ascending: true })
        .order('total_sales', { ascending: false })
        .limit(limit);

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching featured bundles', { error, storeId });
        throw error;
      }

      return (data || []) as DigitalProductBundle[];
    },
  });
};

/**
 * useBundleProducts - Récupère les produits d'un bundle avec détails
 */
export const useBundleProducts = (bundleId: string | undefined) => {
  return useQuery({
    queryKey: ['bundleProducts', bundleId],
    queryFn: async () => {
      if (!bundleId) throw new Error('Bundle ID manquant');

      // Récupérer le bundle pour obtenir les product_ids
      const { data: bundle, error: bundleError } = await supabase
        .from('digital_product_bundles')
        .select('digital_product_ids')
        .eq('id', bundleId)
        .single();

      if (bundleError || !bundle) {
        throw new Error('Bundle non trouvé');
      }

      // Récupérer les produits avec leurs détails digitaux
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          digital_products!inner (
            id,
            digital_type,
            license_type,
            total_downloads,
            average_rating
          )
        `)
        .in('id', bundle.digital_product_ids);

      if (productsError) {
        logger.error('Error fetching bundle products', { error: productsError, bundleId });
        throw productsError;
      }

      return products || [];
    },
    enabled: !!bundleId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useCreateBundle - Créer un nouveau bundle
 */
export const useCreateBundle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bundleData: CreateBundleData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Vérifier que le store appartient à l'utilisateur
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('id', bundleData.store_id)
        .eq('user_id', user.id)
        .single();

      if (!store) {
        throw new Error('Store non trouvé ou non autorisé');
      }

      // Créer d'abord le produit de base pour le bundle
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          store_id: bundleData.store_id,
          name: bundleData.name,
          description: bundleData.description,
          short_description: bundleData.short_description,
          slug: bundleData.slug,
          price: bundleData.bundle_price,
          currency: bundleData.currency || 'XOF',
          promotional_price: bundleData.promotional_price,
          product_type: 'bundle',
          is_active: true,
          image_url: bundleData.image_url,
        })
        .select('id')
        .single();

      if (productError || !product) {
        logger.error('Error creating product for bundle', { error: productError });
        throw new Error('Erreur lors de la création du produit');
      }

      // Créer le bundle
      const { data: bundle, error: bundleError } = await supabase
        .from('digital_product_bundles')
        .insert({
          store_id: bundleData.store_id,
          product_id: product.id,
          name: bundleData.name,
          description: bundleData.description,
          short_description: bundleData.short_description,
          slug: bundleData.slug,
          bundle_price: bundleData.bundle_price,
          currency: bundleData.currency || 'XOF',
          promotional_price: bundleData.promotional_price,
          digital_product_ids: bundleData.digital_product_ids,
          image_url: bundleData.image_url,
          is_featured: bundleData.is_featured || false,
          display_order: bundleData.display_order || 0,
        })
        .select('*')
        .single();

      if (bundleError) {
        logger.error('Error creating bundle', { error: bundleError });
        // Supprimer le produit créé en cas d'erreur
        await supabase.from('products').delete().eq('id', product.id);
        throw new Error('Erreur lors de la création du bundle');
      }

      logger.info('Bundle créé avec succès', { bundleId: bundle.id });
      return bundle as DigitalProductBundle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalBundles'] });
      queryClient.invalidateQueries({ queryKey: ['featuredBundles'] });
      toast({
        title: '✅ Bundle créé',
        description: 'Le bundle a été créé avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useCreateBundle', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer le bundle',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useUpdateBundle - Mettre à jour un bundle
 */
export const useUpdateBundle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ bundleId, updates }: { bundleId: string; updates: UpdateBundleData }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Vérifier les permissions
      const { data: bundle } = await supabase
        .from('digital_product_bundles')
        .select('store_id, stores!inner(user_id)')
        .eq('id', bundleId)
        .single();

      if (!bundle || (bundle as any).stores?.user_id !== user.id) {
        throw new Error('Non autorisé à modifier ce bundle');
      }

      // Mettre à jour le bundle
      const { data: updatedBundle, error } = await supabase
        .from('digital_product_bundles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bundleId)
        .select('*')
        .single();

      if (error) {
        logger.error('Error updating bundle', { error, bundleId });
        throw error;
      }

      // Mettre à jour le produit associé si nécessaire
      if (updates.name || updates.description || updates.bundle_price) {
        const updateProduct: any = {};
        if (updates.name) updateProduct.name = updates.name;
        if (updates.description) updateProduct.description = updates.description;
        if (updates.bundle_price) updateProduct.price = updates.bundle_price;

        await supabase
          .from('products')
          .update(updateProduct)
          .eq('id', updatedBundle.product_id);
      }

      return updatedBundle as DigitalProductBundle;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['digitalBundles'] });
      queryClient.invalidateQueries({ queryKey: ['digitalBundle', variables.bundleId] });
      queryClient.invalidateQueries({ queryKey: ['featuredBundles'] });
      toast({
        title: '✅ Bundle mis à jour',
        description: 'Le bundle a été mis à jour avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useUpdateBundle', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour le bundle',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useDeleteBundle - Supprimer un bundle
 */
export const useDeleteBundle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bundleId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Vérifier les permissions et récupérer le product_id
      const { data: bundle } = await supabase
        .from('digital_product_bundles')
        .select('product_id, store_id, stores!inner(user_id)')
        .eq('id', bundleId)
        .single();

      if (!bundle || (bundle as any).stores?.user_id !== user.id) {
        throw new Error('Non autorisé à supprimer ce bundle');
      }

      // Supprimer le bundle (cascade supprimera aussi le produit associé si configuré)
      const { error } = await supabase
        .from('digital_product_bundles')
        .delete()
        .eq('id', bundleId);

      if (error) {
        logger.error('Error deleting bundle', { error, bundleId });
        throw error;
      }

      // Supprimer le produit associé
      await supabase.from('products').delete().eq('id', bundle.product_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalBundles'] });
      queryClient.invalidateQueries({ queryKey: ['featuredBundles'] });
      toast({
        title: '✅ Bundle supprimé',
        description: 'Le bundle a été supprimé avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useDeleteBundle', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer le bundle',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useCreateBundleOrder - Créer une commande pour un bundle
 */
export const useCreateBundleOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      bundleId,
      customerId,
      storeId,
      customerEmail,
      customerName,
    }: {
      bundleId: string;
      customerId: string;
      storeId: string;
      customerEmail: string;
      customerName?: string;
    }) => {
      const { data, error } = await supabase.rpc('create_bundle_order', {
        p_bundle_id: bundleId,
        p_customer_id: customerId,
        p_store_id: storeId,
        p_customer_email: customerEmail,
        p_customer_name: customerName || null,
      });

      if (error) {
        logger.error('Error creating bundle order', { error, bundleId });
        throw new Error(error.message || 'Erreur lors de la création de la commande bundle');
      }

      if (!data || !data.success) {
        throw new Error(data?.message || 'Erreur lors de la création de la commande bundle');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalBundles'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: '✅ Commande créée',
        description: 'La commande bundle a été créée avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in useCreateBundleOrder', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la commande bundle',
        variant: 'destructive',
      });
    },
  });
};
