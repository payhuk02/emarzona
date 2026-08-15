import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useQueryClient } from '@tanstack/react-query';

export type MarketplaceFavoritesState = ReturnType<typeof useMarketplaceFavoritesState>;

/**
 * État partagé des favoris marketplace (une seule requête Supabase par page).
 */
export function useMarketplaceFavoritesState() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        const { data, error } = await supabase
          .from('user_favorites')
          .select('product_id')
          .eq('user_id', user.id);

        if (error) {
          logger.error('Erreur lors du chargement des favoris:', error);
          loadFromLocalStorage();
          return;
        }

        const favoriteIds = new Set(data.map(fav => fav.product_id));
        setFavorites(favoriteIds);
        logger.info(`${favoriteIds.size} favoris chargés depuis Supabase`);
        await migrateFavoritesFromLocalStorage(user.id, favoriteIds);
      } else {
        setIsAuthenticated(false);
        loadFromLocalStorage();
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des favoris:', error);
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('marketplace-favorites');
    } catch {
      saved = null;
    }
    if (saved) {
      try {
        const favoriteIds = JSON.parse(saved) as unknown;
        const ids = Array.isArray(favoriteIds) ? (favoriteIds as string[]) : [];
        setFavorites(new Set(ids));
        logger.info(`${ids.length} favoris chargés depuis localStorage`);
      } catch (error) {
        logger.error('Erreur parsing favoris localStorage:', error);
        setFavorites(new Set());
      }
    } else {
      setFavorites(new Set());
    }
  };

  const migrateFavoritesFromLocalStorage = async (
    userId: string,
    existingFavorites: Set<string>
  ) => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('marketplace-favorites');
    } catch {
      saved = null;
    }
    if (!saved) return;

    try {
      const localFavorites = JSON.parse(saved) as string[];
      const newFavorites = localFavorites.filter(id => !existingFavorites.has(id));

      if (newFavorites.length > 0) {
        const { error } = await supabase.from('user_favorites').insert(
          newFavorites.map(productId => ({
            user_id: userId,
            product_id: productId,
          }))
        );

        if (error) {
          logger.error('Erreur lors de la migration des favoris:', error);
        } else {
          logger.info(`${newFavorites.length} favoris migrés de localStorage vers Supabase`);
          try {
            localStorage.removeItem('marketplace-favorites');
          } catch {
            // ignore
          }
        }
      }
    } catch (error) {
      logger.error('Erreur lors de la migration des favoris:', error);
    }
  };

  const toggleFavorite = useCallback(
    async (productId: string) => {
      const isFavorite = favorites.has(productId);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          if (isFavorite) {
            const { error } = await supabase
              .from('user_favorites')
              .delete()
              .match({ user_id: user.id, product_id: productId });

            if (error) throw error;

            setFavorites(prev => {
              const newFavorites = new Set(prev);
              newFavorites.delete(productId);
              return newFavorites;
            });

            queryClient.invalidateQueries({ queryKey: ['favorite-products'] });

            toast({
              title: 'Retiré des favoris',
              description: 'Le produit a été retiré de vos favoris',
            });
          } else {
            const { error } = await supabase
              .from('user_favorites')
              .insert({ user_id: user.id, product_id: productId });

            if (error) {
              if (error.code === '23505') {
                logger.info('Le produit est déjà dans les favoris');
                return;
              }
              throw error;
            }

            setFavorites(prev => new Set([...prev, productId]));
            queryClient.invalidateQueries({ queryKey: ['favorite-products'] });

            toast({
              title: 'Ajouté aux favoris',
              description: 'Le produit a été ajouté à vos favoris',
            });
          }
        } else {
          const newFavorites = new Set(favorites);

          if (isFavorite) {
            newFavorites.delete(productId);
            toast({
              title: 'Retiré des favoris',
              description: 'Le produit a été retiré de vos favoris',
            });
          } else {
            newFavorites.add(productId);
            toast({
              title: 'Ajouté aux favoris',
              description: 'Connectez-vous pour synchroniser vos favoris sur tous vos appareils',
            });
          }

          setFavorites(newFavorites);
          localStorage.setItem('marketplace-favorites', JSON.stringify([...newFavorites]));
          queryClient.invalidateQueries({ queryKey: ['favorite-products'] });
        }
      } catch (error) {
        logger.error('Erreur lors de la modification des favoris:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de modifier les favoris',
          variant: 'destructive',
        });
      }
    },
    [favorites, toast, queryClient]
  );

  const clearAllFavorites = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase.from('user_favorites').delete().eq('user_id', user.id);
        if (error) throw error;
      } else {
        localStorage.removeItem('marketplace-favorites');
      }

      setFavorites(new Set());
      toast({
        title: 'Favoris effacés',
        description: 'Tous vos favoris ont été supprimés',
      });
    } catch (error) {
      logger.error('Erreur lors de la suppression des favoris:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'effacer les favoris",
        variant: 'destructive',
      });
    }
  }, [toast]);

  const favoritesCount = favorites.size;

  const isFavorite = useCallback(
    (productId: string) => {
      return favorites.has(productId);
    },
    [favorites]
  );

  return {
    favorites,
    favoritesCount,
    loading,
    isAuthenticated,
    toggleFavorite,
    clearAllFavorites,
    isFavorite,
    refreshFavorites: loadFavorites,
  };
}
