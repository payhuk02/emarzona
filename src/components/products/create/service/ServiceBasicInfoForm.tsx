/**
 * Service - Basic Info Form (Step 1)
 * Date: 28 octobre 2025
 * ✅ Upload images Supabase Storage implémenté
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditorPro } from '@/components/ui/rich-text-editor-pro';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencySelect } from '@/components/ui/currency-select';
import { AIContentGenerator } from '@/components/products/AIContentGenerator';
import { ImagePlus, X, Loader2, Gift, Info } from 'lucide-react';
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
        {/* Génération IA */}
        <div className="mb-2">
          <AIContentGenerator
            productInfo={{
              name: data.name || '',
              type: 'service',
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
          placeholder="Décrivez votre service en détail..."
          showWordCount={true}
          maxHeight="400px"
        />
      </div>

      {/* Tarification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tarification</CardTitle>
          <CardDescription>
            Définissez le prix de votre service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                Prix <span className="text-red-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="25000"
                value={data.price || ''}
                onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <CurrencySelect
                value={data.currency || 'XOF'}
                onValueChange={(value) => onUpdate({ currency: value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promotional_price">Prix promotionnel (optionnel)</Label>
            <Input
              id="promotional_price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={data.promotional_price || ''}
              onChange={(e) => onUpdate({ promotional_price: parseFloat(e.target.value) || undefined })}
            />
            {data.promotional_price && data.price && data.promotional_price < data.price && (
              <p className="text-sm text-green-600">
                Réduction de {Math.round(((data.price - data.promotional_price) / data.price) * 100)}%
              </p>
            )}
          </div>

          {/* Modèle de tarification */}
          <div className="space-y-2">
            <Label htmlFor="pricing_model">
              Modèle de tarification <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.pricing_model || 'one-time'}
              onValueChange={(value) => {
                onUpdate({ pricing_model: value });
                if (value === 'free') {
                  onUpdate({ price: 0 });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un modèle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time">
                  <div className="flex flex-col">
                    <span className="font-medium">Paiement unique</span>
                    <span className="text-xs text-muted-foreground">
                      Prix fixe pour une réservation
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="subscription">
                  <div className="flex flex-col">
                    <span className="font-medium">Abonnement</span>
                    <span className="text-xs text-muted-foreground">
                      Service disponible via abonnement récurrent
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="free">
                  <div className="flex flex-col">
                    <span className="font-medium">Gratuit</span>
                    <span className="text-xs text-muted-foreground">
                      Service accessible gratuitement
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="pay-what-you-want">
                  <div className="flex flex-col">
                    <span className="font-medium">Prix libre</span>
                    <span className="text-xs text-muted-foreground">
                      Le client choisit le montant (minimum possible)
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {data.pricing_model === 'free' && (
              <p className="text-sm text-blue-600 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Ce service sera accessible gratuitement par tous les visiteurs
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Service Preview Gratuit */}
      {data.pricing_model !== 'free' && (
        <Card className="border-2 border-dashed border-purple-300 dark:border-purple-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-500" />
              Service Preview Gratuit
            </CardTitle>
            <CardDescription>
              Créez une version gratuite qui présente un aperçu du service payant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="create_free_preview"
                checked={data.create_free_preview || false}
                onChange={(e) => onUpdate({ create_free_preview: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="create_free_preview" className="font-medium cursor-pointer">
                Créer automatiquement un service gratuit preview
              </Label>
            </div>

            {data.create_free_preview && (
              <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="space-y-2">
                  <Label htmlFor="preview_content_description">
                    Description du contenu preview
                  </Label>
                  <Textarea
                    id="preview_content_description"
                    placeholder="Ex: Consultation gratuite de 15 minutes pour discuter de vos besoins. Le service complet dure 60 minutes."
                    value={data.preview_content_description || ''}
                    onChange={(e) => onUpdate({ preview_content_description: e.target.value })}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {data.preview_content_description?.length || 0} / 500 caractères
                  </p>
                </div>

                <div className="flex items-start gap-2 p-2 rounded bg-white dark:bg-gray-800">
                  <Info className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-semibold mb-1">Comment ça fonctionne :</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Un service gratuit sera créé avec le nom "{data.name || 'Votre service'} - Version Preview Gratuite"</li>
                      <li>La durée sera automatiquement réduite (15min au lieu de 60min par exemple)</li>
                      <li>Les clients pourront réserver gratuitement le preview</li>
                      <li>Un lien vers la version complète payante sera affiché sur le preview</li>
                      <li>Les créneaux de disponibilité seront copiés depuis le service payant</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

