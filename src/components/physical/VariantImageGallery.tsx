import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Star,
  Eye,
  Download,
  Grid3x3,
  List,
  Plus,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface VariantImage {
  id: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  display_order: number;
  file_size?: number; // in bytes
  dimensions?: {
    width: number;
    height: number;
  };
  created_at: string;
}

export interface VariantWithImages {
  id: string;
  variant_label: string;
  option_values: Record<string, string>;
  sku?: string;
  images: VariantImage[];
}

export interface VariantImageGalleryProps {
  variants: VariantWithImages[];
  onImagesChange: (variantId: string, images: VariantImage[]) => void;
  onUpload?: (variantId: string, files: File[]) => Promise<string[]>;
  maxImagesPerVariant?: number;
  className?: string;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ImageCard({
  image,
  onSetPrimary,
  onDelete,
  onView,
  isPrimary,
}: {
  image: VariantImage;
  onSetPrimary: () => void;
  onDelete: () => void;
  onView: () => void;
  isPrimary: boolean;
}) {
  return (
    <div className="group relative aspect-square rounded-lg border bg-muted overflow-hidden">
      {/* Image */}
      <img
        src={image.url}
        alt={image.alt_text || 'Product variant'}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
      />

      {/* Primary Badge */}
      {isPrimary && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className="gap-1 bg-yellow-600">
            <Star className="h-3 w-3 fill-current" />
            Principal
          </Badge>
        </div>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button variant="secondary" size="sm" onClick={onView}>
          <Eye className="h-4 w-4" />
        </Button>
        {!isPrimary && (
          <Button variant="secondary" size="sm" onClick={onSetPrimary}>
            <Star className="h-4 w-4" />
          </Button>
        )}
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Info */}
      {image.dimensions && (
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <Badge variant="secondary" className="text-xs">
            {image.dimensions.width}x{image.dimensions.height}
          </Badge>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VariantImageGallery({
  variants,
  onImagesChange,
  onUpload,
  maxImagesPerVariant = 10,
  className,
}: VariantImageGalleryProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(variants[0]?.id);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [viewingImage, setViewingImage] = useState<VariantImage | null>(null);
  const [deletingImage, setDeletingImage] = useState<VariantImage | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadUrls, setUploadUrls] = useState<string[]>(['']);
  const [isUploading, setIsUploading] = useState(false);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  // Add URL to list
  const handleAddUrl = (url: string) => {
    if (!selectedVariant || !url.trim()) return;

    const newImage: VariantImage = {
      id: `img_${Date.now()}`,
      url: url.trim(),
      is_primary: selectedVariant.images.length === 0,
      display_order: selectedVariant.images.length,
      created_at: new Date().toISOString(),
    };

    onImagesChange(selectedVariantId!, [...selectedVariant.images, newImage]);
  };

  // Add multiple URLs
  const handleAddMultipleUrls = () => {
    if (!selectedVariant) return;

    const validUrls = uploadUrls.filter((url) => url.trim());
    if (validUrls.length === 0) return;

    setIsUploading(true);

    const newImages: VariantImage[] = validUrls.map((url, index) => ({
      id: `img_${Date.now()}_${index}`,
      url: url.trim(),
      is_primary: selectedVariant.images.length === 0 && index === 0,
      display_order: selectedVariant.images.length + index,
      created_at: new Date().toISOString(),
    }));

    onImagesChange(selectedVariantId!, [...selectedVariant.images, ...newImages]);

    setIsUploading(false);
    setUploadDialogOpen(false);
    setUploadUrls(['']);
  };

  // Set as primary
  const handleSetPrimary = (imageId: string) => {
    if (!selectedVariant) return;

    const updatedImages = selectedVariant.images.map((img) => ({
      ...img,
      is_primary: img.id === imageId,
    }));

    onImagesChange(selectedVariantId!, updatedImages);
  };

  // Delete image
  const handleDeleteImage = (imageId: string) => {
    if (!selectedVariant) return;

    const updatedImages = selectedVariant.images.filter((img) => img.id !== imageId);

    // If we deleted the primary, make the first one primary
    if (updatedImages.length > 0 && !updatedImages.some((img) => img.is_primary)) {
      updatedImages[0].is_primary = true;
    }

    onImagesChange(selectedVariantId!, updatedImages);
    setDeletingImage(null);
  };

  // Reorder images
  const handleReorder = (imageId: string, direction: 'up' | 'down') => {
    if (!selectedVariant) return;

    const currentIndex = selectedVariant.images.findIndex((img) => img.id === imageId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= selectedVariant.images.length) return;

    const reordered = [...selectedVariant.images];
    [reordered[currentIndex], reordered[newIndex]] = [
      reordered[newIndex],
      reordered[currentIndex],
    ];

    // Update display_order
    const updatedImages = reordered.map((img, index) => ({
      ...img,
      display_order: index,
    }));

    onImagesChange(selectedVariantId!, updatedImages);
  };

  // Stats
  const stats = {
    total_images: variants.reduce((sum, v) => sum + v.images.length, 0),
    variants_with_images: variants.filter((v) => v.images.length > 0).length,
    variants_without_images: variants.filter((v) => v.images.length === 0).length,
    avg_images_per_variant:
      variants.length > 0
        ? (variants.reduce((sum, v) => sum + v.images.length, 0) / variants.length).toFixed(1)
        : 0,
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_images}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variantes</CardTitle>
            <Grid3x3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{variants.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avec Images</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.variants_with_images}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sans Images</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.variants_without_images}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Galerie d'Images par Variante</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez les images de chaque variante de produit
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Variant Selector */}
          <Tabs value={selectedVariantId} onValueChange={setSelectedVariantId}>
            <TabsList className="w-full overflow-x-auto flex-wrap h-auto">
              {variants.map((variant) => (
                <TabsTrigger
                  key={variant.id}
                  value={variant.id}
                  className="gap-2 relative"
                >
                  {variant.variant_label}
                  <Badge variant="secondary" className="text-xs">
                    {variant.images.length}
                  </Badge>
                  {variant.images.length === 0 && (
                    <AlertCircle className="h-3 w-3 text-orange-600" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {variants.map((variant) => (
              <TabsContent key={variant.id} value={variant.id} className="space-y-4 mt-6">
                {/* Variant Info */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="font-medium">{variant.variant_label}</h3>
                    {variant.sku && (
                      <p className="text-sm text-muted-foreground font-mono">{variant.sku}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      {Object.entries(variant.option_values).map(([key, value]) => (
                        <Badge key={key} variant="outline">
                          {key}: {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setUploadDialogOpen(true)}
                      className="gap-2"
                      disabled={variant.images.length >= maxImagesPerVariant}
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter Images ({variant.images.length}/{maxImagesPerVariant})
                    </Button>
                  </div>
                </div>

                {/* Images Grid/List */}
                {variant.images.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">
                      Aucune image
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ajoutez des images pour cette variante
                    </p>
                    <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
                      <Upload className="h-4 w-4" />
                      Ajouter des images
                    </Button>
                  </div>
                ) : (
                  <div
                    className={cn(
                      viewMode === 'grid'
                        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                        : 'space-y-4'
                    )}
                  >
                    {variant.images
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((image) => (
                        <ImageCard
                          key={image.id}
                          image={image}
                          isPrimary={image.is_primary}
                          onSetPrimary={() => handleSetPrimary(image.id)}
                          onDelete={() => setDeletingImage(image)}
                          onView={() => setViewingImage(image)}
                        />
                      ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter des Images</DialogTitle>
            <DialogDescription>
              Ajoutez des URLs d'images pour {selectedVariant?.variant_label}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {uploadUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="https://exemple.com/image.jpg"
                    value={url}
                    onChange={(e) => {
                      const newUrls = [...uploadUrls];
                      newUrls[index] = e.target.value;
                      setUploadUrls(newUrls);
                    }}
                  />
                </div>
                {index === uploadUrls.length - 1 ? (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setUploadUrls([...uploadUrls, ''])}
                    disabled={uploadUrls.length >= maxImagesPerVariant}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setUploadUrls(uploadUrls.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <div className="rounded-md bg-muted p-4">
              <p className="text-sm font-medium mb-2">💡 Conseils</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Utilisez des images haute résolution (min 800x800px)</li>
                <li>• Format recommandé : JPG ou PNG</li>
                <li>• La première image sera définie comme image principale</li>
                <li>
                  • Maximum {maxImagesPerVariant} images par variante
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddMultipleUrls}
              disabled={uploadUrls.filter((u) => u.trim()).length === 0 || isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>Ajout en cours...</>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Ajouter ({uploadUrls.filter((u) => u.trim()).length})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Image Dialog */}
      {viewingImage && (
        <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Aperçu de l'Image</DialogTitle>
              <DialogDescription>
                {viewingImage.alt_text || selectedVariant?.variant_label}
              </DialogDescription>
            </DialogHeader>

            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={viewingImage.url}
                alt={viewingImage.alt_text || 'Product image'}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">URL</Label>
                <p className="font-mono text-xs break-all">{viewingImage.url}</p>
              </div>
              {viewingImage.dimensions && (
                <div>
                  <Label className="text-muted-foreground">Dimensions</Label>
                  <p>
                    {viewingImage.dimensions.width} x {viewingImage.dimensions.height}px
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingImage(null)}>
                Fermer
              </Button>
              <Button asChild>
                <a href={viewingImage.url} target="_blank" rel="noopener noreferrer" className="gap-2">
                  <Download className="h-4 w-4" />
                  Télécharger
                </a>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {deletingImage && (
        <AlertDialog open={!!deletingImage} onOpenChange={() => setDeletingImage(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette image ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. L'image sera définitivement supprimée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteImage(deletingImage.id)}
                className="bg-destructive"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

