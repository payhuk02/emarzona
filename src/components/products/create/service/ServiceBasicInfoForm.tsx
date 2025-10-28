/**
 * Service - Basic Info Form (Step 1)
 * Date: 28 octobre 2025
 * ✅ Upload images Supabase Storage implémenté
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadToSupabaseStorage } from '@/utils/uploadToSupabase';
import type { ServiceProductFormData } from '@/types/service-product';

interface ServiceBasicInfoFormProps {
  data: Partial<ServiceProductFormData>;
  onUpdate: (data: Partial<ServiceProductFormData>) => void;
}

export const ServiceBasicInfoForm = ({ data, onUpdate }: ServiceBasicInfoFormProps) => {
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
          path: 'services',
          filePrefix: 'service',
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
      {/* Service Type */}
      <div className="space-y-2">
        <Label htmlFor="service_type">Type de service *</Label>
        <Select
          value={data.service_type}
          onValueChange={(value) => onUpdate({ service_type: value as any })}
        >
          <SelectTrigger id="service_type">
            <SelectValue placeholder="Sélectionnez un type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="appointment">Rendez-vous</SelectItem>
            <SelectItem value="class">Cours / Formation</SelectItem>
            <SelectItem value="event">Événement</SelectItem>
            <SelectItem value="consultation">Consultation</SelectItem>
            <SelectItem value="other">Autre</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choisissez le type qui correspond le mieux à votre service
        </p>
      </div>

      {/* Service Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Nom du service *</Label>
        <Input
          id="name"
          placeholder="Ex: Consultation juridique 1h"
          value={data.name || ''}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Décrivez votre service en détail..."
          value={data.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={6}
        />
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="price">Prix (XOF) *</Label>
        <Input
          id="price"
          type="number"
          min="0"
          step="1"
          placeholder="25000"
          value={data.price || ''}
          onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
        />
        <p className="text-xs text-muted-foreground">
          Prix de base du service (peut être modifié selon la durée)
        </p>
      </div>

      {/* Images */}
      <div className="space-y-2">
        <Label>Images du service</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.images?.map((image, index) => (
            <div key={index} className="relative aspect-square rounded-lg border overflow-hidden group">
              <img
                src={image}
                alt={`Service ${index + 1}`}
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

