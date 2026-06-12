/**
 * Galerie produit physique v2 — swipe Embla + lightbox (Epic 3.2.4)
 */

import { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Expand, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface PhysicalProductGalleryV2Props {
  images: string[];
  productName: string;
  className?: string;
  showThumbnails?: boolean;
  enableLightbox?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait';
  fit?: 'contain' | 'cover';
}

export function PhysicalProductGalleryV2({
  images,
  productName,
  className,
  showThumbnails = true,
  enableLightbox = true,
  aspectRatio = 'square',
  fit = 'contain',
}: PhysicalProductGalleryV2Props) {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const displayImages = images.length > 0 ? images : ['/placeholder-product.png'];
  const hasRealImages = displayImages[0] !== '/placeholder-product.png';

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
  };

  const onSelect = useCallback((carouselApi: CarouselApi) => {
    setSelectedIndex(carouselApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api, onSelect]);

  const scrollTo = (index: number) => {
    api?.scrollTo(index);
    setSelectedIndex(index);
  };

  const renderSlide = (image: string, index: number, inLightbox = false) => (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-muted',
        !inLightbox && aspectRatioClasses[aspectRatio],
        inLightbox && 'aspect-square max-h-[85vh]'
      )}
    >
      {image === '/placeholder-product.png' ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="h-24 w-24 text-muted-foreground/20" aria-hidden="true" />
        </div>
      ) : (
        <OptimizedImage
          src={image}
          alt={`${productName} - Image ${index + 1}`}
          className={cn('h-full w-full', fit === 'contain' ? 'object-contain' : 'object-cover')}
          width={inLightbox ? 1200 : 800}
          height={inLightbox ? 1200 : 800}
        />
      )}
    </div>
  );

  return (
    <div className={cn('space-y-4', className)}>
      <div className="relative">
        {displayImages.length > 1 && hasRealImages ? (
          <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
            <CarouselContent className="-ml-0">
              {displayImages.map((image, index) => (
                <CarouselItem key={`${image}-${index}`} className="pl-0">
                  {renderSlide(image, index)}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-3 opacity-90 bg-black/60 text-white border-0 hover:bg-black/80" />
            <CarouselNext className="right-3 opacity-90 bg-black/60 text-white border-0 hover:bg-black/80" />
          </Carousel>
        ) : (
          renderSlide(displayImages[0], 0)
        )}

        {displayImages.length > 1 && hasRealImages && (
          <Badge
            variant="secondary"
            className="absolute top-3 left-3 bg-black/60 text-white backdrop-blur-sm pointer-events-none"
          >
            {selectedIndex + 1} / {displayImages.length}
          </Badge>
        )}

        {enableLightbox && hasRealImages && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-3 right-3 bg-black/60 text-white hover:bg-black/80 min-h-[44px] min-w-[44px]"
            onClick={() => setIsLightboxOpen(true)}
            aria-label="Agrandir l'image"
          >
            <Expand className="h-5 w-5" />
          </Button>
        )}
      </div>

      {showThumbnails && displayImages.length > 1 && hasRealImages && (
        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {displayImages.map((image, index) => (
            <button
              key={`thumb-${index}`}
              type="button"
              onClick={() => scrollTo(index)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-md border-2 transition-all',
                selectedIndex === index
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent hover:border-muted-foreground/30'
              )}
              aria-label={`Voir l'image ${index + 1}`}
            >
              <OptimizedImage
                src={image}
                alt=""
                className="h-full w-full object-cover"
                width={120}
                height={120}
              />
            </button>
          ))}
        </div>
      )}

      {enableLightbox && (
        <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 border-0 bg-transparent shadow-none">
            <div className="relative">
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/60 text-white hover:bg-black/80"
                onClick={() => setIsLightboxOpen(false)}
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </Button>
              {renderSlide(displayImages[selectedIndex], selectedIndex, true)}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
