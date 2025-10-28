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
  data: Partial<SEOData>;
  onUpdate: (data: Partial<SEOData>) => void;
}

export const ProductSEOForm = ({
  productName,
  productDescription,
  productPrice,
  data,
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
                <CardDescription>Optimisez votre visibilité sur les moteurs de recherche</CardDescription>
              </div>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getSeoScoreColor()}`}>
                {seoScore}
              </div>
              <Badge variant={seoScore >= 80 ? 'default' : seoScore >= 50 ? 'secondary' : 'destructive'}>
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
              <button
                onClick={autoFillFromProduct}
                className="text-primary hover:underline"
              >
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
          <div className="space-y-2">
            <Label htmlFor="meta_title">
              Titre SEO <span className="text-muted-foreground">(30-60 caractères)</span>
            </Label>
            <Input
              id="meta_title"
              value={data.meta_title || ''}
              onChange={(e) => onUpdate({ ...data, meta_title: e.target.value })}
              placeholder={`${productName} - Achetez maintenant`}
              maxLength={70}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {data.meta_title?.length || 0}/60 caractères
              </span>
              {data.meta_title && data.meta_title.length >= 30 && data.meta_title.length <= 60 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Longueur optimale
                </span>
              ) : (
                <span className="text-yellow-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {data.meta_title && data.meta_title.length > 60 ? 'Trop long' : 'Ajoutez plus de détails'}
                </span>
              )}
            </div>
          </div>

          {/* Meta Description */}
          <div className="space-y-2">
            <Label htmlFor="meta_description">
              Description SEO <span className="text-muted-foreground">(120-160 caractères)</span>
            </Label>
            <Textarea
              id="meta_description"
              value={data.meta_description || ''}
              onChange={(e) => onUpdate({ ...data, meta_description: e.target.value })}
              placeholder="Décrivez votre produit de manière attractive pour augmenter le taux de clic..."
              rows={3}
              maxLength={200}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {data.meta_description?.length || 0}/160 caractères
              </span>
              {data.meta_description && data.meta_description.length >= 120 && data.meta_description.length <= 160 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Longueur optimale
                </span>
              ) : (
                <span className="text-yellow-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {data.meta_description && data.meta_description.length > 160 ? 'Trop long' : 'Ajoutez plus de détails'}
                </span>
              )}
            </div>
          </div>

          {/* Meta Keywords */}
          <div className="space-y-2">
            <Label htmlFor="meta_keywords">
              Mots-clés <span className="text-muted-foreground">(séparés par des virgules)</span>
            </Label>
            <Input
              id="meta_keywords"
              value={data.meta_keywords || ''}
              onChange={(e) => onUpdate({ ...data, meta_keywords: e.target.value })}
              placeholder="produit digital, ebook, formation, afrique"
            />
            <p className="text-xs text-muted-foreground">
              3-5 mots-clés pertinents pour améliorer le référencement
            </p>
          </div>

          {/* Preview Google Search */}
          <Alert>
            <Globe className="h-4 w-4" />
            <AlertTitle>Aperçu Google Search</AlertTitle>
            <AlertDescription>
              <div className="mt-2 p-3 bg-muted/50 rounded">
                <div className="text-blue-600 text-lg font-medium">
                  {data.meta_title || productName || 'Titre du produit'}
                </div>
                <div className="text-green-700 text-sm">
                  payhuk.com › produits › ...
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {data.meta_description || 'Description du produit qui apparaîtra dans les résultats de recherche...'}
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
          <div className="space-y-2">
            <Label htmlFor="og_title">Titre pour réseaux sociaux</Label>
            <Input
              id="og_title"
              value={data.og_title || ''}
              onChange={(e) => onUpdate({ ...data, og_title: e.target.value })}
              placeholder={productName || 'Titre du produit'}
            />
          </div>

          {/* OG Description */}
          <div className="space-y-2">
            <Label htmlFor="og_description">Description pour réseaux sociaux</Label>
            <Textarea
              id="og_description"
              value={data.og_description || ''}
              onChange={(e) => onUpdate({ ...data, og_description: e.target.value })}
              placeholder="Description attractive pour les partages sur les réseaux sociaux..."
              rows={2}
            />
          </div>

          {/* OG Image */}
          <div className="space-y-2">
            <Label htmlFor="og_image">
              Image Open Graph <span className="text-muted-foreground">(Recommandé: 1200x630px)</span>
            </Label>
            <Input
              id="og_image"
              value={data.og_image || ''}
              onChange={(e) => onUpdate({ ...data, og_image: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImageIcon className="h-3 w-3" />
              <span>Image affichée lors du partage (1200x630px pour un résultat optimal)</span>
            </div>
          </div>

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
                      onError={(e) => {
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
                  <div className="text-xs text-muted-foreground mt-2">
                    payhuk.com
                  </div>
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

