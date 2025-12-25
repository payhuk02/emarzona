/**
 * Physical Product - Basic Info Form (Step 1)
 * Date: 27 octobre 2025
 * ✅ Upload images Supabase Storage implémenté
 */

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditorPro } from '@/components/ui/rich-text-editor-pro';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadToSupabaseStorage } from '@/utils/uploadToSupabase';
import type { PhysicalProductFormData } from '@/types/physical-product';
import { AIContentGenerator } from '@/components/products/AIContentGenerator';
import { logger } from '@/lib/logger';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import { generateSlug } from '@/lib/store-utils';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/hooks/useStore';

interface PhysicalBasicInfoFormProps {
  data: Partial<PhysicalProductFormData>;
  onUpdate: (data: Partial<PhysicalProductFormData>) => void;
  storeSlug?: string;
}

export const PhysicalBasicInfoForm = ({
  data,
  onUpdate,
  storeSlug,
}: PhysicalBasicInfoFormProps) => {
  const { toast } = useToast();
  const { store } = useStore();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();

  /**
   * Check slug availability
   */
  const checkSlug = async (slug: string) => {
    if (!slug || !store?.id) return;

    setSlugChecking(true);
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .eq('store_id', store.id);

      if (error) throw error;

      setSlugAvailable(products.length === 0);
    } catch (error) {
      logger.error('Error checking slug', { error, slug });
      setSlugAvailable(null);
    } finally {
      setSlugChecking(false);
    }
  };

  /**
   * Regenerate slug from name
   */
  const regenerateSlug = () => {
    if (data.name) {
      const newSlug = generateSlug(data.name);
      onUpdate({ slug: newSlug });
      checkSlug(newSlug);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = Array.from(files).map(async file => {
        const { url, error } = await uploadToSupabaseStorage(file, {
          bucket: 'product-images',
          path: 'physical',
          filePrefix: 'product',
          onProgress: progress => setUploadProgress(progress),
        });

        if (error) {
          throw error;
        }

        return url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url): url is string => url !== null);

      if (validUrls.length > 0) {
        onUpdate({ images: [...(data.images || []), ...validUrls] });

        toast({
          title: '✅ Images uploadées',
          description: `${validUrls.length} image(s) ajoutée(s) avec succès`,
        });
      }
    } catch (error) {
      logger.error('Upload error', { error });
      toast({
        title: "❌ Erreur d'upload",
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...(data.images || [])];
    newImages.splice(index, 1);
    onUpdate({ images: newImages });
  };

  const handleTagAdd = (tag: string) => {
    if (!tag.trim()) return;
    const newTags = [...(data.tags || []), tag.trim()];
    onUpdate({ tags: newTags });
  };

  const handleTagRemove = (index: number) => {
    const newTags = [...(data.tags || [])];
    newTags.splice(index, 1);
    onUpdate({ tags: newTags });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Product Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Nom du produit *</Label>
        <Input
          id="name"
          placeholder="Ex: T-shirt coton bio"
          value={data.name || ''}
          onChange={e => onUpdate({ name: e.target.value })}
          onKeyDown={handleSpaceKeyDown}
        />
      </div>

      {/* Slug / URL du produit */}
      {storeSlug && (
        <div className="space-y-2">
          <Label htmlFor="slug">URL du produit</Label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                id="slug"
                value={data.slug || ''}
                onChange={e => {
                  onUpdate({ slug: e.target.value });
                  if (e.target.value) {
                    checkSlug(e.target.value);
                  }
                }}
                onBlur={() => {
                  if (data.slug) {
                    checkSlug(data.slug);
                  }
                }}
                placeholder="url-du-produit"
                className="pr-10"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {storeSlug}/products/{data.slug || '...'}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={regenerateSlug}
              disabled={!data.name || slugChecking}
              className="shrink-0"
            >
              {slugChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
          {slugChecking && <p className="text-xs text-muted-foreground">Vérification...</p>}
          {slugAvailable === true && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              URL disponible
            </p>
          )}
          {slugAvailable === false && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              URL déjà utilisée
            </p>
          )}
        </div>
      )}

      {/* Short Description */}
      <div className="space-y-2">
        <Label htmlFor="short_description">Description courte</Label>
        <Textarea
          id="short_description"
          placeholder="Une brève description de votre produit (1-2 phrases)"
          value={data.short_description || ''}
          onChange={e => onUpdate({ short_description: e.target.value })}
          onKeyDown={handleSpaceKeyDown}
          rows={2}
          maxLength={160}
          className="min-h-[44px] sm:min-h-[auto] text-base sm:text-sm"
        />
        <p className="text-sm text-muted-foreground">
          {data.short_description?.length || 0} / 160 caractères
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description complète *</Label>
        {/* Génération IA */}
        <div className="mb-2">
          <AIContentGenerator
            productInfo={{
              name: data.name || '',
              type: 'physical',
              category: data.category,
              price: Number(data.price) || undefined,
              features: data.features,
            }}
            onContentGenerated={content => {
              onUpdate({
                short_description: content.shortDescription,
                description: content.longDescription,
                features: content.features,
              });
            }}
          />
        </div>
        <RichTextEditorPro
          content={data.description || ''}
          onChange={content => onUpdate({ description: content })}
          placeholder="Décrivez votre produit en détail..."
          showWordCount={true}
          maxHeight="400px"
        />
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Prix de vente (XOF) *</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="1"
            placeholder="10000"
            value={data.price || ''}
            onChange={e => onUpdate({ price: parseFloat(e.target.value) || 0 })}
            className="text-base sm:text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="compare_at_price">Prix de comparaison (XOF)</Label>
          <Input
            id="compare_at_price"
            type="number"
            min="0"
            step="1"
            placeholder="15000"
            value={data.compare_at_price || ''}
            onChange={e => onUpdate({ compare_at_price: parseFloat(e.target.value) || null })}
            className="text-base sm:text-sm"
          />
          <p className="text-xs text-muted-foreground">Prix barré</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost_per_item">Coût par article (XOF)</Label>
          <Input
            id="cost_per_item"
            type="number"
            min="0"
            step="1"
            placeholder="5000"
            value={data.cost_per_item || ''}
            onChange={e => onUpdate({ cost_per_item: parseFloat(e.target.value) || null })}
            className="text-base sm:text-sm"
          />
          <p className="text-xs text-muted-foreground">Pour vos calculs</p>
        </div>
      </div>

      {/* Images */}
      <div className="space-y-2">
        <Label>Images du produit *</Label>
        <p className="text-xs text-muted-foreground">
          Ajoutez plusieurs images pour montrer différents angles ou détails du produit.
        </p>
        <p className="text-xs text-muted-foreground">
          Format recommandé: <span className="font-semibold">1536×1024 px</span> (ratio 3:2), en
          WebP ou JPEG, pour un rendu optimal sur la boutique et le marketplace.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {data.images?.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg border overflow-hidden group"
            >
              <img
                src={image}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={`Supprimer l'image ${index + 1}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}

          <label
            className={`aspect-square rounded-lg border-2 border-dashed transition-colors flex items-center justify-center flex-col gap-2 min-h-[120px] touch-manipulation ${
              uploading
                ? 'border-primary bg-primary/5 cursor-wait'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer text-muted-foreground hover:text-foreground'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-primary font-medium">{uploadProgress}%</span>
                <span className="text-xs text-muted-foreground">Upload...</span>
              </>
            ) : (
              <>
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm">Ajouter</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {data.tags?.map((tag, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() => handleTagRemove(index)}
                className="hover:text-destructive transition-colors duration-200 rounded-sm p-0.5 hover:bg-destructive/10 touch-manipulation min-h-[24px] min-w-[24px] flex items-center justify-center"
                aria-label={`Supprimer le tag "${tag}"`}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            id="tags"
            placeholder="Ajouter un tag"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleTagAdd(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">Appuyez sur Entrée pour ajouter un tag</p>
      </div>
    </div>
  );
};
