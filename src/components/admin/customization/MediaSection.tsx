import React, { useState, useRef } from 'react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, UploadCloud, Info } from 'lucide-react';
import { logger } from '@/lib/logger';
import { PageHeroImagesMediaSection } from '@/components/admin/customization/PageHeroImagesMediaSection';
import {
  AUTH_HERO_FORMAT,
  LANDING_ADAPT_FORMAT,
  LANDING_CAROUSEL_FORMAT,
  LANDING_CTA_FORMAT,
  LANDING_SELL_WAY_FORMAT,
  PLATFORM_HERO_LEFT_FORMAT,
  PLATFORM_HERO_VISUAL_FORMAT,
  formatMediaPixelSize,
  type MediaPixelFormat,
} from '@/lib/admin/mediaImageFormats';

// Default images imports (auth hero: admin upload only, no bundled fallback)
import adaptPremiumWebp from '@/assets/landing/adapt-entrepreneur.webp';
import ctaVisualPremium from '@/assets/landing/cta-visual-premium.png';
import heroEntrepreneur from '@/assets/landing/hero-carousel-entrepreneur.webp';
import heroPhysical from '@/assets/landing/hero-carousel-physical.webp';
import heroDigital from '@/assets/landing/hero-carousel-digital.webp';
import heroService from '@/assets/landing/hero-carousel-service.webp';
import heroCourses from '@/assets/landing/hero-carousel-courses.webp';
import heroArtist from '@/assets/landing/hero-carousel-artist.webp';
import sellWayPhysical from '@/assets/landing/sell-way-physical.webp';
import sellWayDigital from '@/assets/landing/sell-way-digital.webp';
import sellWayService from '@/assets/landing/sell-way-service.webp';
import sellWayCourses from '@/assets/landing/sell-way-courses.webp';
import sellWayArtist from '@/assets/landing/sell-way-artist.webp';

interface MediaSectionProps {
  onChange: () => void;
}

export function MediaSection({ onChange }: MediaSectionProps) {
  const { customizationData, save } = usePlatformCustomization();
  const { toast } = useToast();

  const media = customizationData?.media?.images || {};

  const [isUploading, setIsUploading] = useState<string | null>(null);

  const applyMediaImages = async (updatedMedia: Record<string, unknown>) => {
    await save('media', { images: updatedMedia });
    onChange();
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, keyPath: string[]) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const uploadKey = keyPath.join('.');
      setIsUploading(uploadKey);

      if (!file.type.startsWith('image/')) {
        throw new Error('Veuillez uploader une image valide (PNG, JPG, WebP).');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${uploadKey}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('platform_assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('platform_assets').getPublicUrl(filePath);

      let updatedMedia = { ...media };

      if (keyPath.length === 1) {
        updatedMedia = { ...updatedMedia, [keyPath[0]]: publicUrl };
      } else if (
        keyPath.length === 2 &&
        (keyPath[0] === 'landingCarousel' || keyPath[0] === 'landingSellWays')
      ) {
        const nestedKey = keyPath[0];
        const nested = { ...((updatedMedia[nestedKey] as Record<string, string>) || {}) };
        nested[keyPath[1]] = publicUrl;
        updatedMedia = { ...updatedMedia, [nestedKey]: nested };
      }

      await applyMediaImages(updatedMedia);

      toast({
        title: 'Image uploadée avec succès',
        description: "L'image a été sauvegardée et appliquée à la plateforme.",
      });
    } catch (error) {
      logger.error('Error uploading image', { error });
      toast({
        title: "Erreur d'upload",
        description: error instanceof Error ? error.message : "Impossible d'uploader l'image",
        variant: 'destructive',
      });
    } finally {
      setIsUploading(null);
      event.target.value = '';
    }
  };

  const handleReset = async (keyPath: string[]) => {
    try {
      const uploadKey = keyPath.join('.');
      setIsUploading(uploadKey);

      let updatedMedia = { ...media };

      if (keyPath.length === 1) {
        const { [keyPath[0]]: _removed, ...rest } = updatedMedia as Record<string, unknown>;
        updatedMedia = rest;
      } else if (
        keyPath.length === 2 &&
        (keyPath[0] === 'landingCarousel' || keyPath[0] === 'landingSellWays')
      ) {
        const nestedKey = keyPath[0];
        const nested = { ...((updatedMedia[nestedKey] as Record<string, string>) || {}) };
        delete nested[keyPath[1]];
        if (Object.keys(nested).length > 0) {
          updatedMedia = { ...updatedMedia, [nestedKey]: nested };
        } else {
          const { [nestedKey]: _removedNested, ...rest } = updatedMedia as Record<string, unknown>;
          updatedMedia = rest;
        }
      }

      await applyMediaImages(updatedMedia);

      toast({
        title: 'Image réinitialisée',
        description: "L'image par défaut de la plateforme est de nouveau utilisée.",
      });
    } catch (error) {
      logger.error('Error resetting image', { error });
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : "Impossible de réinitialiser l'image",
        variant: 'destructive',
      });
    } finally {
      setIsUploading(null);
    }
  };

  const ImageUploader = ({
    title,
    description,
    keyPath,
    currentUrl,
    defaultUrl,
    pixelFormat,
  }: {
    title: string;
    description: string;
    keyPath: string[];
    currentUrl?: string;
    defaultUrl?: string;
    optional?: boolean;
    pixelFormat: MediaPixelFormat;
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadKey = keyPath.join('.');
    const loading = isUploading === uploadKey;
    const isCustom = !!currentUrl;
    const hasPreview = !!(currentUrl || defaultUrl);
    const displayUrl = currentUrl || defaultUrl;
    const formatLabel = formatMediaPixelSize(pixelFormat);

    return (
      <div className="flex flex-col gap-3 p-4 border rounded-lg bg-card">
        <div>
          <div className="flex items-center gap-2">
            <Label className="text-base font-semibold">{title}</Label>
            {!isCustom && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {defaultUrl ? 'Par défaut' : 'Blanc par défaut'}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        <div className="mt-2 relative group overflow-hidden rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/10 flex items-center justify-center min-h-[160px]">
          {hasPreview ? (
            <img
              src={displayUrl}
              alt={title}
              className={`max-h-[200px] w-full object-contain p-2 transition-opacity ${!isCustom ? 'opacity-60 grayscale-[30%]' : ''}`}
            />
          ) : (
            <div className="flex h-[160px] w-full flex-col items-center justify-center gap-2 border border-border bg-white px-6 text-center">
              <p className="text-sm font-medium text-foreground/90">Fond blanc par défaut</p>
              <p className="text-xs text-muted-foreground">
                Couleurs réglables dans Textes → Hero plateforme
              </p>
            </div>
          )}

          <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4 mr-2" />
              )}
              {isCustom ? 'Remplacer' : 'Uploader une image'}
            </Button>
            {isCustom ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleReset(keyPath)}
                disabled={loading}
              >
                Réinitialiser
              </Button>
            ) : null}
            {!isCustom && defaultUrl && (
              <p className="text-xs font-medium text-foreground">
                L'image par défaut est actuellement utilisée.
              </p>
            )}
            {!isCustom && !defaultUrl && (
              <p className="text-xs font-medium text-foreground">Aucune image personnalisée.</p>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={e => handleUpload(e, keyPath)}
          />
        </div>

        <p className="text-center text-xs font-medium tabular-nums text-muted-foreground">
          Format : {formatLabel}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeroImagesMediaSection onChange={onChange} />
      <Card>
        <CardHeader>
          <CardTitle>Page de Connexion / Inscription</CardTitle>
          <CardDescription>
            Personnalisez l'image principale affichée sur la page d'authentification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploader
            title="Image Héro (Auth)"
            description="Format recommandé: WebP ou PNG optimisé. Orienté portrait. Affichée sur la page de connexion/inscription."
            keyPath={['authHero']}
            currentUrl={media.authHero as string}
            pixelFormat={AUTH_HERO_FORMAT}
            optional
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page d'Accueil (Landing)</CardTitle>
          <CardDescription>Modifiez les visuels clés de la page de présentation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUploader
            title="Arrière-plan gauche Hero plateforme"
            description="Image optionnelle derrière la colonne texte (partie gauche). Alt configurable dans Textes → Hero plateforme."
            keyPath={['landingPlatformHeroLeft']}
            currentUrl={media.landingPlatformHeroLeft as string | undefined}
            pixelFormat={PLATFORM_HERO_LEFT_FORMAT}
            optional
          />
          <ImageUploader
            title="Arrière-plan droit Hero plateforme (visuel)"
            description="Image optionnelle dans la colonne visuelle à droite du hero. Les couleurs se règlent dans Textes → Hero plateforme."
            keyPath={['landingPlatformHero']}
            currentUrl={media.landingPlatformHero as string | undefined}
            pixelFormat={PLATFORM_HERO_VISUAL_FORMAT}
            optional
          />
          <ImageUploader
            title="Image Adapt (Entrepreneur)"
            description="Image de la section 'S'adapte à vous'. Recommandé avec fond transparent."
            keyPath={['landingAdapt']}
            currentUrl={media.landingAdapt as string}
            defaultUrl={adaptPremiumWebp}
            pixelFormat={LANDING_ADAPT_FORMAT}
          />
          <ImageUploader
            title="Visuel CTA final"
            description="Image premium statique à droite du bloc « Prêt à tout vendre ». Format carré recommandé (PNG/WebP)."
            keyPath={['landingGlobe']}
            currentUrl={media.landingGlobe as string}
            defaultUrl={ctaVisualPremium}
            pixelFormat={LANDING_CTA_FORMAT}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modèles de vente (page d'accueil)</CardTitle>
          <CardDescription>
            Images des sections dédiées Produits physiques, digitaux, Services, Cours et Œuvres —
            affichées sous l'intro « Cinq façons de vendre ».
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageUploader
            title="Produits physiques"
            description="Section modèles de vente — visuel produits physiques."
            keyPath={['landingSellWays', 'physical']}
            currentUrl={(media.landingSellWays as Record<string, string> | undefined)?.physical}
            defaultUrl={sellWayPhysical}
            pixelFormat={LANDING_SELL_WAY_FORMAT}
          />
          <ImageUploader
            title="Produits digitaux"
            description="Section modèles de vente — visuel produits digitaux."
            keyPath={['landingSellWays', 'digital']}
            currentUrl={(media.landingSellWays as Record<string, string> | undefined)?.digital}
            defaultUrl={sellWayDigital}
            pixelFormat={LANDING_SELL_WAY_FORMAT}
          />
          <ImageUploader
            title="Services"
            description="Section modèles de vente — visuel services."
            keyPath={['landingSellWays', 'service']}
            currentUrl={(media.landingSellWays as Record<string, string> | undefined)?.service}
            defaultUrl={sellWayService}
            pixelFormat={LANDING_SELL_WAY_FORMAT}
          />
          <ImageUploader
            title="Cours en ligne"
            description="Section modèles de vente — visuel cours / formations."
            keyPath={['landingSellWays', 'courses']}
            currentUrl={(media.landingSellWays as Record<string, string> | undefined)?.courses}
            defaultUrl={sellWayCourses}
            pixelFormat={LANDING_SELL_WAY_FORMAT}
          />
          <ImageUploader
            title="Œuvres d'artiste"
            description="Section modèles de vente — visuel œuvres / créateurs."
            keyPath={['landingSellWays', 'artist']}
            currentUrl={(media.landingSellWays as Record<string, string> | undefined)?.artist}
            defaultUrl={sellWayArtist}
            pixelFormat={LANDING_SELL_WAY_FORMAT}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carrousel Héro (Page d'Accueil)</CardTitle>
          <CardDescription>
            Modifiez les images défilantes en haut de la page d'accueil pour chaque type
            d'utilisateur.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageUploader
            title="Image 1: Entrepreneur"
            description="Visuel principal avec fond transparent."
            keyPath={['landingCarousel', 'entrepreneur']}
            currentUrl={media.landingCarousel?.entrepreneur}
            defaultUrl={heroEntrepreneur}
            pixelFormat={LANDING_CAROUSEL_FORMAT}
          />
          <ImageUploader
            title="Image 2: Vendeur Physique"
            description="Visuel principal."
            keyPath={['landingCarousel', 'physical']}
            currentUrl={media.landingCarousel?.physical}
            defaultUrl={heroPhysical}
            pixelFormat={LANDING_CAROUSEL_FORMAT}
          />
          <ImageUploader
            title="Image 3: Produits Digitaux"
            description="Visuel principal."
            keyPath={['landingCarousel', 'digital']}
            currentUrl={media.landingCarousel?.digital}
            defaultUrl={heroDigital}
            pixelFormat={LANDING_CAROUSEL_FORMAT}
          />
          <ImageUploader
            title="Image 4: Services"
            description="Visuel principal."
            keyPath={['landingCarousel', 'service']}
            currentUrl={media.landingCarousel?.service}
            defaultUrl={heroService}
            pixelFormat={LANDING_CAROUSEL_FORMAT}
          />
          <ImageUploader
            title="Image 5: Formations / Cours"
            description="Visuel principal."
            keyPath={['landingCarousel', 'courses']}
            currentUrl={media.landingCarousel?.courses}
            defaultUrl={heroCourses}
            pixelFormat={LANDING_CAROUSEL_FORMAT}
          />
          <ImageUploader
            title="Image 6: Artiste / Créateur"
            description="Visuel principal."
            keyPath={['landingCarousel', 'artist']}
            currentUrl={media.landingCarousel?.artist}
            defaultUrl={heroArtist}
            pixelFormat={LANDING_CAROUSEL_FORMAT}
          />
        </CardContent>
      </Card>
    </div>
  );
}
