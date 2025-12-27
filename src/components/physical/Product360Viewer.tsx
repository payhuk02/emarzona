/**
 * Product 360° Viewer Component
 * Date: 1 Février 2025
 * 
 * Composant pour afficher une rotation 360° interactive d'un produit
 * Utilise une série d'images pour créer l'effet de rotation
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCw, RotateCcw, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface Product360ViewerProps {
  images: string[]; // Array d'URLs d'images pour rotation 360°
  productName: string;
  className?: string;
  autoRotate?: boolean;
  rotationSpeed?: number; // Images par seconde (défaut: 2)
}

export const Product360Viewer = ({
  images,
  productName,
  className,
  autoRotate = false,
  rotationSpeed = 2,
}: Product360ViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const totalImages = images.length;
  const currentImage = images[currentIndex] || images[0];

  // Auto-rotation
  useEffect(() => {
    if (isAutoRotating && totalImages > 0) {
      const interval = 1000 / rotationSpeed; // ms entre chaque image
      animationRef.current = window.setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % totalImages);
      }, interval);

      return () => {
        if (animationRef.current) {
          clearInterval(animationRef.current);
        }
      };
    }
  }, [isAutoRotating, totalImages, rotationSpeed]);

  // Gestion du drag pour rotation manuelle
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setIsAutoRotating(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const deltaX = e.clientX - startX;
    const containerWidth = containerRef.current.offsetWidth;
    const sensitivity = containerWidth / totalImages; // Sensibilité du drag

    const imageDelta = Math.round(deltaX / sensitivity);
    const newIndex = (currentIndex + imageDelta + totalImages) % totalImages;

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      setStartX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Gestion du touch pour mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setIsAutoRotating(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const deltaX = e.touches[0].clientX - startX;
    const containerWidth = containerRef.current.offsetWidth;
    const sensitivity = containerWidth / totalImages;

    const imageDelta = Math.round(deltaX / sensitivity);
    const newIndex = (currentIndex + imageDelta + totalImages) % totalImages;

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      setStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Navigation boutons
  const handlePrevious = () => {
    setIsAutoRotating(false);
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handleNext = () => {
    setIsAutoRotating(false);
    setCurrentIndex((prev) => (prev + 1) % totalImages);
  };

  const toggleAutoRotate = () => {
    setIsAutoRotating((prev) => !prev);
  };

  if (totalImages === 0) {
    return (
      <div className={cn('flex items-center justify-center bg-muted rounded-lg aspect-square', className)}>
        <p className="text-muted-foreground">Aucune image 360° disponible</p>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Container principal */}
      <div
        ref={containerRef}
        className="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <OptimizedImage
          src={currentImage}
          alt={`${productName} - Vue 360° ${currentIndex + 1}/${totalImages}`}
          className="w-full h-full object-contain transition-opacity duration-200"
          width={800}
          height={800}
        />

        {/* Indicateur de progression */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {totalImages}
        </div>

        {/* Instructions */}
        {!isDragging && !isAutoRotating && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
            Glissez pour faire tourner
          </div>
        )}
      </div>

      {/* Contrôles */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          aria-label="Rotation précédente"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleAutoRotate}
          aria-label={isAutoRotating ? 'Arrêter rotation' : 'Démarrer rotation'}
        >
          {isAutoRotating ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          aria-label="Rotation suivante"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};







