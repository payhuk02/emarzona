import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

/**
 * Hook personnalisé pour gérer les favoris du marketplace
 * - Synchronisation avec Supabase pour utilisateurs authentifiés
 * - Fallback localStorage pour visiteurs anonymes
 * - Migration automatique localStorage → Supabase lors de la connexion
 */
export const useMarketplaceFavorites = () => {
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Charger les favoris au montage
  useEffect(() => {
    loadFavorites();
  }, []);

  /**
   * Charger les favoris depuis Supabase ou localStorage
   */
  const loadFavorites = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Utilisateur authentifié : charger depuis Supabase
        setIsAuthenticated(true);
        const { data, error } = await supabase
          .from('user_favorites')
          .select('product_id')
          .eq('user_id', user.id);

        if (error) {
          logger.error("Erreur lors du chargement des favoris:", error);
          // Fallback to localStorage
          loadFromLocalStorage();
          return;
        }

        const favoriteIds = new Set(data.map(fav => fav.product_id));
        setFavorites(favoriteIds);
        logger.info(`${favoriteIds.size} favoris chargés depuis Supabase`);

        // Migrer les favoris localStorage vers Supabase si nécessaire
        await migrateFavoritesFromLocalStorage(user.id, favoriteIds);
      } else {
        // Visiteur anonyme : charger depuis localStorage
        setIsAuthenticated(false);
        loadFromLocalStorage();
      }
    } catch (error) {
      logger.error("Erreur lors du chargement des favoris:", error);
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charger les favoris depuis localStorage
   */
  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('marketplace-favorites');
    if (saved) {
      try {
        const favoriteIds = JSON.parse(saved);
        setFavorites(new Set(favoriteIds));
        logger.info(`${favoriteIds.length} favoris chargés depuis localStorage`);
      } catch (error) {
        logger.error("Erreur parsing favoris localStorage:", error);
        setFavorites(new Set());
      }
    } else {
      setFavorites(new Set());
    }
  };

  /**
   * Migrer les favoris localStorage vers Supabase
   */
  const migrateFavoritesFromLocalStorage = async (userId: string, existingFavorites: Set<string>) => {
    const saved = localStorage.getItem('marketplace-favorites');
    if (!saved) return;

    try {
      const localFavorites = JSON.parse(saved) as string[];
      const newFavorites = localFavorites.filter(id => !existingFavorites.has(id));

      if (newFavorites.length > 0) {
        // Insérer les nouveaux favoris dans Supabase
        const { error } = await supabase
          .from('user_favorites')
          .insert(
            newFavorites.map(productId => ({
              user_id: userId,
              product_id: productId,
            }))
          );

        if (error) {
          logger.error("Erreur lors de la migration des favoris:", error);
        } else {
          logger.info(`${newFavorites.length} favoris migrés de localStorage vers Supabase`);
          // Nettoyer localStorage après migration réussie
          localStorage.removeItem('marketplace-favorites');
        }
      }
    } catch (error) {
      logger.error("Erreur lors de la migration des favoris:", error);
    }
  };

  /**
   * Ajouter ou retirer un produit des favoris
   */
  const toggleFavorite = useCallback(async (productId: string) => {
    const isFavorite = favorites.has(productId);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Utilisateur authentifié : modifier dans Supabase
        if (isFavorite) {
          // Retirer
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

          toast({
            title: "Retiré des favoris",
            description: "Le produit a été retiré de vos favoris",
          });
        } else {
          // Ajouter
          const { error } = await supabase
            .from('user_favorites')
            .insert({ user_id: user.id, product_id: productId });

          if (error) {
            // Si le produit existe déjà (erreur de contrainte unique), l'ignorer
            if (error.code === '23505') {
              logger.info("Le produit est déjà dans les favoris");
              return;
            }
            throw error;
          }

          setFavorites(prev => new Set([...prev, productId]));

          toast({
            title: "Ajouté aux favoris",
            description: "Le produit a été ajouté à vos favoris",
          });
        }
      } else {
        // Visiteur anonyme : modifier localStorage
        const newFavorites = new Set(favorites);
        
        if (isFavorite) {
          newFavorites.delete(productId);
          toast({
            title: "Retiré des favoris",
            description: "Le produit a été retiré de vos favoris",
          });
        } else {
          newFavorites.add(productId);
          toast({
            title: "Ajouté aux favoris",
            description: "Connectez-vous pour synchroniser vos favoris sur tous vos appareils",
          });
        }

        setFavorites(newFavorites);
        localStorage.setItem('marketplace-favorites', JSON.stringify([...newFavorites]));
      }
    } catch (error) {
      logger.error("Erreur lors de la modification des favoris:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier les favoris",
        variant: "destructive",
      });
    }
  }, [favorites, toast]);

  /**
   * Effacer tous les favoris
   */
  const clearAllFavorites = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Utilisateur authentifié : supprimer de Supabase
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Visiteur anonyme : supprimer de localStorage
        localStorage.removeItem('marketplace-favorites');
      }

      setFavorites(new Set());
      toast({
        title: "Favoris effacés",
        description: "Tous vos favoris ont été supprimés",
      });
    } catch (error) {
      logger.error("Erreur lors de la suppression des favoris:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'effacer les favoris",
        variant: "destructive",
      });
    }
  }, [toast]);

  /**
   * Obtenir le nombre de favoris
   */
  const favoritesCount = favorites.size;

  /**
   * Vérifier si un produit est en favori
   */
  const isFavorite = useCallback((productId: string) => {
    return favorites.has(productId);
  }, [favorites]);

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
};

