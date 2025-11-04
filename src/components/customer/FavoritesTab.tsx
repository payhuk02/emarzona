/**
 * Favorites Tab Component
 * Date: 27 Janvier 2025
 * 
 * Onglet pour afficher les produits favoris
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Heart, ShoppingCart, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const FavoritesTab = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les favoris
  const { data: favorites, isLoading } = useQuery({
    queryKey: ['userFavorites'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          product:products (
            id,
            name,
            description,
            price,
            currency,
            image_url,
            slug,
            store_id,
            is_active,
            store:stores (
              id,
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Supprimer un favori
  const removeFavorite = useMutation({
    mutationFn: async (productId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userFavorites'] });
      toast({
        title: '✅ Retiré des favoris',
        description: 'Le produit a été retiré de vos favoris',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de retirer le produit des favoris',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-48 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucun favori</h3>
          <p className="text-muted-foreground mb-4">
            Vous n'avez pas encore de produits dans vos favoris
          </p>
          <Button onClick={() => navigate('/marketplace')}>
            Découvrir les produits
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {favorites.map((favorite: any) => {
        const product = favorite.product;
        if (!product) return null;

        return (
          <Card key={favorite.id} className="group hover:shadow-lg transition-all">
            <div className="relative">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                  <Heart className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFavorite.mutate(product.id)}
                disabled={removeFavorite.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <CardHeader>
              <CardTitle className="line-clamp-2">{product.name}</CardTitle>
              <CardDescription className="line-clamp-2">{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {product.price?.toLocaleString('fr-FR')} {product.currency || 'XOF'}
                  </div>
                  {product.store && (
                    <div className="text-sm text-muted-foreground">
                      Par {product.store.name}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/products/${product.slug}`)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Voir
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => navigate(`/products/${product.slug}`)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Acheter
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Ajouté le {format(new Date(favorite.created_at), 'dd MMM yyyy', { locale: fr })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

