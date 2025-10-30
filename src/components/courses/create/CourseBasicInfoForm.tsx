import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditorPro } from "@/components/ui/rich-text-editor-pro";
import { AIContentGenerator } from "@/components/products/AIContentGenerator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
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
  };
  onChange: (field: string, value: string) => void;
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
    </div>
  );
};

