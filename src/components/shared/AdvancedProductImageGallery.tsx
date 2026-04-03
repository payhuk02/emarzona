/**
 * Advanced Product Image Gallery Component
 * Date: 31 Janvier 2025
 * 
 * Galerie d'images produits avancée avec :
 * - Zoom interactif (hover/click)
 * - Vue 360° (si disponible)
 * - Vidéos produits
 * - Lightbox amélioré
 * - Navigation tactile
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Move,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Image360 {
  type: '360';
  images: string[]; // Array of image URLs for 360° view
  frames?: number; // Total frames
}

interface VideoMedia {
  type: 'video';
  url: string;
  thumbnail?: string;
  provider?: 'youtube' | 'vimeo' | 'direct';
}

interface StandardImage {
  type: 'image';
  url: string;
  alt?: string;
}

type MediaItem = Image360 | VideoMedia | StandardImage;

interface AdvancedProductImageGalleryProps {
  images: string[];
  videos?: Array<{
    url: string;
    thumbnail?: string;
    provider?: 'youtube' | 'vimeo' | 'direct';
  }>;
  images360?: Array<{
    images: string[];
    frames?: number;
  }>;
  productName?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  enableZoom?: boolean;
  enable360?: boolean;
  enableLightbox?: boolean;
}

export const AdvancedProductImageGallery = ({
  images,
  videos = [],
  images360 = [],
  productName = 'Produit',
  className,
  aspectRatio = 'square',
  enableZoom = true,
  enable360 = true,
  enableLightbox = true,
}: AdvancedProductImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [zoomLevel, setZoomLevel] = useState(2);
  const [is360View, setIs360View] = useState(false);
  const [current360Frame, setCurrent360Frame] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(null);

  const imageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Combine all media items
  const  mediaItems: MediaItem[] = [
    ...images.map((url) => ({ type: 'image' as const, url, alt: productName })),
    ...videos.map((video) => ({
      type: 'video' as const,
      url: video.url,
      thumbnail: video.thumbnail,
      provider: video.provider,
    })),
    ...images360.map((img360) => ({
      type: '360' as const,
      images: img360.images,
      frames: img360.frames,
    })),
  ];

  const currentMedia = mediaItems[selectedIndex];
  const is360 = currentMedia?.type === '360';
  const isVideo = currentMedia?.type === 'video';
  const isImage = currentMedia?.type === 'image';

  // 360° View Logic
  useEffect(() => {
    if (!is360View || !is360) return;

    let  animationFrame: number;
    let  isDragging360= false;
    let  startX= 0;
    let  currentFrame= current360Frame;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging360) return;
      const deltaX = e.clientX - startX;
      const frameDelta = Math.round(deltaX / 5);
      const newFrame = Math.max(
        0,
        Math.min((currentMedia as Image360).images.length - 1, currentFrame + frameDelta)
      );
      setCurrent360Frame(newFrame);
      currentFrame = newFrame;
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging360 = true;
      startX = e.clientX;
    };

    const handleMouseUp = () => {
      isDragging360 = false;
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousedown', handleMouseDown);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [is360View, is360, currentMedia, current360Frame]);

  // Zoom Logic
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isZoomed || !imageRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setZoomPosition({
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      });
    },
    [isZoomed]
  );

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(5, prev + 0.5));
    if (!isZoomed) setIsZoomed(true);
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const newLevel = Math.max(1, prev - 0.5);
      if (newLevel <= 1) setIsZoomed(false);
      return newLevel;
    });
  };

  const toggleZoom = () => {
    if (isZoomed) {
      setIsZoomed(false);
      setZoomLevel(2);
    } else {
      setIsZoomed(true);
      setZoomLevel(2);
    }
  };

  // Navigation
  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
    setIsZoomed(false);
    setIs360View(false);
    setIsPlayingVideo(false);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
    setIs360View(false);
    setIsPlayingVideo(false);
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
    setIsZoomed(false);
    setIs360View(false);
    setIsPlayingVideo(false);
  };

  // 360° Toggle
  const toggle360View = () => {
    if (is360) {
      setIs360View(!is360View);
      setIsZoomed(false);
    }
  };

  // Video Play
  const handlePlayVideo = (index: number) => {
    setPlayingVideoIndex(index);
    setIsPlayingVideo(true);
  };

  // Aspect Ratio Classes
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: 'aspect-auto',
  };

  // Get current image URL
  const getCurrentImageUrl = () => {
    if (is360 && is360View) {
      const img360 = currentMedia as Image360;
      return img360.images[current360Frame] || img360.images[0];
    }
    if (isImage) {
      return (currentMedia as StandardImage).url;
    }
    if (isVideo) {
      const video = currentMedia as VideoMedia;
      return video.thumbnail || video.url;
    }
    return images[0] || '/placeholder-product.png';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Image Container */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div
            ref={containerRef}
            className={cn(
              'relative w-full bg-muted overflow-hidden cursor-zoom-in',
              aspectRatioClasses[aspectRatio],
              isZoomed && 'cursor-move',
              is360View && 'cursor-grab active:cursor-grabbing'
            )}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              if (!isDragging) setIsZoomed(false);
            }}
            onClick={enableZoom && isImage ? toggleZoom : undefined}
          >
            {/* Loading State */}
            {!currentMedia && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* 360° View Indicator */}
            {is360 && enable360 && (
              <div className="absolute top-4 left-4 z-10">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggle360View}
                  className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  {is360View ? 'Vue Normale' : 'Vue 360°'}
                </Button>
              </div>
            )}

            {/* Video Play Button */}
            {isVideo && !isPlayingVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => handlePlayVideo(selectedIndex)}
                  className="bg-white/90 hover:bg-white text-black rounded-full p-6"
                >
                  <Play className="h-8 w-8 fill-current" />
                </Button>
              </div>
            )}

            {/* Video Player */}
            {isVideo && isPlayingVideo && playingVideoIndex === selectedIndex && (
              <div className="absolute inset-0 bg-black">
                <video
                  ref={videoRef}
                  src={(currentMedia as VideoMedia).url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  onEnded={() => {
                    setIsPlayingVideo(false);
                    setPlayingVideoIndex(null);
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => {
                    setIsPlayingVideo(false);
                    setPlayingVideoIndex(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Main Image */}
            {!isVideo && (
              <div
                ref={imageRef}
                className={cn(
                  'absolute inset-0 transition-transform duration-300',
                  isZoomed && 'scale-150'
                )}
                style={{
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }}
              >
                <img
                  src={getCurrentImageUrl()}
                  alt={productName}
                  className={cn(
                    'w-full h-full object-cover transition-opacity duration-300',
                    isZoomed && 'opacity-100'
                  )}
                  draggable={false}
                />
              </div>
            )}

            {/* Zoom Controls */}
            {enableZoom && isImage && (
              <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleZoomIn}
                  className="bg-white/90 hover:bg-white shadow-lg"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleZoomOut}
                  className="bg-white/90 hover:bg-white shadow-lg"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Navigation Arrows */}
            {mediaItems.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}

            {/* Lightbox Button */}
            {enableLightbox && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white shadow-lg"
                onClick={() => setIsLightboxOpen(true)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}

            {/* 360° Frame Indicator */}
            {is360 && is360View && (currentMedia as Image360).images.length > 0 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
                {current360Frame + 1} / {(currentMedia as Image360).images.length}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Thumbnails */}
      {mediaItems.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {mediaItems.map((media, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={cn(
                'relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                selectedIndex === index
                  ? 'border-primary scale-105'
                  : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              {media.type === 'video' ? (
                <div className="relative w-full h-full">
                  <img
                    src={media.thumbnail || media.url}
                    alt={`${productName} - Video ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                </div>
              ) : media.type === '360' ? (
                <div className="relative w-full h-full">
                  <img
                    src={media.images[0]}
                    alt={`${productName} - 360° ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <RotateCw className="h-6 w-6 text-white" />
                  </div>
                </div>
              ) : (
                <img
                  src={media.url}
                  alt={`${productName} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-7xl w-full p-0 bg-black/95">
          <div className="relative w-full aspect-video">
            <img
              src={getCurrentImageUrl()}
              alt={productName}
              className="w-full h-full object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white"
              onClick={() => setIsLightboxOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            {mediaItems.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};







