/**
 * Galerie de Collections d'Œuvres d'Artiste
 * Affichage des collections avec leurs œuvres
 * Date : 4 Février 2025
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useStoreCollections } from '@/hooks/artist/useCollections';
import { Link } from 'react-router-dom';
import { ImageIcon, Package } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface CollectionsGalleryProps {
  storeId: string;
  showPrivate?: boolean;
  limit?: number;
}

export const CollectionsGallery = ({
  storeId,
  showPrivate = false,
  limit,
}: CollectionsGalleryProps) => {
  const { data: collections, isLoading } = useStoreCollections(storeId, showPrivate);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (!collections || collections.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">Aucune collection disponible</p>
      </div>
    );
  }

  const displayCollections = limit ? collections.slice(0, limit) : collections;

  const  collectionTypeLabels: Record<string, string> = {
    thematic: 'Thématique',
    chronological: 'Chronologique',
    series: 'Série',
    exhibition: 'Exposition',
    custom: 'Personnalisée',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayCollections.map((collection) => (
        <Card
          key={collection.id}
          className="overflow-hidden hover:shadow-lg transition-shadow group"
        >
          <Link to={`/collections/${collection.collection_slug}`}>
            <div className="relative aspect-video overflow-hidden bg-muted">
              {collection.cover_image_url ? (
                <OptimizedImage
                  src={collection.cover_image_url}
                  alt={collection.cover_image_alt || collection.collection_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
              {collection.is_featured && (
                <Badge className="absolute top-2 right-2" variant="default">
                  À la une
                </Badge>
              )}
            </div>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="line-clamp-2">{collection.collection_name}</CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    {collection.collection_short_description || collection.collection_description}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {collectionTypeLabels[collection.collection_type] || collection.collection_type}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span>{collection.items_count || 0} œuvres</span>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>
      ))}
    </div>
  );
};







