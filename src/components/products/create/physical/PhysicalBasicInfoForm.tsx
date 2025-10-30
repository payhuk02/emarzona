/**
 * Physical Product - Basic Info Form (Step 1)
 * Date: 27 octobre 2025
 * ✅ Upload images Supabase Storage implémenté
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditorPro } from '@/components/ui/rich-text-editor-pro';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadToSupabaseStorage } from '@/utils/uploadToSupabase';
import type { PhysicalProductFormData } from '@/types/physical-product';
import { AIContentGenerator } from '@/components/products/AIContentGenerator';

interface PhysicalBasicInfoFormProps {
  data: Partial<PhysicalProductFormData>;
  onUpdate: (data: Partial<PhysicalProductFormData>) => void;
}

export const PhysicalBasicInfoForm = ({ data, onUpdate }: PhysicalBasicInfoFormProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const { url, error } = await uploadToSupabaseStorage(file, {
          bucket: 'product-images',
          path: 'physical',
          filePrefix: 'product',
          onProgress: (progress) => setUploadProgress(progress),
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
          title: "✅ Images uploadées",
          description: `${validUrls.length} image(s) ajoutée(s) avec succès`,
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "❌ Erreur d'upload",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
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
    <div className="space-y-6">
      {/* Product Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Nom du produit *</Label>
        <Input
          id="name"
          placeholder="Ex: T-shirt coton bio"
          value={data.name || ''}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
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
            onContentGenerated={(content) => {
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
          onChange={(content) => onUpdate({ description: content })}
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
            onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
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
            onChange={(e) => onUpdate({ compare_at_price: parseFloat(e.target.value) || null })}
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
            onChange={(e) => onUpdate({ cost_per_item: parseFloat(e.target.value) || null })}
          />
          <p className="text-xs text-muted-foreground">Pour vos calculs</p>
        </div>
      </div>

      {/* Images */}
      <div className="space-y-2">
        <Label>Images du produit *</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.images?.map((image, index) => (
            <div key={index} className="relative aspect-square rounded-lg border overflow-hidden group">
              <img
                src={image}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <label className={`aspect-square rounded-lg border-2 border-dashed transition-colors flex items-center justify-center flex-col gap-2 ${
            uploading 
              ? 'border-primary bg-primary/5 cursor-wait' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer text-muted-foreground hover:text-foreground'
          }`}>
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
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            id="tags"
            placeholder="Ajouter un tag"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleTagAdd(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Appuyez sur Entrée pour ajouter un tag
        </p>
      </div>
    </div>
  );
};
