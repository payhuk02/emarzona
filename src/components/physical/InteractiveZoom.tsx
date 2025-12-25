/**
 * Interactive Zoom Component
 * Date: 1 Février 2025
 * 
 * Composant pour zoom interactif sur images produits
 * Supporte zoom souris, touch, et boutons
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface InteractiveZoomProps {
  imageUrl: string;
  zoomImageUrl?: string; // Image haute résolution pour zoom
  productName: string;
  className?: string;
  maxZoom?: number; // Niveau de zoom maximum (défaut: 3)
  minZoom?: number; // Niveau de zoom minimum (défaut: 1)
}

export const InteractiveZoom = ({
  imageUrl,
  zoomImageUrl,
  productName,
  className,
  maxZoom = 3,
  minZoom = 1,
}: InteractiveZoomProps) => {
  const [zoomLevel, setZoomLevel] = useState(minZoom);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Image à utiliser (zoom haute résolution si disponible)
  const displayImage = zoomImageUrl || imageUrl;

  // Calcul position image zoomée
  const imageStyle = {
    transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
    transformOrigin: 'center center',
    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
  };

  // Gestion zoom souris
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel((prev) => Math.max(minZoom, Math.min(maxZoom, prev + delta)));
  };

  // Gestion drag pour déplacer image zoomée
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > minZoom) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > minZoom) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Limiter le déplacement aux bords
      if (containerRef.current && imageRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const imageRect = imageRef.current.getBoundingClientRect();
        const scaledWidth = imageRect.width * zoomLevel;
        const scaledHeight = imageRect.height * zoomLevel;
        
        const maxX = (scaledWidth - containerRect.width) / 2;
        const maxY = (scaledHeight - containerRect.height) / 2;
        
        setPosition({
          x: Math.max(-maxX, Math.min(maxX, newX)),
          y: Math.max(-maxY, Math.min(maxY, newY)),
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Gestion touch pour mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomLevel > minZoom && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      // Stocker distance initiale pour calcul zoom
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && zoomLevel > minZoom && e.touches.length === 1) {
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Contrôles zoom
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(maxZoom, prev + 0.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const newZoom = Math.max(minZoom, prev - 0.5);
      if (newZoom === minZoom) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleReset = () => {
    setZoomLevel(minZoom);
    setPosition({ x: 0, y: 0 });
  };

  const handleFullscreen = () => {
    if (!isFullscreen && containerRef.current) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    }
  };

  // Reset position quand zoom revient à min
  useEffect(() => {
    if (zoomLevel === minZoom) {
      setPosition({ x: 0, y: 0 });
    }
  }, [zoomLevel, minZoom]);

  return (
    <div className={cn('relative', className)}>
      {/* Container image avec zoom */}
      <div
        ref={containerRef}
        className={cn(
          'relative aspect-square bg-muted rounded-lg overflow-hidden',
          isDragging && zoomLevel > minZoom ? 'cursor-grabbing' : zoomLevel > minZoom ? 'cursor-grab' : 'cursor-zoom-in'
        )}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={imageRef}
          style={imageStyle}
          className="w-full h-full"
        >
          <OptimizedImage
            src={displayImage}
            alt={productName}
            className="w-full h-full object-contain"
            width={1200}
            height={1200}
          />
        </div>

        {/* Indicateur zoom */}
        {zoomLevel > minZoom && (
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {Math.round(zoomLevel * 100)}%
          </div>
        )}

        {/* Instructions */}
        {zoomLevel === minZoom && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
            Molette souris ou pincez pour zoomer
          </div>
        )}
      </div>

      {/* Contrôles */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoomLevel <= minZoom}
          aria-label="Zoom arrière"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={zoomLevel === minZoom && position.x === 0 && position.y === 0}
          aria-label="Réinitialiser"
        >
          <RotateCw className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoomLevel >= maxZoom}
          aria-label="Zoom avant"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleFullscreen}
          aria-label="Plein écran"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

