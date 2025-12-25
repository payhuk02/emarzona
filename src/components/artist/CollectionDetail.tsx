/**
 * Détail d'une Collection d'Œuvres
 * Affichage d'une collection avec ses œuvres
 * Date : 4 Février 2025
 */

import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Package, ImageIcon } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { ArtistProductCard } from '@/components/products/ArtistProductCard';

export const CollectionDetail = () => {
  const { collectionSlug } = useParams<{ collectionSlug: string }>();
  
  // Note: useCollection nécessite un collectionId, donc on récupère directement par slug
  // useCollection n'est pas utilisé ici car on cherche par slug, pas par ID

  // Récupérer la collection par slug
  const { data: collectionBySlug, isLoading: isLoadingBySlug } = useQuery({
    queryKey: ['collection-by-slug', collectionSlug],
    queryFn: async () => {
      if (!collectionSlug) return null;

      const { data, error } = await supabase
        .from('artist_collections')
        .select('*')
        .eq('collection_slug', collectionSlug)
        .eq('is_public', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          return null;
        }
        throw error;
      }

      // Récupérer les items
      const { data: items } = await supabase
        .from('artist_collection_items')
        .select('*')
        .eq('collection_id', data.id)
        .order('display_order', { ascending: true });

      return {
        ...data,
        items: items || [],
        items_count: items?.length || 0,
      } as CollectionWithItems;
    },
    enabled: !!collectionSlug,
  });

  const finalCollection = collectionBySlug;
  const finalIsLoading = isLoadingBySlug;

  // Récupérer les produits pour les items
  const { data: products } = useQuery({
    queryKey: ['collection-products', finalCollection?.items?.map((i) => i.product_id)],
    queryFn: async () => {
      if (!finalCollection?.items || finalCollection.items.length === 0) return [];

      const productIds = finalCollection.items.map((item) => item.product_id);

      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          artist_products(*),
          stores(id, name, slug, logo_url)
        `
        )
        .in('id', productIds)
        .eq('is_active', true);

      if (error) throw error;

      // Mapper avec les items pour préserver l'ordre
      return finalCollection.items
        .map((item) => {
          const product = data?.find((p) => p.id === item.product_id);
          return product ? { ...product, collection_item: item } : null;
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);
    },
    enabled: !!finalCollection && (finalCollection.items?.length || 0) > 0,
  });

  if (finalIsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  if (!finalCollection) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">Collection non trouvée</p>
        <Button asChild className="mt-4">
          <Link to="/collections">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux collections
          </Link>
        </Button>
      </div>
    );
  }

  const collectionTypeLabels: Record<string, string> = {
    thematic: 'Thématique',
    chronological: 'Chronologique',
    series: 'Série',
    exhibition: 'Exposition',
    custom: 'Personnalisée',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/collections">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">
              {collectionTypeLabels[finalCollection.collection_type] ||
                finalCollection.collection_type}
            </Badge>
            {finalCollection.is_featured && (
              <Badge variant="default">À la une</Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold">{finalCollection.collection_name}</h1>
          {finalCollection.collection_description && (
            <p className="text-muted-foreground mt-2">{finalCollection.collection_description}</p>
          )}
        </div>
      </div>

      {/* Cover Image */}
      {finalCollection.cover_image_url && (
        <Card className="overflow-hidden">
          <div className="relative aspect-video overflow-hidden">
            <OptimizedImage
              src={finalCollection.cover_image_url}
              alt={finalCollection.cover_image_alt || finalCollection.collection_name}
              className="w-full h-full object-cover"
            />
          </div>
        </Card>
      )}

      <Separator />

      {/* Collection Info */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          <span>{finalCollection.items_count || 0} œuvres</span>
        </div>
        {finalCollection.tags && finalCollection.tags.length > 0 && (
          <div className="flex items-center gap-2">
            <span>Tags :</span>
            <div className="flex gap-1">
              {finalCollection.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Products Grid */}
      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ArtistProductCard
              key={product.id}
              product={{
                ...product,
                artist: product.artist_products?.[0],
              }}
              variant="marketplace"
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Aucune œuvre dans cette collection</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

