/**
 * Digital Product - Basic Info Form (Step 1)
 * Date: 27 octobre 2025
 */

import { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditorPro } from '@/components/ui/rich-text-editor-pro';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectField,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencySelect } from '@/components/ui/currency-select';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, X, Gift, Info } from '@/components/icons';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { generateSlug } from '@/lib/store-utils';
import { supabase } from '@/integrations/supabase/client';
import { AIContentGenerator } from '@/components/products/AIContentGenerator';
import { logger } from '@/lib/logger';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import { uploadToSupabaseStorage } from '@/utils/uploadToSupabase';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getCategoriesForProductType } from '@/constants/product-categories';

import type {
  DigitalProductFormData,
  DigitalProductFormDataUpdate,
} from '@/types/digital-product-form';

interface DigitalBasicInfoFormProps {
  formData: DigitalProductFormData;
  updateFormData: (updates: DigitalProductFormDataUpdate) => void;
  storeSlug: string;
}

// Utiliser les catégories centralisées pour les produits digitaux
const DIGITAL_CATEGORIES = getCategoriesForProductType('digital');

export const DigitalBasicInfoForm = ({
  formData,
  updateFormData,
  storeSlug,
}: DigitalBasicInfoFormProps) => {
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [customCategory, setCustomCategory] = useState<string>('');
  const { toast } = useToast();

  // Ref pour stocker la valeur réelle du champ (source de vérité)
  const inputRef = useRef<HTMLInputElement>(null);
  const nameValueRef = useRef<string>(formData.name || '');
  const isUpdatingFromFormDataRef = useRef(false);

  // Hook pour corriger le problème d'espacement
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();

  // Vérifier si la catégorie actuelle est "autre" ou une valeur personnalisée
  const isCustomCategory =
    formData.category === 'autre' ||
    (formData.category && !DIGITAL_CATEGORIES.some(cat => cat.value === formData.category));

  // Pré-remplir le champ personnalisé si la catégorie est personnalisée
  useEffect(() => {
    if (isCustomCategory && formData.category && formData.category !== 'autre') {
      setCustomCategory(formData.category);
    } else if (!isCustomCategory) {
      setCustomCategory('');
    }
  }, [formData.category, isCustomCategory]);

  // Synchroniser la valeur de l'input avec formData.name seulement si elle change de l'extérieur
  useEffect(() => {
    if (
      !isUpdatingFromFormDataRef.current &&
      inputRef.current &&
      formData.name !== inputRef.current.value
    ) {
      // La valeur a changé de l'extérieur, synchroniser
      inputRef.current.value = formData.name || '';
      nameValueRef.current = formData.name || '';
    }
    isUpdatingFromFormDataRef.current = false;
  }, [formData.name]);

  /**
   * Auto-generate slug from name (only when name changes and slug is empty)
   * TEMPORAIREMENT DÉSACTIVÉ pour diagnostiquer le problème d'espacement
   * Le slug sera généré uniquement via le bouton de régénération
   */
  // const prevNameRef = useRef<string>('');
  // useEffect(() => {
  //   // Only generate slug if name changed and slug is empty
  //   if (formData.name && !formData.slug && formData.name !== prevNameRef.current) {
  //     const newSlug = generateSlug(formData.name);
  //     updateFormData({ slug: newSlug });
  //     prevNameRef.current = formData.name;
  //   }
  // }, [formData.name, formData.slug, updateFormData]);

  /**
   * Check slug availability
   */
  const checkSlug = async (slug: string) => {
    if (!slug || !formData.store_id) return;

    setSlugChecking(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .eq('store_id', formData.store_id);

      if (error) throw error;

      setSlugAvailable(data.length === 0);
    } catch (error) {
      logger.error('Error checking slug', { error, slug });
    } finally {
      setSlugChecking(false);
    }
  };

  /**
   * Regenerate slug
   */
  const regenerateSlug = () => {
    if (formData.name) {
      const newSlug = generateSlug(formData.name);
      updateFormData({ slug: newSlug });
      checkSlug(newSlug);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Product Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Nom du produit <span className="text-destructive">*</span>
        </Label>
        <input
          ref={inputRef}
          id="name"
          type="text"
          placeholder="Ex: Ebook - Guide complet du Marketing Digital"
          value={formData.name || ''}
          onChange={e => {
            const value = e.target.value;
            nameValueRef.current = value;
            isUpdatingFromFormDataRef.current = true;
            logger.info('Name onChange - BEFORE updateFormData', {
              value,
              hasSpaces: value.includes(' '),
              length: value.length,
              charCodes: value.split('').map(c => c.charCodeAt(0)),
            });
            updateFormData({ name: value });
          }}
          onKeyDown={e => {
            if (e.key === ' ') {
              handleSpaceKeyDown(e);
              // Mettre à jour formData après l'insertion de l'espace
              const target = e.target as HTMLInputElement;
              const newValue = target.value;
              nameValueRef.current = newValue;
              isUpdatingFromFormDataRef.current = true;
              updateFormData({ name: newValue });
            }
          }}
          required
          autoComplete="off"
          spellCheck="false"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-xs sm:file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-sm text-muted-foreground">
          Donnez un nom clair et descriptif à votre produit
        </p>
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label htmlFor="slug">URL du produit</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              id="slug"
              value={formData.slug || ''}
              onChange={e => {
                updateFormData({ slug: e.target.value });
                checkSlug(e.target.value);
              }}
              onBlur={() => checkSlug(formData.slug)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={regenerateSlug}
            disabled={!formData.name || slugChecking}
            aria-label="Régénérer l'URL du produit à partir du nom"
            className="transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {slugChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw
                className="h-4 w-4 transition-transform duration-200 hover:rotate-180"
                aria-hidden="true"
              />
            )}
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm transition-all duration-200">
          <span className="text-muted-foreground font-mono text-xs">
            {storeSlug}/products/{formData.slug || '...'}
          </span>
          {slugChecking && (
            <span className="flex items-center gap-1 text-muted-foreground animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              Vérification...
            </span>
          )}
          {slugAvailable === true && (
            <span className="flex items-center gap-1 text-green-600 transition-colors duration-200">
              <Check className="h-4 w-4" />
              Disponible
            </span>
          )}
          {slugAvailable === false && (
            <span className="flex items-center gap-1 text-destructive transition-colors duration-200">
              <X className="h-4 w-4" />
              Déjà utilisé
            </span>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <SelectField
          label="Catégorie"
          contentVariant="sheet"
          useMobileSelectRoot
          value={formData.category || 'ebook'}
          onValueChange={value => {
            updateFormData({ category: value });
            // Réinitialiser la catégorie personnalisée si on change de catégorie
            if (value !== 'autre') {
              setCustomCategory('');
            }
          }}
          required
          placeholder="Sélectionnez une catégorie"
        >
          {DIGITAL_CATEGORIES.map(cat => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectField>

        {/* Champ personnalisé pour "Autre" */}
        {isCustomCategory && (
          <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <Label htmlFor="custom_category">
              Précisez la catégorie <span className="text-destructive">*</span>
            </Label>
            <Input
              id="custom_category"
              type="text"
              value={customCategory}
              onChange={e => {
                const value = e.target.value;
                setCustomCategory(value);
                // Mettre à jour la catégorie avec la valeur personnalisée
                updateFormData({ category: value });
              }}
              placeholder="Ex: Formation en développement web"
              required
              className="text-base sm:text-sm mt-1"
              onKeyDown={handleSpaceKeyDown}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Indiquez la catégorie personnalisée pour votre produit
            </p>
          </div>
        )}
      </div>

      {/* Short Description */}
      <div className="space-y-2">
        <Label htmlFor="short_description">Description courte</Label>
        <Textarea
          id="short_description"
          placeholder="Une brève description de votre produit (1-2 phrases)"
          value={formData.short_description || ''}
          onChange={e => updateFormData({ short_description: e.target.value })}
          onKeyDown={handleSpaceKeyDown}
          rows={2}
          maxLength={160}
          className="min-h-[44px] sm:min-h-[auto] text-base sm:text-sm"
        />
        <p className="text-sm text-muted-foreground">
          {formData.short_description?.length || 0} / 160 caractères
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description complète</Label>
        {/* Génération IA */}
        <div className="mb-2">
          <AIContentGenerator
            productInfo={{
              name: formData.name || '',
              type: 'digital',
              category: formData.category,
              price: formData.price,
              features: formData.features,
            }}
            onContentGenerated={content => {
              updateFormData({
                short_description: content.shortDescription,
                description: content.longDescription,
                features: content.features,
              });
            }}
          />
        </div>
        <RichTextEditorPro
          content={formData.description || ''}
          onChange={content => updateFormData({ description: content })}
          placeholder="Décrivez votre produit en détail : contenu, bénéfices, utilisation..."
          showWordCount={true}
          maxHeight="400px"
        />
      </div>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tarification</CardTitle>
          <CardDescription>Définissez le prix de votre produit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                Prix <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.price || ''}
                onChange={e => updateFormData({ price: parseFloat(e.target.value) || 0 })}
                required
                className="text-base sm:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <CurrencySelect
                value={formData.currency || 'XOF'}
                onValueChange={value => updateFormData({ currency: value })}
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
              value={formData.promotional_price || ''}
              onChange={e =>
                updateFormData({ promotional_price: parseFloat(e.target.value) || undefined })
              }
              className="text-base sm:text-sm"
            />
            {formData.promotional_price && formData.promotional_price < formData.price && (
              <p className="text-sm text-green-600">
                Réduction de{' '}
                {Math.round(((formData.price - formData.promotional_price) / formData.price) * 100)}
                %
              </p>
            )}
          </div>

          {/* Modèle de tarification */}
          <div className="space-y-2">
            <SelectField
              label="Modèle de tarification"
              contentVariant="sheet"
              useMobileSelectRoot
              value={formData.pricing_model || 'one-time'}
              onValueChange={value => {
                updateFormData({
                  pricing_model: value as
                    | 'one-time'
                    | 'subscription'
                    | 'free'
                    | 'pay-what-you-want',
                  price: value === 'free' ? 0 : formData.price || 0,
                });
              }}
              required
              placeholder="Sélectionnez un modèle"
            >
              <SelectItem value="one-time">
                <div className="flex flex-col">
                  <span className="font-medium">Achat unique</span>
                  <span className="text-xs text-muted-foreground">
                    Paiement une seule fois, accès permanent
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="subscription">
                <div className="flex flex-col">
                  <span className="font-medium">Abonnement</span>
                  <span className="text-xs text-muted-foreground">
                    Paiement récurrent (mensuel/annuel)
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="free">
                <div className="flex flex-col">
                  <span className="font-medium">Gratuit</span>
                  <span className="text-xs text-muted-foreground">
                    Produit téléchargeable gratuitement
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="pay-what-you-want">
                <div className="flex flex-col">
                  <span className="font-medium">Prix libre</span>
                  <span className="text-xs text-muted-foreground">
                    L'acheteur choisit le montant (minimum possible)
                  </span>
                </div>
              </SelectItem>
            </SelectField>
            {formData.pricing_model === 'free' && (
              <p className="text-sm text-blue-600 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Ce produit sera accessible gratuitement par tous les visiteurs
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Produit Preview Gratuit */}
      {formData.pricing_model !== 'free' && (
        <Card className="border-2 border-dashed border-purple-300 dark:border-purple-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-500" />
              Produit Preview Gratuit
            </CardTitle>
            <CardDescription>
              Créez une version gratuite qui présente un aperçu du contenu payant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="create_free_preview"
                checked={formData.create_free_preview || false}
                onChange={e => updateFormData({ create_free_preview: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="create_free_preview" className="font-medium cursor-pointer">
                Créer automatiquement un produit gratuit preview
              </Label>
            </div>

            {formData.create_free_preview && (
              <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="space-y-2">
                  <Label htmlFor="preview_content_description">
                    Description du contenu preview
                  </Label>
                  <Textarea
                    id="preview_content_description"
                    placeholder="Ex: Contient les 3 premiers chapitres sur 10 du guide complet. Inclut les bases et une introduction aux concepts avancés."
                    value={formData.preview_content_description || ''}
                    onChange={e => updateFormData({ preview_content_description: e.target.value })}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.preview_content_description?.length || 0} / 500 caractères
                  </p>
                </div>

                <div className="flex items-start gap-2 p-2 rounded bg-white dark:bg-gray-800">
                  <Info className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-semibold mb-1">Comment ça fonctionne :</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        Un produit gratuit sera créé avec le nom "{formData.name || 'Votre produit'}{' '}
                        - Version Preview Gratuite"
                      </li>
                      <li>
                        Seuls les fichiers marqués comme "preview" seront inclus dans le produit
                        gratuit
                      </li>
                      <li>Les visiteurs pourront télécharger gratuitement le preview</li>
                      <li>Un lien vers la version complète payante sera affiché sur le preview</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Images Upload - Multiple */}
      <div className="space-y-2">
        <Label htmlFor="images_upload">Images du produit</Label>
        <p className="text-xs text-muted-foreground">
          Ajoutez plusieurs images pour montrer différents angles ou détails du produit.
        </p>
        <p className="text-xs text-muted-foreground mb-2">
          Format recommandé: <span className="font-semibold">1536×1024 px</span> (ratio 3:2), en
          WebP ou JPEG, pour un rendu optimal sur la boutique et le marketplace.
        </p>

        {/* Grille d'images existantes */}
        {(formData.images && formData.images.length > 0) || formData.image_url ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {/* Afficher les images du tableau images */}
            {(formData.images || []).map((imageUrl: string, index: number) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Produit ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                  loading="lazy"
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-11 w-11 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation min-h-[44px] min-w-[44px]"
                  onClick={() => {
                    const currentImages = formData.images || [];
                    const newImages = currentImages.filter((_: string, i: number) => i !== index);
                    // Mettre à jour images et image_url (première image)
                    updateFormData({
                      images: newImages,
                      image_url: newImages[0] || '',
                    });
                  }}
                  disabled={uploadingImage}
                  aria-label={`Supprimer l'image ${index + 1}`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ))}

            {/* Afficher image_url si elle existe et n'est pas dans images */}
            {formData.image_url &&
              (!formData.images || !formData.images.includes(formData.image_url)) && (
                <div className="relative group">
                  <img
                    src={formData.image_url}
                    alt="Preview produit"
                    className="w-full h-32 object-cover rounded-lg border"
                    loading="lazy"
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-11 w-11 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation min-h-[44px] min-w-[44px]"
                    onClick={() => {
                      updateFormData({ image_url: '' });
                    }}
                    disabled={uploadingImage}
                    aria-label="Supprimer l'image du produit"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              )}

            {/* Zone d'ajout d'image */}
            <label
              htmlFor="images_upload"
              className={cn(
                'flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                'h-32 sm:h-32 md:h-40 min-h-[120px] touch-manipulation',
                uploadingImage ? 'bg-muted/70 cursor-not-allowed' : 'hover:bg-muted/50',
                'border-muted-foreground/25'
              )}
            >
              {uploadingImage ? (
                <div className="flex flex-col items-center gap-1">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {uploadProgress.toFixed(0)}%
                  </span>
                </div>
              ) : (
                <>
                  <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground text-center px-2">Ajouter</span>
                </>
              )}
            </label>
          </div>
        ) : (
          <label
            htmlFor="images_upload"
            className={cn(
              'flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer transition-colors',
              'h-32 sm:h-32 md:h-40 min-h-[120px] touch-manipulation',
              uploadingImage ? 'bg-muted/70 cursor-not-allowed' : 'hover:bg-muted/50',
              'border-muted-foreground/25'
            )}
          >
            {uploadingImage ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Upload en cours... {uploadProgress.toFixed(0)}%
                </span>
                <Progress value={uploadProgress} className="w-3/4 h-2 mt-2" />
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Cliquez pour uploader des images
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, WEBP (max 10MB par image)
                </span>
              </>
            )}
          </label>
        )}

        <input
          id="images_upload"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          multiple
          onChange={async e => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            // Validation taille et type pour tous les fichiers
            const maxSize = 10 * 1024 * 1024; // 10MB
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
            const invalidFiles: string[] = [];

            for (const file of Array.from(files)) {
              if (file.size > maxSize) {
                invalidFiles.push(`${file.name} (trop volumineux)`);
                continue;
              }
              if (!validTypes.includes(file.type)) {
                invalidFiles.push(`${file.name} (format non supporté)`);
                continue;
              }
            }

            if (invalidFiles.length > 0) {
              toast({
                title: '❌ Fichiers invalides',
                description: `Les fichiers suivants ne peuvent pas être uploadés : ${invalidFiles.join(', ')}`,
                variant: 'destructive',
              });
              e.target.value = '';
              return;
            }

            setUploadingImage(true);
            setUploadProgress(0);

            try {
              const uploadPromises = Array.from(files).map(async (file, index) => {
                const { url, error } = await uploadToSupabaseStorage(file, {
                  bucket: 'product-images',
                  path: 'digital',
                  filePrefix: 'product',
                  onProgress: progress => {
                    // Calculer la progression globale pour tous les fichiers
                    const fileProgress = (index / files.length) * 100 + progress / files.length;
                    setUploadProgress(fileProgress);
                  },
                  maxSizeBytes: maxSize,
                  allowedTypes: validTypes,
                });

                if (error) throw error;
                return url;
              });

              const uploadedUrls = await Promise.all(uploadPromises);
              const validUrls = uploadedUrls.filter((url): url is string => !!url);

              if (validUrls.length > 0) {
                const currentImages = formData.images || [];
                const existingImageUrl = formData.image_url ? [formData.image_url] : [];
                const allImages = [...existingImageUrl, ...currentImages, ...validUrls].filter(
                  (url, index, self) => self.indexOf(url) === index // Supprimer les doublons
                );

                updateFormData({
                  images: allImages,
                  image_url: allImages[0] || formData.image_url, // Première image comme image_url
                });

                toast({
                  title: '✅ Images uploadées',
                  description: `${validUrls.length} image(s) uploadée(s) avec succès`,
                });
              }
            } catch (error) {
              logger.error('Erreur upload images produit', { error });
              toast({
                title: "❌ Erreur d'upload",
                description: error instanceof Error ? error.message : 'Une erreur est survenue',
                variant: 'destructive',
              });
            } finally {
              setUploadingImage(false);
              setUploadProgress(0);
              e.target.value = ''; // Reset input
            }
          }}
          className="hidden"
          disabled={uploadingImage}
        />
      </div>

      {/* Licensing Type (PLR / Copyright) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Type de licence et droits</CardTitle>
          <CardDescription>
            Définissez les droits d'utilisation et de commercialisation de votre produit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <SelectField
            label="Type de licence"
            contentVariant="sheet"
            value={formData.licensing_type || 'standard'}
            onValueChange={value =>
              updateFormData({ licensing_type: value as 'plr' | 'copyrighted' | 'standard' })
            }
            required
            placeholder="Sélectionnez un type de licence"
          >
            <SelectItem value="standard">
              <div className="flex flex-col">
                <span className="font-medium">Licence standard</span>
                <span className="text-xs text-muted-foreground">
                  Utilisation personnelle uniquement, pas de revente
                </span>
              </div>
            </SelectItem>
            <SelectItem value="plr">
              <div className="flex flex-col">
                <span className="font-medium">PLR (Private Label Rights)</span>
                <span className="text-xs text-muted-foreground">
                  Droits de label privé - Peut être revendu avec modifications
                </span>
              </div>
            </SelectItem>
            <SelectItem value="copyrighted">
              <div className="flex flex-col">
                <span className="font-medium">Protégé par droit d'auteur</span>
                <span className="text-xs text-muted-foreground">
                  Copyright strict - Aucune utilisation commerciale sans autorisation
                </span>
              </div>
            </SelectItem>
          </SelectField>
          <p className="text-sm text-muted-foreground">
            Le type de licence définit comment votre produit peut être utilisé par les acheteurs
          </p>

          <div className="space-y-2">
            <Label htmlFor="license_terms">Conditions de licence (optionnel)</Label>
            <Textarea
              id="license_terms"
              placeholder="Détails supplémentaires sur les conditions d'utilisation, restrictions, permissions..."
              value={formData.license_terms || ''}
              onChange={e => updateFormData({ license_terms: e.target.value })}
              rows={4}
              maxLength={1000}
              className="min-h-[44px] sm:min-h-[auto] text-base sm:text-sm"
            />
            <p className="text-sm text-muted-foreground">
              {formData.license_terms?.length || 0} / 1000 caractères
            </p>
            <p className="text-xs text-muted-foreground">
              Ces conditions seront visibles sur la page du produit pour informer les acheteurs
            </p>
          </div>

          {/* Info badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {formData.licensing_type === 'plr' && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  ✓ PLR : Les acheteurs peuvent revendre ce produit avec modifications
                </span>
              </div>
            )}
            {formData.licensing_type === 'copyrighted' && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <span className="text-red-600 dark:text-red-400 font-semibold text-xs">
                  © Copyright : Utilisation personnelle uniquement, pas de revente
                </span>
              </div>
            )}
            {formData.licensing_type === 'standard' && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">
                  ℹ Licence standard : Utilisation personnelle uniquement
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
