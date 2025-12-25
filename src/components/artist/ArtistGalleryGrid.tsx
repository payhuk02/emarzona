/**
 * Composant Galerie d'Œuvres d'Artiste
 * Date: 28 Janvier 2025
 *
 * Affiche une grille d'œuvres dans une galerie avec lightbox
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useGalleryArtworks, GalleryArtwork } from '@/hooks/artist/useArtistPortfolios';
import { LazyImage } from '@/components/ui/LazyImage';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, ExternalLink, Heart, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ProductRelation {
  id: string;
  name?: string;
  slug?: string;
  image_url?: string | null;
  price?: number;
  currency?: string;
}

interface ArtistProductRelation {
  id: string;
  artwork_title?: string;
  artwork_year?: number | null;
  artwork_medium?: string;
}

interface GalleryArtworkWithRelations extends GalleryArtwork {
  products?: ProductRelation | null;
  artist_products?: ArtistProductRelation | null;
}

interface ArtistGalleryGridProps {
  galleryId: string;
  columns?: 2 | 3 | 4;
  showTitle?: boolean;
  featuredOnly?: boolean;
  className?: string;
}

export const ArtistGalleryGrid = ({
  galleryId,
  columns = 3,
  showTitle = true,
  featuredOnly = false,
  className,
}: ArtistGalleryGridProps) => {
  const navigate = useNavigate();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: artworks = [], isLoading } = useGalleryArtworks(galleryId, {
    featuredOnly,
  });

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  const nextArtwork = () => {
    setSelectedIndex(prev => (prev + 1) % artworks.length);
  };

  const prevArtwork = () => {
    setSelectedIndex(prev => (prev - 1 + artworks.length) % artworks.length);
  };

  const selectedArtwork = artworks[selectedIndex] as GalleryArtworkWithRelations | undefined;
  const product = selectedArtwork?.products;
  const artistProduct = selectedArtwork?.artist_products;

  // Responsive grid: limiter les colonnes sur mobile pour éviter un rendu trop petit
  const gridColsClass =
    columns === 2
      ? 'grid-cols-2'
      : columns === 3
        ? 'grid-cols-2 sm:grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';

  if (isLoading) {
    return (
      <div className={cn('grid gap-4', gridColsClass, className)}>
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Aucune œuvre dans cette galerie</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn('grid gap-4', gridColsClass, className)}>
        {artworks.map((artwork, index) => {
          const artworkWithRelations = artwork as GalleryArtworkWithRelations;
          const product = artworkWithRelations.products;
          const artistProduct = artworkWithRelations.artist_products;
          const imageUrl = artwork.artwork_image_url || product?.image_url;
          const title = artwork.artwork_title || product?.name || artistProduct?.artwork_title;

          return (
            <Card
              key={artwork.id}
              className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300"
              onClick={() => openLightbox(index)}
            >
              <CardContent className="p-0">
                <div className="relative aspect-square overflow-hidden">
                  {imageUrl ? (
                    <LazyImage
                      src={imageUrl}
                      alt={title || 'Œuvre'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      aspectRatio="1/1"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">Pas d'image</span>
                    </div>
                  )}

                  {/* Overlay au survol */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          openLightbox(index);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      {product?.slug && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/product/${product.slug}`);
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Détails
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Badge Featured */}
                  {artwork.is_featured && (
                    <Badge className="absolute top-2 right-2 bg-purple-600">
                      <Heart className="h-3 w-3 mr-1" />
                      Mise en avant
                    </Badge>
                  )}
                </div>

                {/* Informations */}
                {showTitle && (
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-1">{title}</h3>
                    {artistProduct?.artwork_year && (
                      <p className="text-xs text-muted-foreground">{artistProduct.artwork_year}</p>
                    )}
                    {product?.price && (
                      <p className="text-sm font-medium mt-1">
                        {product.price.toLocaleString()} {product.currency || 'XOF'}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {selectedArtwork && (
            <div className="relative">
              {/* Image principale */}
              <div className="relative aspect-video bg-black">
                {(() => {
                  const product = selectedArtwork.products;
                  const imageUrl = selectedArtwork.artwork_image_url || product?.image_url;

                  return imageUrl ? (
                    <LazyImage
                      src={imageUrl}
                      alt={selectedArtwork.artwork_title || product?.name || 'Œuvre'}
                      className="w-full h-full object-contain"
                      aspectRatio="16/9"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-muted-foreground">Pas d'image</span>
                    </div>
                  );
                })()}

                {/* Navigation */}
                {artworks.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70"
                      onClick={prevArtwork}
                    >
                      <ChevronLeft className="h-6 w-6 text-white" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70"
                      onClick={nextArtwork}
                    >
                      <ChevronRight className="h-6 w-6 text-white" />
                    </Button>
                  </>
                )}

                {/* Compteur */}
                {artworks.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {selectedIndex + 1} / {artworks.length}
                  </div>
                )}
              </div>

              {/* Informations */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {selectedArtwork.artwork_title || selectedArtwork.products?.name || 'Œuvre'}
                    </h2>
                    {selectedArtwork.artist_products?.artwork_year && (
                      <p className="text-muted-foreground">
                        {selectedArtwork.artist_products.artwork_year}
                      </p>
                    )}
                  </div>
                  {selectedArtwork.products?.slug && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setLightboxOpen(false);
                        navigate(`/product/${selectedArtwork.products?.slug}`);
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Voir les détails
                    </Button>
                  )}
                </div>

                {selectedArtwork.artwork_description && (
                  <p className="text-muted-foreground mb-4">
                    {selectedArtwork.artwork_description}
                  </p>
                )}

                {selectedArtwork.artist_products?.artwork_medium && (
                  <Badge variant="outline" className="mr-2">
                    {selectedArtwork.artist_products.artwork_medium}
                  </Badge>
                )}

                {selectedArtwork.products?.price && (
                  <div className="mt-4">
                    <p className="text-2xl font-bold">
                      {selectedArtwork.products.price.toLocaleString()}{' '}
                      {selectedArtwork.products.currency || 'XOF'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
