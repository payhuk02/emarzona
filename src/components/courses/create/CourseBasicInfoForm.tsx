import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditorPro } from "@/components/ui/rich-text-editor-pro";
import { AIContentGenerator } from "@/components/products/AIContentGenerator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CurrencySelect } from "@/components/ui/currency-select";
import { Info, Gift } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CourseBasicInfoFormProps {
  formData: {
    title: string;
    slug: string;
    short_description: string;
    description: string;
    level: string;
    language: string;
    category: string;
    licensing_type?: string;
    license_terms?: string;
    price?: number;
    currency?: string;
    promotional_price?: number;
    pricing_model?: string;
    create_free_preview?: boolean;
    preview_content_description?: string;
  };
  onChange: (field: string, value: any) => void;
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

export const CourseBasicInfoForm = ({ formData, onChange, errors = {} }: CourseBasicInfoFormProps) => {
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
    if (!formData.slug || formData.slug === generateSlug(formData.title)) {
      onChange('slug', generateSlug(value));
    }
  };

  return (
    <div className="space-y-6">
      {/* Titre du cours */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de base</CardTitle>
          <CardDescription>
            Ces informations seront visibles par les étudiants sur la page du cours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Titre du cours <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ex: Maîtriser React et TypeScript en 2025"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
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
                value={formData.slug}
                onChange={(e) => onChange('slug', e.target.value)}
                className={errors.slug ? 'border-red-500' : ''}
              />
            </div>
            {errors.slug && (
              <p className="text-sm text-red-500">{errors.slug}</p>
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
              value={formData.short_description}
              onChange={(e) => onChange('short_description', e.target.value)}
              className={errors.short_description ? 'border-red-500' : ''}
              rows={2}
            />
            {errors.short_description && (
              <p className="text-sm text-red-500">{errors.short_description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {formData.short_description.length}/200 caractères
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
                onContentGenerated={(content) => {
                  onChange('short_description', content.shortDescription);
                  onChange('description', content.longDescription);
                }}
              />
            </div>
            <RichTextEditorPro
              content={formData.description}
              onChange={(content) => onChange('description', content)}
              placeholder="Décrivez en détail ce que les étudiants apprendront, les objectifs, prérequis et ce qui rend votre cours unique..."
              showWordCount={true}
              maxHeight="500px"
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {formData.description.length}/2000 caractères
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
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="licensing_type">
              Type de licence <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.licensing_type || 'standard'}
              onValueChange={(value) => onChange('licensing_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type de licence" />
              </SelectTrigger>
              <SelectContent>
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
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_terms">
              Conditions de licence (optionnel)
            </Label>
            <Textarea
              id="license_terms"
              placeholder="Détails supplémentaires sur les conditions d'utilisation, restrictions, permissions..."
              value={formData.license_terms || ''}
              onChange={(e) => onChange('license_terms', e.target.value)}
              rows={4}
              maxLength={1000}
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
          <CardDescription>
            Définissez le niveau, la langue et la catégorie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Niveau */}
          <div className="space-y-2">
            <Label htmlFor="level">
              Niveau du cours <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.level} onValueChange={(value) => onChange('level', value)}>
              <SelectTrigger className={errors.level ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionnez un niveau" />
              </SelectTrigger>
              <SelectContent>
                {COURSE_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <div className="flex items-center gap-2">
                      <span>{level.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {level.description}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.level && (
              <p className="text-sm text-red-500">{errors.level}</p>
            )}
          </div>

          {/* Langue */}
          <div className="space-y-2">
            <Label htmlFor="language">
              Langue du cours <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.language} onValueChange={(value) => onChange('language', value)}>
              <SelectTrigger className={errors.language ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionnez une langue" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <div className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.language && (
              <p className="text-sm text-red-500">{errors.language}</p>
            )}
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Catégorie <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.category} onValueChange={(value) => onChange('category', value)}>
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionnez une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tarification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tarification</CardTitle>
          <CardDescription>
            Définissez le prix de votre cours
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
                placeholder="0.00"
                value={formData.price || ''}
                onChange={(e) => onChange('price', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <CurrencySelect
                value={formData.currency || 'XOF'}
                onValueChange={(value) => onChange('currency', value)}
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
              onChange={(e) => onChange('promotional_price', parseFloat(e.target.value) || undefined)}
            />
            {formData.promotional_price && formData.price && formData.promotional_price < formData.price && (
              <p className="text-sm text-green-600">
                Réduction de {Math.round(((formData.price - formData.promotional_price) / formData.price) * 100)}%
              </p>
            )}
          </div>

          {/* Modèle de tarification */}
          <div className="space-y-2">
            <Label htmlFor="pricing_model">
              Modèle de tarification <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.pricing_model || 'one-time'}
              onValueChange={(value) => {
                onChange('pricing_model', value);
                if (value === 'free') {
                  onChange('price', 0);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un modèle" />
              </SelectTrigger>
              <SelectContent>
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
              </SelectContent>
            </Select>
            {formData.pricing_model === 'free' && (
              <p className="text-sm text-blue-600 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Ce cours sera accessible gratuitement par tous les visiteurs
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
              Cours Preview Gratuit
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
                onChange={(e) => onChange('create_free_preview', e.target.checked)}
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
                    onChange={(e) => onChange('preview_content_description', e.target.value)}
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
                      <li>Un cours gratuit sera créé avec le nom "{formData.title || 'Votre cours'} - Version Preview Gratuite"</li>
                      <li>Seules les leçons marquées comme "preview" dans le curriculum seront incluses dans le cours gratuit</li>
                      <li>Les étudiants pourront s'inscrire gratuitement au preview</li>
                      <li>Un lien vers la version complète payante sera affiché sur le preview</li>
                      <li>Dans l'étape "Curriculum", cochez "Preview gratuit" pour chaque leçon que vous souhaitez inclure dans la version gratuite</li>
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

