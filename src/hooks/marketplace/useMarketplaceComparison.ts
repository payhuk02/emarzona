import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/marketplace';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useMarketplaceComparison() {
  const { user } = useAuth();
  const userId = user?.id;
  const { toast } = useToast();

  const [comparisonProducts, setComparisonProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('marketplace-comparison');
      const parsed = saved ? (JSON.parse(saved) as unknown) : [];
      return Array.isArray(parsed) ? (parsed as Product[]) : [];
    } catch (error) {
      logger.warn('[useMarketplaceComparison] Corrupted localStorage', { error });
      return [];
    }
  });

  const [isSyncing, setIsSyncing] = useState(false);

  // Sync down (chargement initial et fusion)
  useEffect(() => {
    if (!userId) return;

    const syncCloudComparisons = async () => {
      try {
        setIsSyncing(true);
        const { data, error } = await supabase
          .from('user_comparisons')
          .select('product_ids')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        const cloudProductIds = (data?.product_ids as string[]) || [];
        const localProductIds = comparisonProducts.map(p => p.id);

        // Fusion (Cloud + Local)
        const allIds = Array.from(new Set([...cloudProductIds, ...localProductIds]));

        if (allIds.length > 0) {
          // Recharger les produits complets depuis la DB pour les IDs fusionnés
          const { data: fullProducts, error: productsError } = await supabase
            .from('products')
            .select('*, stores(name, slug, verified)')
            .in('id', allIds)
            // On limite à 4 produits max pour le comparateur
            .limit(4);

          if (productsError) throw productsError;

          if (fullProducts) {
            setComparisonProducts(fullProducts as unknown as Product[]);

            // Mettre à jour le cloud avec la fusion (max 4)
            await supabase.from('user_comparisons').upsert(
              {
                user_id: userId,
                product_ids: fullProducts.map(p => p.id),
              },
              { onConflict: 'user_id' }
            );
          }
        }
      } catch (error) {
        logger.error('[useMarketplaceComparison] Sync failed', { error });
      } finally {
        setIsSyncing(false);
      }
    };

    syncCloudComparisons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Executé quand le userId change (login/logout)

  // Sync up (sauvegarde)
  useEffect(() => {
    const saveToStorage = async () => {
      try {
        localStorage.setItem('marketplace-comparison', JSON.stringify(comparisonProducts));

        if (userId && !isSyncing) {
          await supabase.from('user_comparisons').upsert(
            {
              user_id: userId,
              product_ids: comparisonProducts.map(p => p.id),
            },
            { onConflict: 'user_id' }
          );
        }
      } catch (error) {
        logger.warn('[useMarketplaceComparison] Failed to persist', { error });
      }
    };

    saveToStorage();
  }, [comparisonProducts, userId, isSyncing]);

  const addToComparison = useCallback((product: Product) => {
    setComparisonProducts(prev => {
      if (prev.find(p => p.id === product.id)) return prev;
      if (prev.length >= 4) return [...prev.slice(1), product]; // Garde max 4, FIFO
      return [...prev, product];
    });
  }, []);

  const removeFromComparison = useCallback(
    (productId: string) => {
      setComparisonProducts(prev => prev.filter(p => p.id !== productId));
      toast({
        title: 'Produit retiré',
        description: 'Le produit a été retiré de la comparaison',
      });
    },
    [toast]
  );

  const clearComparison = useCallback(() => {
    setComparisonProducts([]);
    localStorage.removeItem('marketplace-comparison');
    toast({
      title: 'Comparaison effacée',
      description: 'Tous les produits ont été retirés de la comparaison',
    });
  }, [toast]);

  return {
    comparisonProducts,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isSyncing,
  };
}
