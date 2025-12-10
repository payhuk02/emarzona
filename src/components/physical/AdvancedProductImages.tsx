/**
 * Advanced Product Images Component
 * Date: 1 Février 2025
 * 
 * Composant unifié pour images produits avancées :
 * - Images standard avec zoom
 * - Images 360°
 * - Vidéos produits
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Product360Viewer } from './Product360Viewer';
import { InteractiveZoom } from './InteractiveZoom';
import { ProductVideoGallery } from './ProductVideoGallery';
import { ProductImages } from '@/components/shared';
import { Image, Video, RotateCw, ZoomIn } from 'lucide-react';
import { usePhysicalProductImages, type PhysicalProductImage } from '@/hooks/physical/usePhysicalProductImages';
import { cn } from '@/lib/utils';

interface AdvancedProductImagesProps {
  productId: string;
  productName: string;
  standardImages: string[]; // Images standard du produit
  className?: string;
}

export const AdvancedProductImages = ({
  productId,
  productName,
  standardImages,
  className,
}: AdvancedProductImagesProps) => {
  const { data: advancedImages = [], isLoading } = usePhysicalProductImages(productId);
  const [activeTab, setActiveTab] = useState<string>('standard');

  // Séparer les images par type
  const images360 = advancedImages.filter((img) => img.is_360 && img.images_360_urls?.length > 0);
  const imagesWithZoom = advancedImages.filter((img) => img.supports_zoom);
  const videos = advancedImages.filter((img) => img.is_video && img.video_url);

  // Déterminer les onglets disponibles
  const availableTabs = [
    { id: 'standard', label: 'Images', icon: Image, count: standardImages.length },
    ...(images360.length > 0 ? [{ id: '360', label: 'Vue 360°', icon: RotateCw, count: images360.length }] : []),
    ...(imagesWithZoom.length > 0 ? [{ id: 'zoom', label: 'Zoom', icon: ZoomIn, count: imagesWithZoom.length }] : []),
    ...(videos.length > 0 ? [{ id: 'videos', label: 'Vidéos', icon: Video, count: videos.length }] : []),
  ];

  // Si pas d'images avancées, afficher seulement les images standard
  if (!isLoading && images360.length === 0 && imagesWithZoom.length === 0 && videos.length === 0) {
    return (
      <div className={className}>
        <ProductImages
          images={standardImages}
          productName={productName}
          enableLightbox={true}
          showThumbnails={true}
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)` }}>
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {tab.count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Images Standard */}
        <TabsContent value="standard" className="mt-4">
          <ProductImages
            images={standardImages}
            productName={productName}
            enableLightbox={true}
            showThumbnails={true}
          />
        </TabsContent>

        {/* Vue 360° */}
        {images360.length > 0 && (
          <TabsContent value="360" className="mt-4">
            <div className="space-y-4">
              {images360.map((img) => (
                <div key={img.id} className="space-y-2">
                  {img.caption && (
                    <p className="text-sm text-muted-foreground">{img.caption}</p>
                  )}
                  <Product360Viewer
                    images={img.images_360_urls || []}
                    productName={productName}
                    autoRotate={false}
                    rotationSpeed={2}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        {/* Zoom Interactif */}
        {imagesWithZoom.length > 0 && (
          <TabsContent value="zoom" className="mt-4">
            <div className="space-y-4">
              {imagesWithZoom.map((img) => (
                <div key={img.id} className="space-y-2">
                  {img.caption && (
                    <p className="text-sm text-muted-foreground">{img.caption}</p>
                  )}
                  <InteractiveZoom
                    imageUrl={img.image_url}
                    zoomImageUrl={img.zoom_image_url}
                    productName={productName}
                    maxZoom={img.zoom_levels || 3}
                    minZoom={1}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        {/* Vidéos */}
        {videos.length > 0 && (
          <TabsContent value="videos" className="mt-4">
            <ProductVideoGallery
              videos={videos.map((img) => ({
                id: img.id,
                url: img.video_url || '',
                thumbnailUrl: img.video_thumbnail_url,
                title: img.caption,
                duration: img.video_duration_seconds,
                provider: img.video_provider,
              }))}
              productName={productName}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

