import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditorPro } from '@/components/ui/rich-text-editor-pro';
import { AIContentGenerator } from '@/components/products/AIContentGenerator';
import { SelectItem, SelectField } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CurrencySelect } from '@/components/ui/currency-select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Info, Gift } from '@/components/icons';
import { Upload, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import { uploadToSupabaseStorage } from '@/utils/uploadToSupabase';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface CourseBasicInfoFormProps {
  formData: {
    title?: string;
    slug?: string;
    short_description?: string;
    description?: string;
    level?: string;
    language?: string;
    category?: string;
    licensing_type?: string;
    license_terms?: string;
    price?: number;
    currency?: string;
    promotional_price?: number;
    pricing_model?: string;
    create_free_preview?: boolean;
    preview_content_description?: string;
    image_url?: string;
    images?: string[];
  };
  onChange: (field: string, value: string | number | boolean | string[] | null | undefined) => void;
  errors?: Record<string, string>;
}

const COURSE_LEVELS = [
  { value: 'beginner', label: 'Débutant', description: 'Aucune connaissance préalable requise' },
  { value: 'intermediate', label: 'Intermédiaire', description: 'Connaissances de base requises' },
  { value: 'advanced', label: 'Avancé', description: 'Expérience significative requise' },
  { value: 'all_levels', label: 'Tous niveaux', description: 'Adapté à tous' },
];

const LANGUAGES = [
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'en', label: 'Anglais', flag: '🇬🇧' },
  { value: 'es', label: 'Espagnol', flag: '🇪🇸' },
  { value: 'pt', label: 'Portugais', flag: '🇵🇹' },
];

const CATEGORIES = [
  'Développement Web',
  'Design',
  'Marketing Digital',
  'Business',
  'Photographie',
  'Musique',
  'Langues',
  'Sciences',
  'Développement Personnel',
  'Autre',
];

export const CourseBasicInfoForm = ({
  formData,
  onChange,
  errors = {},
}: CourseBasicInfoFormProps) => {
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  const { toast } = useToast();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [customCategory, setCustomCategory] = useState<string>('');

  // Vérifier si la catégorie actuelle est "Autre" ou une valeur personnalisée
  const isCustomCategory =
    formData.category === 'Autre' || (formData.category && !CATEGORIES.includes(formData.category));

  // Pré-remplir le champ personnalisé si la catégorie est personnalisée
  useEffect(() => {
    if (isCustomCategory && formData.category && formData.category !== 'Autre') {
      setCustomCategory(formData.category);
    } else if (!isCustomCategory) {
      setCustomCategory('');
    }
  }, [formData.category, isCustomCategory]);

  // Générer le slug automatiquement à partir du titre
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Retirer accents
      .replace(/[^a-z0-9]+/g, '-') // Remplacer caractères spéciaux par -
      .replace(/^-+|-+$/g, ''); // Retirer - au début/fin
  };

  const handleTitleChange = (value: string) => {
    onChange('title', value);
    if (!formData.slug || formData.slug === generateSlug(formData.title || '')) {
      onChange('slug', generateSlug(value));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          path: 'courses',
          filePrefix: 'course',
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

        onChange('images', allImages);
        onChange('image_url', allImages[0] || formData.image_url); // Première image comme image_url

        toast({
          title: '✅ Images uploadées',
          description: `${validUrls.length} image(s) uploadée(s) avec succès`,
        });
      }
    } catch (error) {
      logger.error('Erreur upload images cours', { error });
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
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = formData.images || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    onChange('images', newImages);
    onChange('image_url', newImages[0] || ''); // Première image comme image_url
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Titre du cours */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de base</CardTitle>
          <CardDescription>
            Ces informations seront visibles par les étudiants sur la page du cours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Titre du cours <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ex: Maîtriser React et TypeScript en 2025"
              value={formData.title || ''}
              onChange={e => handleTitleChange(e.target.value)}
              onKeyDown={handleSpaceKeyDown}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            <p className="text-sm text-muted-foreground">
              Maximum 100 caractères. Soyez clair et descriptif.
            </p>
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="slug">
                URL du cours <span className="text-red-500">*</span>
              </Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>L'URL utilisée pour accéder à votre cours</p>
                  <p className="text-xs mt-1">Ex: /courses/maitriser-react-typescript</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/courses/</span>
              <Input
                id="slug"
                placeholder="maitriser-react-typescript"
                value={formData.slug || ''}
                onChange={e => onChange('slug', e.target.value)}
                className={cn('text-base sm:text-sm', errors.slug && 'border-red-500')}
              />
            </div>
            {errors.slug && (
              <p className="text-sm text-red-500 break-words max-w-full">{errors.slug}</p>
            )}
          </div>

          {/* Description courte */}
          <div className="space-y-2">
            <Label htmlFor="short_description">
              Description courte <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="short_description"
              placeholder="Résumé en une phrase de votre cours..."
              value={formData.short_description || ''}
              onChange={e => onChange('short_description', e.target.value)}
              onKeyDown={handleSpaceKeyDown}
              className={cn(
                'min-h-[44px] sm:min-h-[auto] text-base sm:text-sm',
                errors.short_description && 'border-red-500'
              )}
              rows={2}
            />
            {errors.short_description && (
              <p className="text-sm text-red-500 break-words max-w-full">
                {errors.short_description}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {(formData.short_description || '').length}/200 caractères
            </p>
          </div>

          {/* Description complète */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description complète <span className="text-red-500">*</span>
            </Label>
            {/* Générateur IA */}
            <div className="mb-2">
              <AIContentGenerator
                productInfo={{
                  name: formData.title || '',
                  type: 'service',
                  // Cours: on assimile à 'service' pour le ton marketing
                  category: formData.category,
                  features: [],
                }}
                onContentGenerated={content => {
                  onChange('short_description', content.shortDescription);
                  onChange('description', content.longDescription);
                }}
              />
            </div>
            <RichTextEditorPro
              content={formData.description || ''}
              onChange={content => onChange('description', content)}
              placeholder="Décrivez en détail ce que les étudiants apprendront, les objectifs, prérequis et ce qui rend votre cours unique..."
              showWordCount={true}
              maxHeight="500px"
            />
            {errors.description && (
              <p className="text-sm text-red-500 break-words max-w-full">{errors.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {(formData.description || '').length}/2000 caractères
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Licensing Type (PLR / Copyright) */}
      <Card>
        <CardHeader>
          <CardTitle>Type de licence et droits</CardTitle>
          <CardDescription>
            Définissez les droits d'utilisation et de commercialisation de votre cours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <SelectField
            label="Type de licence"
            value={formData.licensing_type || 'standard'}
            onValueChange={value => onChange('licensing_type', value)}
            contentVariant="sheet"
            useMobileSelectRoot
            required
            placeholder="Sélectionnez un type de licence"
            error={errors?.licensing_type}
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

          <div className="space-y-2">
            <Label htmlFor="license_terms">Conditions de licence (optionnel)</Label>
            <Textarea
              id="license_terms"
              placeholder="Détails supplémentaires sur les conditions d'utilisation, restrictions, permissions..."
              value={formData.license_terms || ''}
              onChange={e => onChange('license_terms', e.target.value)}
              onKeyDown={handleSpaceKeyDown}
              rows={4}
              maxLength={1000}
              className="min-h-[44px] sm:min-h-[auto] text-base sm:text-sm"
            />
            <p className="text-sm text-muted-foreground">
              {formData.license_terms?.length || 0} / 1000 caractères
            </p>
          </div>

          {/* Info badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {formData.licensing_type === 'plr' && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  ✓ PLR : Les acheteurs peuvent revendre ce cours avec modifications
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
          </div>
        </CardContent>
      </Card>

      {/* Configuration du cours */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration du cours</CardTitle>
          <CardDescription>Définissez le niveau, la langue et la catégorie</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Niveau */}
          <SelectField
            label="Niveau du cours"
            value={formData.level || ''}
            onValueChange={value => onChange('level', value)}
            contentVariant="sheet"
            useMobileSelectRoot
            required
            placeholder="Sélectionnez un niveau"
            error={errors?.level}
          >
            {COURSE_LEVELS.map(level => (
              <SelectItem key={level.value} value={level.value}>
                <div className="flex items-center gap-2">
                  <span>{level.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {level.description}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectField>

          {/* Langue */}
          <SelectField
            label="Langue du cours"
            value={formData.language || ''}
            onValueChange={value => onChange('language', value)}
            contentVariant="sheet"
            useMobileSelectRoot
            required
            placeholder="Sélectionnez une langue"
            error={errors?.language}
          >
            {LANGUAGES.map(lang => (
              <SelectItem key={lang.value} value={lang.value}>
                <div className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectField>

          {/* Catégorie */}
          <div className="space-y-2">
            <SelectField
              label="Catégorie"
              value={formData.category || ''}
              onValueChange={value => {
                onChange('category', value);
                // Réinitialiser la catégorie personnalisée si on change de catégorie
                if (value !== 'Autre') {
                  setCustomCategory('');
                }
              }}
              contentVariant="sheet"
              useMobileSelectRoot
              required
              placeholder="Sélectionnez une catégorie"
              error={errors?.category}
            >
              {CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
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
                    onChange('category', value);
                  }}
                  placeholder="Ex: Formation en développement web"
                  required
                  className="text-base sm:text-sm mt-1"
                  onKeyDown={handleSpaceKeyDown}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Indiquez la catégorie personnalisée pour votre cours
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tarification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tarification</CardTitle>
          <CardDescription>Définissez le prix de votre cours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
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
                placeholder="0.00"
                value={formData.price || ''}
                onChange={e => onChange('price', parseFloat(e.target.value) || 0)}
                required
                className="text-base sm:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <CurrencySelect
                value={formData.currency || 'XOF'}
                onValueChange={value => onChange('currency', value)}
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
              onChange={e => onChange('promotional_price', parseFloat(e.target.value) || undefined)}
              className="text-base sm:text-sm"
            />
            {formData.promotional_price &&
              formData.price &&
              formData.promotional_price < formData.price && (
                <p className="text-sm text-green-600">
                  Réduction de{' '}
                  {Math.round(
                    ((formData.price - formData.promotional_price) / formData.price) * 100
                  )}
                  %
                </p>
              )}
          </div>

          {/* Modèle de tarification */}
          <div className="space-y-2">
            <SelectField
              label="Modèle de tarification"
              value={formData.pricing_model || 'one-time'}
              contentVariant="sheet"
              useMobileSelectRoot
              onValueChange={value => {
                onChange('pricing_model', value);
                if (value === 'free') {
                  onChange('price', 0);
                }
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
                    Cours accessible gratuitement
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="pay-what-you-want">
                <div className="flex flex-col">
                  <span className="font-medium">Prix libre</span>
                  <span className="text-xs text-muted-foreground">
                    L'étudiant choisit le montant (minimum possible)
                  </span>
                </div>
              </SelectItem>
            </SelectField>
            {formData.pricing_model === 'free' && (
              <p className="text-sm text-blue-600 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Ce cours sera accessible gratuitement par tous les visiteurs
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Images Upload - Multiple */}
      <Card>
        <CardHeader>
          <CardTitle>Images du cours</CardTitle>
          <CardDescription>Ajoutez plusieurs images pour présenter votre cours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="images_upload">Images du cours</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Ajoutez plusieurs images pour montrer différents aspects de votre cours
            </p>

            {/* Grille d'images existantes */}
            {(formData.images && formData.images.length > 0) || formData.image_url ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {/* Afficher les images du tableau images */}
                {(formData.images || []).map((imageUrl: string, index: number) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Cours ${index + 1}`}
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
                      className="absolute top-1 right-1 h-11 w-11 rounded-full opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation min-h-[44px] min-w-[44px]"
                      onClick={() => handleRemoveImage(index)}
                      disabled={uploadingImage}
                      aria-label={`Supprimer l'image ${index + 1} du cours`}
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
                        alt="Preview cours"
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
                        className="absolute top-1 right-1 h-11 w-11 rounded-full opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation min-h-[44px] min-w-[44px]"
                        onClick={() => {
                          onChange('image_url', '');
                        }}
                        disabled={uploadingImage}
                        aria-label="Supprimer l'image principale du cours"
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
                      <span className="text-xs text-muted-foreground text-center px-2">
                        Ajouter
                      </span>
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
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploadingImage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Produit Preview Gratuit */}
      {formData.pricing_model !== 'free' && (
        <Card className="border-2 border-dashed border-purple-300 dark:border-purple-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-500" />
              Cours Preview Gratuit
            </CardTitle>
            <CardDescription>
              Créez une version gratuite qui présente un aperçu du contenu payant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="create_free_preview"
                checked={formData.create_free_preview || false}
                onChange={e => onChange('create_free_preview', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="create_free_preview" className="font-medium cursor-pointer">
                Créer automatiquement un cours gratuit preview
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
                    placeholder="Ex: Contient les 2 premiers chapitres sur 10 du cours complet. Inclut les bases et une introduction aux concepts avancés."
                    value={formData.preview_content_description || ''}
                    onChange={e => onChange('preview_content_description', e.target.value)}
                    onKeyDown={handleSpaceKeyDown}
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
                        Un cours gratuit sera créé avec le nom "{formData.title || 'Votre cours'} -
                        Version Preview Gratuite"
                      </li>
                      <li>
                        Seules les leçons marquées comme "preview" dans le curriculum seront
                        incluses dans le cours gratuit
                      </li>
                      <li>Les étudiants pourront s'inscrire gratuitement au preview</li>
                      <li>Un lien vers la version complète payante sera affiché sur le preview</li>
                      <li>
                        Dans l'étape "Curriculum", cochez "Preview gratuit" pour chaque leçon que
                        vous souhaitez inclure dans la version gratuite
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
