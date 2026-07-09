import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateSlug } from '@/lib/store-utils';
import { withRateLimit } from '@/lib/rate-limiter';
import { useAuth } from '@/contexts/AuthContext';
import { invalidateCatalogCaches } from '@/lib/cache-invalidation';

export const useProductManagement = (storeId: string) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const checkSlugAvailability = async (
    slug: string,
    excludeProductId?: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('is_product_slug_available', {
        check_slug: slug,
        check_store_id: storeId,
        exclude_product_id: excludeProductId || null,
      });

      if (error) throw error;
      return data;
    } catch (_error: unknown) {
      const errorMessage = _error instanceof Error ? _error.message : String(_error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  const createProduct = async (productData: {
    name: string;
    slug?: string;
    description?: string;
    price: number;
    currency?: string;
    category?: string;
    product_type?: string;
    image_url?: string;
  }): Promise<boolean> => {
    setLoading(true);
    try {
      // Appliquer le rate limiting pour la création de produits
      const result = await withRateLimit(
        'product-creation',
        async () => {
          const slug = productData.slug || generateSlug(productData.name);

          // Check slug availability
          const isAvailable = await checkSlugAvailability(slug);
          if (!isAvailable) {
            toast({
              title: 'Erreur',
              description: 'Ce lien est déjà utilisé pour un autre produit',
              variant: 'destructive',
            });
            return false;
          }

          const baseProductPayload = {
            name: productData.name,
            slug,
            description: productData.description || null,
            price: productData.price || 0,
            currency: productData.currency || 'XOF',
            category_id: productData.category || null,
            image_url: productData.image_url || null,
            product_type: productData.product_type || 'digital',
            is_active: false, // Inactive by default for CSV imports/duplicates to allow review
          };

          let resultError = null;

          if (productData.product_type === 'physical') {
            const { error } = await supabase.rpc('create_physical_product_tx', {
              p_store_id: storeId,
              p_product: baseProductPayload,
              p_physical: { requires_shipping: true },
            });
            resultError = error;
          } else if (productData.product_type === 'service') {
            const { error } = await supabase.rpc('create_service_product_tx', {
              p_store_id: storeId,
              p_product: baseProductPayload,
              p_service: { duration_minutes: 60 },
            });
            resultError = error;
          } else if (productData.product_type === 'artist') {
            const { error } = await supabase.rpc('create_artist_product_tx', {
              p_store_id: storeId,
              p_product: baseProductPayload,
              p_artist: { medium: 'unknown' },
            });
            resultError = error;
          } else if (productData.product_type === 'digital' || !productData.product_type) {
            const { error } = await supabase.rpc('create_digital_product_tx', {
              p_store_id: storeId,
              p_product: baseProductPayload,
              p_digital: {},
              p_files: [],
            });
            resultError = error;
          } else {
            // Generic fallback for any other types (e.g. 'course')
            const { error } = await supabase.from('products').insert({
              store_id: storeId,
              name: productData.name,
              slug,
              description: productData.description,
              price: productData.price,
              currency: productData.currency || 'XOF',
              category: productData.category,
              product_type: productData.product_type,
              image_url: productData.image_url,
            });
            resultError = error;
          }

          if (resultError) throw resultError;

          invalidateCatalogCaches(queryClient);
          queryClient.invalidateQueries({ queryKey: ['products', storeId] });

          toast({
            title: 'Succès',
            description: 'Produit créé avec succès',
          });
          return true;
        },
        {
          userId: user?.id,
          retry: false, // Pas de retry pour création produit
        }
      );

      return result;
    } catch (_error: unknown) {
      const errorMessage = _error instanceof Error ? _error.message : String(_error);
      toast({
        title: 'Erreur',
        description: errorMessage || 'Une erreur est survenue lors de la création du produit',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (
    productId: string,
    updates: {
      name?: string;
      slug?: string;
      description?: string;
      price?: number;
      currency?: string;
      category?: string;
      product_type?: string;
      image_url?: string;
      is_active?: boolean;
    }
  ): Promise<boolean> => {
    setLoading(true);
    try {
      // If slug is being updated, check availability
      if (updates.slug) {
        const isAvailable = await checkSlugAvailability(updates.slug, productId);
        if (!isAvailable) {
          toast({
            title: 'Erreur',
            description: 'Ce lien est déjà utilisé pour un autre produit',
            variant: 'destructive',
          });
          return false;
        }
      }

      const { error } = await supabase.from('products').update(updates).eq('id', productId);

      if (error) throw error;

      invalidateCatalogCaches(queryClient);
      queryClient.invalidateQueries({ queryKey: ['products', storeId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });

      toast({
        title: 'Succès',
        description: 'Produit mis à jour',
      });
      return true;
    } catch (_error: unknown) {
      const errorMessage = _error instanceof Error ? _error.message : String(_error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);

      if (error) throw error;

      invalidateCatalogCaches(queryClient);
      queryClient.invalidateQueries({ queryKey: ['products', storeId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });

      toast({
        title: 'Succès',
        description: 'Produit supprimé',
      });
      return true;
    } catch (_error: unknown) {
      const errorMessage = _error instanceof Error ? _error.message : String(_error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    checkSlugAvailability,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
