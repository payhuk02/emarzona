/**
 * Composant : ReviewMediaGallery
 * Galerie améliorée pour afficher les photos et vidéos des reviews avec lightbox
 * Date : 31 Janvier 2025
 */

import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/ui/lazy-image';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReviewMedia } from '@/types/review';

interface ReviewMediaGalleryProps {
  media: ReviewMedia[];
  maxVisible?: number;
  className?: string;
}

export const ReviewMediaGallery: React.FC<ReviewMediaGalleryProps> = ({
  media,
  maxVisible = 3,
  className = '',
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) return null;

  const images = media.filter(m => m.media_type === 'image');
  const videos = media.filter(m => m.media_type === 'video');
  const allMedia = [...images, ...videos];

  const visibleMedia = allMedia.slice(0, maxVisible);
  const remainingCount = allMedia.length - maxVisible;

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev + 1) % allMedia.length);
  };

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  const currentMedia = allMedia[currentIndex];

  return (
    <>
      <div className={cn('grid grid-cols-3 gap-2', className)}>
        {visibleMedia.map((item, index) => (
          <div
            key={item.id}
            className="relative aspect-square group cursor-pointer"
            onClick={() => openLightbox(index)}
          >
            {item.media_type === 'image' ? (
              <LazyImage
                src={item.media_url}
                alt={`Review media ${index + 1}`}
                className="w-full h-full object-cover rounded-md hover:opacity-90 transition-opacity"
                aspectRatio="1/1"
              />
            ) : (
              <div className="w-full h-full bg-black rounded-md flex items-center justify-center relative">
                {item.media_thumbnail_url ? (
                  <LazyImage
                    src={item.media_thumbnail_url}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover rounded-md opacity-70"
                    aspectRatio="1/1"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 rounded-md" />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 rounded-full p-3">
                    <Play className="w-6 h-6 text-black fill-black" />
                  </div>
                </div>
              </div>
            )}
            {index === maxVisible - 1 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/60 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  +{remainingCount}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-6xl w-full p-0 bg-black/95 border-none">
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            {/* Bouton fermer */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
              aria-label="Fermer la visionneuse"
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Bouton précédent */}
            {allMedia.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-50 text-white hover:bg-white/20"
                onClick={prevMedia}
                aria-label="Média précédent"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}

            {/* Media actuel */}
            <div className="w-full h-full flex items-center justify-center p-8">
              {currentMedia?.media_type === 'image' ? (
                <LazyImage
                  src={currentMedia.media_url}
                  alt={`Review media ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  priority
                />
              ) : (
                <video
                  src={currentMedia.media_url}
                  controls
                  className="max-w-full max-h-full rounded-lg"
                  autoPlay
                >
                  Votre navigateur ne supporte pas la lecture de vidéos.
                </video>
              )}
            </div>

            {/* Bouton suivant */}
            {allMedia.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-50 text-white hover:bg-white/20"
                onClick={nextMedia}
                aria-label="Média suivant"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}

            {/* Indicateur de position */}
            {allMedia.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                <div className="bg-black/60 px-4 py-2 rounded-full text-white text-sm">
                  {currentIndex + 1} / {allMedia.length}
                </div>
              </div>
            )}

            {/* Miniatures en bas */}
            {allMedia.length > 1 && (
              <div className="absolute bottom-16 left-0 right-0 px-8">
                <div className="flex gap-2 justify-center overflow-x-auto pb-2">
                  {allMedia.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => setCurrentIndex(index)}
                      className={cn(
                        'flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all',
                        index === currentIndex
                          ? 'border-white scale-110'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      )}
                    >
                      {item.media_type === 'image' ? (
                        <LazyImage
                          src={item.media_url}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          aspectRatio="1/1"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

