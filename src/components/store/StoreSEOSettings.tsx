/**
 * StoreSEOSettings Component
 * Composant pour la configuration SEO complète de la boutique
 * Phase 1 - Utilise les champs existants dans la DB
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import { Badge } from '@/components/ui/badge';
import { SEOSerpPreview } from '@/components/seo/SEOSerpPreview';

interface StoreSEOSettingsProps {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  storeUrl?: string;
  faviconUrl?: string;
  onChange: (field: string, value: string) => void;
}

export const StoreSEOSettings: React.FC<StoreSEOSettingsProps> = ({
  metaTitle,
  metaDescription,
  metaKeywords,
  ogTitle,
  ogDescription,
  ogImageUrl,
  storeUrl,
  faviconUrl,
  onChange,
}) => {
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();

  const metaTitleLength = metaTitle.length;
  const metaDescriptionLength = metaDescription.length;
  const metaTitleOptimal = metaTitleLength >= 50 && metaTitleLength <= 60;
  const metaDescriptionOptimal = metaDescriptionLength >= 120 && metaDescriptionLength <= 160;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Configuration SEO
        </CardTitle>
        <CardDescription>
          Optimisez le référencement de votre boutique pour les moteurs de recherche
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Meta Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="meta_title">
              Titre SEO (Meta Title) *
            </Label>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${metaTitleOptimal ? 'text-green-600' : 'text-muted-foreground'}`}>
                {metaTitleLength}/60
              </span>
              {metaTitleOptimal ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              )}
            </div>
          </div>
          <Input
            id="meta_title"
            value={metaTitle}
            onChange={(e) => onChange('meta_title', e.target.value)}
            onKeyDown={handleSpaceKeyDown}
            placeholder="Nom de votre boutique - Description courte"
            maxLength={60}
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {!metaTitleOptimal && (
              <>
                <AlertCircle className="h-3 w-3" />
                <span>Recommandé : entre 50 et 60 caractères</span>
              </>
            )}
            {metaTitleOptimal && (
              <>
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Longueur optimale</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Ce titre apparaîtra dans les résultats de recherche Google
          </p>
        </div>

        {/* Meta Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="meta_description">
              Description SEO (Meta Description) *
            </Label>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${metaDescriptionOptimal ? 'text-green-600' : 'text-muted-foreground'}`}>
                {metaDescriptionLength}/160
              </span>
              {metaDescriptionOptimal ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              )}
            </div>
          </div>
          <Textarea
            id="meta_description"
            value={metaDescription}
            onChange={(e) => onChange('meta_description', e.target.value)}
            onKeyDown={handleSpaceKeyDown}
            placeholder="Décrivez votre boutique en 2-3 phrases. Incluez des mots-clés pertinents."
            rows={3}
            maxLength={160}
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {!metaDescriptionOptimal && (
              <>
                <AlertCircle className="h-3 w-3" />
                <span>Recommandé : entre 120 et 160 caractères</span>
              </>
            )}
            {metaDescriptionOptimal && (
              <>
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Longueur optimale</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Cette description apparaîtra sous le titre dans les résultats de recherche
          </p>
        </div>

        {/* Meta Keywords */}
        <div className="space-y-2">
          <Label htmlFor="meta_keywords">Mots-clés SEO</Label>
          <Input
            id="meta_keywords"
            value={metaKeywords}
            onChange={(e) => onChange('meta_keywords', e.target.value)}
            onKeyDown={handleSpaceKeyDown}
            placeholder="boutique, e-commerce, produits, vente en ligne"
          />
          <p className="text-xs text-muted-foreground">
            Séparez les mots-clés par des virgules. Exemple : "boutique, e-commerce, produits digitaux"
          </p>
        </div>

        {/* Open Graph */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-4">Open Graph (Réseaux sociaux)</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="og_title">Titre Open Graph</Label>
              <Input
                id="og_title"
                value={ogTitle}
                onChange={(e) => onChange('og_title', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
                placeholder="Titre qui apparaîtra lors du partage sur Facebook, Twitter, etc."
              />
              <p className="text-xs text-muted-foreground">
                Si vide, le titre SEO sera utilisé
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="og_description">Description Open Graph</Label>
              <Textarea
                id="og_description"
                value={ogDescription}
                onChange={(e) => onChange('og_description', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
                placeholder="Description qui apparaîtra lors du partage sur les réseaux sociaux"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Si vide, la description SEO sera utilisée
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="og_image_url">Image Open Graph</Label>
              <Input
                id="og_image_url"
                type="url"
                value={ogImageUrl}
                onChange={(e) => onChange('og_image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-muted-foreground">
                URL de l'image qui apparaîtra lors du partage. Format recommandé : 1200×630px
              </p>
            </div>
          </div>
        </div>

        {/* Prévisualisation SERP */}
        <div className="border-t pt-4">
          <SEOSerpPreview
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            url={storeUrl}
            faviconUrl={faviconUrl}
          />
        </div>
      </CardContent>
    </Card>
  );
};

