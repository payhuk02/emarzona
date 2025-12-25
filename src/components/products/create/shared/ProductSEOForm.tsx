/**
 * Product SEO Form - Shared Component
 * Date: 28 octobre 2025
 *
 * Formulaire SEO réutilisable pour tous types de produits
 * (Digital, Physical, Service, Course)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArtistFormField } from '../artist/ArtistFormField';
import { getFieldHelpHint, formatHelpHint } from '@/lib/artist-product-help-hints';
import { validateLength, validateGenericURL } from '@/lib/artist-product-validators';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Search,
  Share2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Info,
  Globe,
  Image as ImageIcon,
} from 'lucide-react';

interface SEOData {
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
}

interface ProductSEOFormProps {
  productName: string;
  productDescription?: string;
  productPrice?: number;
  data?: Partial<SEOData>;
  onUpdate: (data: Partial<SEOData>) => void;
}

export const ProductSEOForm = ({
  productName,
  productDescription,
  productPrice,
  data = {},
  onUpdate,
}: ProductSEOFormProps) => {
  const [seoScore, setSeoScore] = useState(0);

  // Calculer le score SEO
  useEffect(() => {
    let score = 0;
    const maxScore = 100;

    // Meta Title (25 points)
    if (data.meta_title && data.meta_title.length > 0) {
      score += 10;
      if (data.meta_title.length >= 30 && data.meta_title.length <= 60) {
        score += 15;
      }
    }

    // Meta Description (25 points)
    if (data.meta_description && data.meta_description.length > 0) {
      score += 10;
      if (data.meta_description.length >= 120 && data.meta_description.length <= 160) {
        score += 15;
      }
    }

    // Meta Keywords (15 points)
    if (data.meta_keywords && data.meta_keywords.length > 0) {
      score += 15;
    }

    // Open Graph Image (15 points)
    if (data.og_image && data.og_image.length > 0) {
      score += 15;
    }

    // Open Graph Title (10 points)
    if (data.og_title && data.og_title.length > 0) {
      score += 10;
    }

    // Open Graph Description (10 points)
    if (data.og_description && data.og_description.length > 0) {
      score += 10;
    }

    setSeoScore(Math.min(score, maxScore));
  }, [data]);

  const getSeoScoreColor = () => {
    if (seoScore >= 80) return 'text-green-600';
    if (seoScore >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeoScoreLabel = () => {
    if (seoScore >= 80) return 'Excellent';
    if (seoScore >= 50) return 'Bon';
    if (seoScore >= 30) return 'Moyen';
    return 'À améliorer';
  };

  const autoFillFromProduct = () => {
    const updates: Partial<SEOData> = {};

    if (!data.meta_title && productName) {
      updates.meta_title = `${productName} - Achetez maintenant`;
    }

    if (!data.meta_description && productDescription) {
      const desc = productDescription.replace(/<[^>]*>/g, '').substring(0, 155);
      updates.meta_description = `${desc}...`;
    }

    if (!data.og_title) {
      updates.og_title = productName;
    }

    if (!data.og_description && productDescription) {
      const desc = productDescription.replace(/<[^>]*>/g, '').substring(0, 200);
      updates.og_description = desc;
    }

    onUpdate({ ...data, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* SEO Score Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Score SEO</CardTitle>
                <CardDescription>
                  Optimisez votre visibilité sur les moteurs de recherche
                </CardDescription>
              </div>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getSeoScoreColor()}`}>{seoScore}</div>
              <Badge
                variant={seoScore >= 80 ? 'default' : seoScore >= 50 ? 'secondary' : 'destructive'}
              >
                {getSeoScoreLabel()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={seoScore} className="h-2" />
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Complétez tous les champs pour 100%</span>
            {seoScore < 80 && (
              <button onClick={autoFillFromProduct} className="text-primary hover:underline">
                Remplir automatiquement
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Meta Tags (Moteurs de recherche) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <CardTitle>Métadonnées pour moteurs de recherche</CardTitle>
          </div>
          <CardDescription>
            Optimisez comment votre produit apparaît sur Google, Bing, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Meta Title */}
          <ArtistFormField
            id="meta_title"
            label="Titre SEO (30-60 caractères)"
            value={data.meta_title || ''}
            onChange={value => onUpdate({ ...data, meta_title: value as string })}
            placeholder={`${productName} - Achetez maintenant`}
            maxLength={70}
            showCharCount
            showHelpIcon
            helpHint={formatHelpHint(
              getFieldHelpHint('meta_title') || {
                hint: 'Titre optimisé pour les moteurs de recherche (30-60 caractères recommandés)',
              }
            )}
            validationFn={value => {
              const strValue = value as string;
              if (!strValue || strValue.trim().length === 0) return null; // Optionnel
              if (strValue.length > 70) {
                return 'Le titre SEO ne peut pas dépasser 70 caractères';
              }
              if (strValue.length < 30) {
                return 'Le titre SEO devrait contenir au moins 30 caractères pour un meilleur référencement';
              }
              return null;
            }}
          />

          {/* Meta Description */}
          <ArtistFormField
            id="meta_description"
            label="Description SEO (120-160 caractères)"
            value={data.meta_description || ''}
            onChange={value => onUpdate({ ...data, meta_description: value as string })}
            placeholder="Décrivez votre produit de manière attractive pour augmenter le taux de clic..."
            multiline
            rows={3}
            maxLength={200}
            showCharCount
            showHelpIcon
            helpHint={formatHelpHint(
              getFieldHelpHint('meta_description') || {
                hint: 'Description optimisée pour les moteurs de recherche (120-160 caractères recommandés)',
              }
            )}
            validationFn={value => {
              const strValue = value as string;
              if (!strValue || strValue.trim().length === 0) return null; // Optionnel
              if (strValue.length > 200) {
                return 'La description SEO ne peut pas dépasser 200 caractères';
              }
              if (strValue.length < 120) {
                return 'La description SEO devrait contenir au moins 120 caractères pour un meilleur référencement';
              }
              return null;
            }}
          />

          {/* Meta Keywords */}
          <ArtistFormField
            id="meta_keywords"
            label="Mots-clés (séparés par des virgules)"
            value={data.meta_keywords || ''}
            onChange={value => onUpdate({ ...data, meta_keywords: value as string })}
            placeholder="produit digital, ebook, formation, afrique"
            maxLength={255}
            showCharCount
            showHelpIcon
            helpHint={formatHelpHint(
              getFieldHelpHint('meta_keywords') || {
                hint: 'Mots-clés pertinents séparés par des virgules (3-5 mots-clés recommandés)',
              }
            )}
            validationFn={value => {
              return validateLength(value as string, 0, 255, 'Les mots-clés SEO');
            }}
          />

          {/* Preview Google Search */}
          <Alert>
            <Globe className="h-4 w-4" />
            <AlertTitle>Aperçu Google Search</AlertTitle>
            <AlertDescription>
              <div className="mt-2 p-3 bg-muted/50 rounded">
                <div className="text-blue-600 text-lg font-medium">
                  {data.meta_title || productName || 'Titre du produit'}
                </div>
                <div className="text-green-700 text-sm">emarzona.com › produits › ...</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {data.meta_description ||
                    'Description du produit qui apparaîtra dans les résultats de recherche...'}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Open Graph (Réseaux sociaux) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            <CardTitle>Open Graph (Réseaux sociaux)</CardTitle>
          </div>
          <CardDescription>
            Optimisez comment votre produit apparaît sur Facebook, Twitter, LinkedIn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* OG Title */}
          <ArtistFormField
            id="og_title"
            label="Titre pour réseaux sociaux"
            value={data.og_title || ''}
            onChange={value => onUpdate({ ...data, og_title: value as string })}
            placeholder={productName || 'Titre du produit'}
            maxLength={90}
            showCharCount
            showHelpIcon
            helpHint={formatHelpHint(
              getFieldHelpHint('og_title') || {
                hint: 'Titre affiché lors du partage sur les réseaux sociaux',
              }
            )}
            validationFn={value => {
              return validateLength(value as string, 0, 90, 'Le titre Open Graph');
            }}
          />

          {/* OG Description */}
          <ArtistFormField
            id="og_description"
            label="Description pour réseaux sociaux"
            value={data.og_description || ''}
            onChange={value => onUpdate({ ...data, og_description: value as string })}
            placeholder="Description attractive pour les partages sur les réseaux sociaux..."
            multiline
            rows={2}
            maxLength={200}
            showCharCount
            showHelpIcon
            helpHint={formatHelpHint(
              getFieldHelpHint('og_description') || {
                hint: 'Description affichée lors du partage sur les réseaux sociaux',
              }
            )}
            validationFn={value => {
              return validateLength(value as string, 0, 200, 'La description Open Graph');
            }}
          />

          {/* OG Image */}
          <ArtistFormField
            id="og_image"
            label="Image Open Graph (Recommandé: 1200x630px)"
            value={data.og_image || ''}
            onChange={value => onUpdate({ ...data, og_image: value as string })}
            type="url"
            placeholder="https://example.com/image.jpg"
            maxLength={500}
            showHelpIcon
            helpHint={formatHelpHint(
              getFieldHelpHint('og_image') || {
                hint: "URL de l'image affichée lors du partage sur les réseaux sociaux (1200x630px recommandé)",
              }
            )}
            validationFn={value => {
              if (!value || (value as string).trim().length === 0) return null;
              return validateGenericURL(value as string);
            }}
          />

          {/* Preview Social */}
          <Alert>
            <Share2 className="h-4 w-4" />
            <AlertTitle>Aperçu Réseaux Sociaux</AlertTitle>
            <AlertDescription>
              <div className="mt-2 border rounded overflow-hidden">
                {data.og_image && (
                  <div className="bg-muted h-32 flex items-center justify-center text-muted-foreground text-sm">
                    <img
                      src={data.og_image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={e => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="p-3 bg-background">
                  <div className="text-sm font-semibold">
                    {data.og_title || productName || 'Titre du produit'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {data.og_description || 'Description du produit pour les réseaux sociaux'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">emarzona.com</div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Tips SEO */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>💡 Conseils pour un SEO optimal</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
            <li>Incluez les mots-clés principaux dans le titre et la description</li>
            <li>Utilisez une description unique pour chaque produit</li>
            <li>Ajoutez une image attractive de haute qualité</li>
            <li>Évitez le contenu dupliqué</li>
            {productPrice && (
              <li>Le prix ({productPrice} XOF) sera automatiquement ajouté au markup Schema.org</li>
            )}
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};
