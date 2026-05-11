import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateSlug } from '@/lib/store-utils';
import { withRateLimit } from '@/lib/rate-limiter';
import { useAuth } from '@/contexts/AuthContext';

export const useProductManagement = (storeId: string) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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

          if (error) throw error;

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
