/**
 * Composant de Comparaison Visuelle des Variantes
 * Date: 3 Février 2025
 *
 * Permet de comparer visuellement les images de différentes variantes
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  GitCompare,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3x3,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =====================================================
// TYPES
// =====================================================

export interface VariantImage {
  id: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  display_order: number;
}

export interface VariantForComparison {
  id: string;
  label: string;
  option_values: Record<string, string>;
  sku?: string;
  images: VariantImage[];
  price?: number;
  currency?: string;
}

export interface VariantImageComparisonProps {
  variants: VariantForComparison[];
  className?: string;
}

// =====================================================
// COMPONENT
// =====================================================

export function VariantImageComparison({ variants, className }: VariantImageComparisonProps) {
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'grid'>('side-by-side');
  const [viewingImage, setViewingImage] = useState<{
    variantId: string;
    imageIndex: number;
  } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Toggle variant selection
  const toggleVariant = (variantId: string) => {
    setSelectedVariants(
      prev =>
        prev.includes(variantId)
          ? prev.filter(id => id !== variantId)
          : [...prev, variantId].slice(0, 4) // Max 4 variants for comparison
    );
  };

  // Get selected variants data
  const selectedVariantsData = variants.filter(v => selectedVariants.includes(v.id));

  // Navigate images in lightbox
  const navigateImage = (direction: 'prev' | 'next') => {
    if (!viewingImage) return;

    const variant = variants.find(v => v.id === viewingImage.variantId);
    if (!variant || variant.images.length === 0) return;

    const currentIndex = viewingImage.imageIndex;
    let  newIndex: number;
    let  newVariantId= viewingImage.variantId;

    if (direction === 'next') {
      if (currentIndex < variant.images.length - 1) {
        newIndex = currentIndex + 1;
      } else {
        // Move to next variant
        const variantIndex = variants.findIndex(v => v.id === viewingImage.variantId);
        const nextVariant = variants[variantIndex + 1];
        if (nextVariant && nextVariant.images.length > 0) {
          newVariantId = nextVariant.id;
          newIndex = 0;
        } else {
          return; // No more images
        }
      }
    } else {
      if (currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else {
        // Move to previous variant
        const variantIndex = variants.findIndex(v => v.id === viewingImage.variantId);
        const prevVariant = variants[variantIndex - 1];
        if (prevVariant && prevVariant.images.length > 0) {
          newVariantId = prevVariant.id;
          newIndex = prevVariant.images.length - 1;
        } else {
          return; // No more images
        }
      }
    }

    setViewingImage({ variantId: newVariantId, imageIndex: newIndex });
  };

  const currentImage = viewingImage
    ? variants.find(v => v.id === viewingImage.variantId)?.images[viewingImage.imageIndex]
    : null;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5" />
                Comparaison Visuelle des Variantes
              </CardTitle>
              <CardDescription>
                Sélectionnez jusqu'à 4 variantes pour les comparer côte à côte
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setComparisonMode(comparisonMode === 'side-by-side' ? 'grid' : 'side-by-side')
                }
              >
                {comparisonMode === 'side-by-side' ? (
                  <>
                    <Grid3x3 className="h-4 w-4 mr-2" />
                    Grille
                  </>
                ) : (
                  <>
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Côte à côte
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Variant Selection */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {variants.map(variant => {
                const isSelected = selectedVariants.includes(variant.id);
                const primaryImage =
                  variant.images.find(img => img.is_primary) || variant.images[0];

                return (
                  <button
                    key={variant.id}
                    onClick={() => toggleVariant(variant.id)}
                    className={cn(
                      'relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    )}
                  >
                    {primaryImage && (
                      <img
                        src={primaryImage.url}
                        alt={variant.label}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-medium">{variant.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {variant.images.length} image{variant.images.length > 1 ? 's' : ''}
                      </div>
                    </div>
                    {isSelected && (
                      <Badge variant="default" className="ml-2">
                        Sélectionné
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedVariants.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez au moins une variante pour commencer la comparaison</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison View */}
      {selectedVariants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vue de Comparaison</CardTitle>
            <CardDescription>
              {selectedVariants.length} variante{selectedVariants.length > 1 ? 's' : ''}{' '}
              sélectionnée
              {selectedVariants.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {comparisonMode === 'side-by-side' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {selectedVariantsData.map(variant => {
                  const primaryImage =
                    variant.images.find(img => img.is_primary) || variant.images[0];

                  return (
                    <div key={variant.id} className="space-y-2">
                      <div className="font-medium text-sm">{variant.label}</div>
                      {primaryImage ? (
                        <div
                          className="relative aspect-square rounded-lg border overflow-hidden cursor-pointer group"
                          onClick={() =>
                            setViewingImage({
                              variantId: variant.id,
                              imageIndex: variant.images.indexOf(primaryImage),
                            })
                          }
                        >
                          <img
                            src={primaryImage.url}
                            alt={primaryImage.alt_text || variant.label}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-square rounded-lg border bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">Aucune image</span>
                        </div>
                      )}

                      {/* Variant Info */}
                      <div className="space-y-1">
                        {variant.sku && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {variant.sku}
                          </div>
                        )}
                        {variant.price && (
                          <div className="font-medium">
                            {variant.price.toLocaleString()} {variant.currency || 'XOF'}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(variant.option_values).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Image Gallery for this variant */}
                      {variant.images.length > 1 && (
                        <div className="flex gap-1 overflow-x-auto pb-2">
                          {variant.images.slice(0, 4).map((image, index) => (
                            <button
                              key={image.id}
                              onClick={() =>
                                setViewingImage({
                                  variantId: variant.id,
                                  imageIndex: index,
                                })
                              }
                              className="flex-shrink-0 w-12 h-12 rounded border overflow-hidden"
                            >
                              <img
                                src={image.url}
                                alt={image.alt_text || `${variant.label} - Image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                          {variant.images.length > 4 && (
                            <div className="flex-shrink-0 w-12 h-12 rounded border bg-muted flex items-center justify-center text-xs">
                              +{variant.images.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <Tabs defaultValue={selectedVariants[0]} className="w-full">
                <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
                  {selectedVariantsData.map(variant => (
                    <TabsTrigger
                      key={variant.id}
                      value={variant.id}
                      className="gap-2 min-h-[44px] shrink-0"
                    >
                      {variant.label}
                      <Badge variant="secondary">{variant.images.length}</Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {selectedVariantsData.map(variant => (
                  <TabsContent key={variant.id} value={variant.id} className="mt-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {variant.images.map((image, index) => (
                        <div
                          key={image.id}
                          className="relative aspect-square rounded-lg border overflow-hidden cursor-pointer group"
                          onClick={() =>
                            setViewingImage({
                              variantId: variant.id,
                              imageIndex: index,
                            })
                          }
                        >
                          <img
                            src={image.url}
                            alt={image.alt_text || `${variant.label} - Image ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          {image.is_primary && (
                            <Badge className="absolute top-2 left-2 bg-yellow-600">Principal</Badge>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lightbox Dialog */}
      {viewingImage && currentImage && (
        <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
          <DialogContent className="w-[calc(100vw-1rem)] max-w-6xl max-h-[90vh] p-0">
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
              <DialogTitle>
                {variants.find(v => v.id === viewingImage.variantId)?.label}
              </DialogTitle>
              <DialogDescription>
                Image {viewingImage.imageIndex + 1} sur{' '}
                {variants.find(v => v.id === viewingImage.variantId)?.images.length || 0}
              </DialogDescription>
            </DialogHeader>

            <div className="relative px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted max-h-[70vh]">
                <img
                  src={currentImage.url}
                  alt={currentImage.alt_text || 'Product image'}
                  className={cn(
                    'w-full h-full object-contain transition-transform',
                    `scale-${Math.round(zoomLevel * 100)}`
                  )}
                  style={{ transform: `scale(${zoomLevel})` }}
                />

                {/* Navigation Buttons */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-11 w-11 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                  onClick={() => navigateImage('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-11 w-11 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                  onClick={() => navigateImage('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Zoom Controls */}
                <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                    onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                    disabled={zoomLevel <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                    onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
                    disabled={zoomLevel >= 3}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Thumbnail Navigation */}
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 flex-nowrap">
                {variants
                  .find(v => v.id === viewingImage.variantId)
                  ?.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setViewingImage({ ...viewingImage, imageIndex: index })}
                      className={cn(
                        'flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded border-2 overflow-hidden transition-all',
                        index === viewingImage.imageIndex
                          ? 'border-primary scale-105'
                          : 'border-muted opacity-60 hover:opacity-100'
                      )}
                    >
                      <img
                        src={image.url}
                        alt={image.alt_text || `Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}






