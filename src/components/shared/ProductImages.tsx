/**
 * Product Images Gallery Component
 * Date: 28 octobre 2025
 * 
 * Galerie d'images professionnelle avec :
 * - Lightbox modal pour zoom
 * - Navigation prev/next
 * - Thumbnails cliquables
 * - Support zoom avant
 * - Animations smooth
 * - Responsive design
 */

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  X,
  Image as ImageIcon,
  Expand,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductImagesProps {
  images: string[];
  productName: string;
  className?: string;
  showThumbnails?: boolean;
  enableLightbox?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait';
}

export const ProductImages = ({
  images,
  productName,
  className,
  showThumbnails = true,
  enableLightbox = true,
  aspectRatio = 'square',
}: ProductImagesProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Fallback pour images vides
  const displayImages = images.length > 0 ? images : ['/placeholder-product.png'];
  const currentImage = displayImages[selectedIndex];

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleOpenLightbox = () => {
    if (enableLightbox) {
      setIsLightboxOpen(true);
    }
  };

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Image */}
      <div className="relative group">
        <div
          className={cn(
            'relative overflow-hidden rounded-lg bg-muted',
            aspectRatioClasses[aspectRatio]
          )}
        >
          {displayImages[0] === '/placeholder-product.png' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="h-24 w-24 text-muted-foreground/20" />
            </div>
          ) : (
            <img
              src={currentImage}
              alt={`${productName} - Image ${selectedIndex + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}

          {/* Badge nombre d'images */}
          {displayImages.length > 1 && displayImages[0] !== '/placeholder-product.png' && (
            <Badge
              variant="secondary"
              className="absolute top-3 left-3 bg-black/60 text-white backdrop-blur-sm"
            >
              {selectedIndex + 1} / {displayImages.length}
            </Badge>
          )}

          {/* Navigation arrows (si multiple images) */}
          {displayImages.length > 1 && displayImages[0] !== '/placeholder-product.png' && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white hover:bg-black/80"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white hover:bg-black/80"
                onClick={handleNext}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Bouton Zoom/Expand */}
          {enableLightbox && displayImages[0] !== '/placeholder-product.png' && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white hover:bg-black/80"
              onClick={handleOpenLightbox}
            >
              <Expand className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {showThumbnails && displayImages.length > 1 && displayImages[0] !== '/placeholder-product.png' && (
        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={cn(
                'relative aspect-square rounded-md overflow-hidden border-2 transition-all',
                selectedIndex === index
                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                  : 'border-transparent hover:border-muted-foreground/30'
              )}
            >
              <img
                src={image}
                alt={`${productName} - Thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-7xl p-0 bg-black/95 border-0">
          <div className="relative h-[90vh] flex items-center justify-center">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={() => setIsLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Image counter */}
            {displayImages.length > 1 && (
              <Badge className="absolute top-4 left-4 z-50 bg-white/90 text-black">
                {selectedIndex + 1} / {displayImages.length}
              </Badge>
            )}

            {/* Main lightbox image */}
            <div className="relative h-full w-full flex items-center justify-center p-12">
              <img
                src={currentImage}
                alt={`${productName} - Full size ${selectedIndex + 1}`}
                className={cn(
                  'max-h-full max-w-full object-contain transition-transform duration-300',
                  isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                )}
                onClick={() => setIsZoomed(!isZoomed)}
              />
            </div>

            {/* Navigation arrows */}
            {displayImages.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Zoom indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <Badge variant="secondary" className="bg-white/90 text-black gap-2">
                <ZoomIn className="h-4 w-4" />
                {isZoomed ? 'Cliquer pour dézoomer' : 'Cliquer pour zoomer'}
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/**
 * Product Images Grid (alternative layout for multiple products)
 */
interface ProductImagesGridProps {
  images: string[];
  productName: string;
  maxVisible?: number;
  className?: string;
}

export const ProductImagesGrid = ({
  images,
  productName,
  maxVisible = 4,
  className,
}: ProductImagesGridProps) => {
  const [showAll, setShowAll] = useState(false);
  const displayImages = images.length > 0 ? images : ['/placeholder-product.png'];
  const visibleImages = showAll ? displayImages : displayImages.slice(0, maxVisible);
  const remainingCount = displayImages.length - maxVisible;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {visibleImages.map((image, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
          >
            {image === '/placeholder-product.png' ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
              </div>
            ) : (
              <img
                src={image}
                alt={`${productName} - ${index + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            )}

            {/* Overlay "+" pour dernière image si plus d'images */}
            {!showAll && index === maxVisible - 1 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">+{remainingCount}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bouton "Voir plus" */}
      {!showAll && remainingCount > 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowAll(true)}
        >
          Voir {remainingCount} image{remainingCount > 1 ? 's' : ''} de plus
        </Button>
      )}

      {showAll && displayImages.length > maxVisible && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowAll(false)}
        >
          Voir moins
        </Button>
      )}
    </div>
  );
};

