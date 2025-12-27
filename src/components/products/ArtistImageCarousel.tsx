/**
 * ArtistImageCarousel - Carrousel d'images simplifié pour les cartes d'œuvres
 * Optimisé pour l'affichage dans les cartes produits
 *
 * Date: 31 Janvier 2025
 */

import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ArtistImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  priority?: boolean;
}

export function ArtistImageCarousel({
  images,
  alt,
  className,
  priority = false,
}: ArtistImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const imageSizes =
    '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw';

  const nextImage = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToImage = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  if (images.length === 0) {
    return null;
  }

  if (images.length === 1) {
    return (
      <div className={cn('relative w-full h-full', className)}>
        <ResponsiveProductImage
          src={images[0]}
          alt={alt}
          sizes={imageSizes}
          className="w-full h-full transition-opacity duration-500"
          fit="contain"
          fill={true}
          priority={priority}
          context="grid"
        />
      </div>
    );
  }

  return (
    <div className={cn('relative w-full h-full group', className)}>
      {/* Image principale */}
      <div className="relative w-full h-full overflow-hidden">
        <ResponsiveProductImage
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1}`}
          sizes={imageSizes}
          className="w-full h-full transition-opacity duration-500"
          fit="contain"
          fill={true}
          priority={priority && currentIndex === 0}
          context="grid"
        />

        {/* Navigation - Flèches */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'absolute left-2 top-1/2 -translate-y-1/2',
                'bg-black/30 hover:bg-black/50 text-white',
                'opacity-0 group-hover:opacity-100 transition-opacity',
                'h-11 w-11 sm:h-8 sm:w-8 rounded-full touch-manipulation'
              )}
              onClick={e => {
                e.stopPropagation();
                prevImage();
              }}
              aria-label="Image précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2',
                'bg-black/30 hover:bg-black/50 text-white',
                'opacity-0 group-hover:opacity-100 transition-opacity',
                'h-11 w-11 sm:h-8 sm:w-8 rounded-full touch-manipulation'
              )}
              onClick={e => {
                e.stopPropagation();
                nextImage();
              }}
              aria-label="Image suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Indicateur de position */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={e => {
                  e.stopPropagation();
                  goToImage(index);
                }}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  index === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75'
                )}
                aria-label={`Aller à l'image ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Compteur d'images */}
        {images.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
}






