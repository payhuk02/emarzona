import React, { useState, useRef } from 'react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Trash2, UploadCloud, Download } from 'lucide-react';
import { logger } from '@/lib/logger';
import { compressImage, blobToFile } from '@/lib/images/compress';
import { PageHeroImagesMediaSection } from '@/components/admin/customization/PageHeroImagesMediaSection';
import {
  AUTH_HERO_FORMAT,
  LANDING_ADAPT_FORMAT,
  LANDING_CAROUSEL_FORMAT,
  LANDING_CTA_FORMAT,
  LANDING_SELL_WAY_FORMAT,
  PLATFORM_HERO_CAROUSEL_FORMAT,
  PLATFORM_HERO_LEFT_FORMAT,
  PLATFORM_HERO_VISUAL_FORMAT,
  formatMediaPixelSize,
  type MediaPixelFormat,
} from '@/lib/admin/mediaImageFormats';

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
import platformHeroPhysical from '@/assets/landing/platform-hero-physical.webp';
import platformHeroDigital from '@/assets/landing/platform-hero-digital.webp';
import platformHeroService from '@/assets/landing/platform-hero-service.webp';
import platformHeroCourses from '@/assets/landing/platform-hero-courses.webp';
import platformHeroArtist from '@/assets/landing/platform-hero-artist.webp';

interface MediaSectionProps {
  onChange: () => void;
}

const NESTED_MEDIA_KEYS = new Set([
  'landingCarousel',
  'landingSellWays',
  'landingPlatformHeroCarousel',
]);

const ACCEPTED_MEDIA_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

function getNestedMediaValue(
  media: Record<string, unknown>,
  group: string,
  key: string
): string | undefined {
  const nested = media[group] as Record<string, string> | undefined;
  return nested?.[key];
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

  const setNestedValue = (
    current: Record<string, unknown>,
    group: string,
    key: string,
    value: string | undefined
  ): Record<string, unknown> => {
    const nested = { ...((current[group] as Record<string, string>) || {}) };
    if (value === undefined) {
      delete nested[key];
    } else {
      nested[key] = value;
    }
    if (Object.keys(nested).length > 0) {
      return { ...current, [group]: nested };
    }
    const { [group]: _removed, ...rest } = current;
    return rest;
  };

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    keyPath: string[],
    pixelFormat: MediaPixelFormat
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const uploadKey = keyPath.join('.');
      setIsUploading(uploadKey);

      if (!ACCEPTED_MEDIA_TYPES.has(file.type)) {
        throw new Error('Formats acceptés : PNG, JPG, WebP.');
      }

      let fileToUpload: File;
      try {
        const { blob } = await compressImage(file, {
          maxWidth: pixelFormat.width,
          maxHeight: pixelFormat.height,
          quality: 0.78,
          mimeType: 'image/webp',
        });
        fileToUpload = blobToFile(blob, `${uploadKey}.webp`);
      } catch (compressError) {
        logger.warn('Compression WebP échouée, tentative upload original', {
          error: compressError,
          uploadKey,
        });
        // Dernier recours : forcer le nom .webp uniquement si déjà webp
        if (file.type === 'image/webp') {
          fileToUpload = file;
        } else {
          throw new Error("Impossible d'optimiser l'image en WebP. Réessayez avec un PNG ou JPG.");
        }
      }

      if (fileToUpload.type !== 'image/webp') {
        throw new Error("L'image doit être convertie en WebP avant l'upload.");
      }

      const fileName = `${uploadKey.replace(/\./g, '-')}-${Math.random().toString(36).substring(2, 9)}.webp`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('platform_assets')
        .upload(filePath, fileToUpload, {
          upsert: true,
          contentType: 'image/webp',
          cacheControl: '31536000',
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('platform_assets').getPublicUrl(filePath);

      let updatedMedia = { ...media };

      if (keyPath.length === 1) {
        updatedMedia = { ...updatedMedia, [keyPath[0]]: publicUrl };
      } else if (keyPath.length === 2 && NESTED_MEDIA_KEYS.has(keyPath[0])) {
        updatedMedia = setNestedValue(updatedMedia, keyPath[0], keyPath[1], publicUrl);
      }

      await applyMediaImages(updatedMedia);

      toast({
        title: 'Image optimisée et uploadée',
        description: 'Convertie en WebP, redimensionnée au format cible, puis appliquée.',
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

  /** Supprime la personnalisation (revient au défaut s’il existe). Pas besoin d’uploader une autre image. */
  const handleDelete = async (keyPath: string[], mode: 'reset' | 'clear') => {
    try {
      const uploadKey = keyPath.join('.');
      setIsUploading(uploadKey);

      let updatedMedia = { ...media };

      if (keyPath.length === 1) {
        if (mode === 'clear') {
          updatedMedia = { ...updatedMedia, [keyPath[0]]: '' };
        } else {
          const { [keyPath[0]]: _removed, ...rest } = updatedMedia as Record<string, unknown>;
          updatedMedia = rest;
        }
      } else if (keyPath.length === 2 && NESTED_MEDIA_KEYS.has(keyPath[0])) {
        updatedMedia = setNestedValue(
          updatedMedia,
          keyPath[0],
          keyPath[1],
          mode === 'clear' ? '' : undefined
        );
      }

      await applyMediaImages(updatedMedia);

      toast({
        title: mode === 'clear' ? 'Image supprimée' : 'Image réinitialisée',
        description:
          mode === 'clear'
            ? "L'image a été retirée. Aucun remplacement n'est requis."
            : "L'image par défaut de la plateforme est de nouveau utilisée.",
      });
    } catch (error) {
      logger.error('Error deleting image', { error });
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : "Impossible de supprimer l'image",
        variant: 'destructive',
      });
    } finally {
      setIsUploading(null);
    }
  };

  const handleDownload = async (url: string, filenameBase: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Téléchargement impossible');
      const blob = await response.blob();
      const ext =
        blob.type === 'image/webp'
          ? 'webp'
          : blob.type === 'image/png'
            ? 'png'
            : blob.type === 'image/jpeg'
              ? 'jpg'
              : url.split('?')[0].split('.').pop()?.toLowerCase() || 'webp';
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `${filenameBase}.${ext}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      logger.error('Error downloading image', { error });
      toast({
        title: 'Téléchargement impossible',
        description: 'Ouverture de l’image dans un nouvel onglet.',
        variant: 'destructive',
      });
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const ImageUploader = ({
    title,
    description,
    keyPath,
    currentUrl,
    defaultUrl,
    pixelFormat,
    allowClearEmpty = false,
  }: {
    title: string;
    description: string;
    keyPath: string[];
    currentUrl?: string;
    defaultUrl?: string;
    optional?: boolean;
    pixelFormat: MediaPixelFormat;
    /** Si true : « Supprimer » masque aussi le défaut (chaîne vide). */
    allowClearEmpty?: boolean;
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadKey = keyPath.join('.');
    const loading = isUploading === uploadKey;
    const isCleared = currentUrl === '';
    const isCustom = typeof currentUrl === 'string' && currentUrl.length > 0;
    const hasPreview = isCustom || (!isCleared && !!defaultUrl);
    const displayUrl = isCustom ? currentUrl : !isCleared ? defaultUrl : undefined;
    const formatLabel = formatMediaPixelSize(pixelFormat);
    const canDelete = isCustom || (allowClearEmpty && !isCleared && !!defaultUrl);

    return (
      <div className="flex flex-col gap-3 p-4 border rounded-lg bg-card">
        <div>
          <div className="flex items-center gap-2">
            <Label className="text-base font-semibold">{title}</Label>
            {isCleared ? (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                Masquée
              </span>
            ) : !isCustom ? (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {defaultUrl ? 'Par défaut' : 'Blanc par défaut'}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        <div className="mt-2 relative group overflow-hidden rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/10 flex items-center justify-center min-h-[160px]">
          {hasPreview && displayUrl ? (
            <img
              src={displayUrl}
              alt={title}
              className={`max-h-[200px] w-full object-contain p-2 transition-opacity ${!isCustom ? 'opacity-60 grayscale-[30%]' : ''}`}
            />
          ) : (
            <div className="flex h-[160px] w-full flex-col items-center justify-center gap-2 border border-border bg-white px-6 text-center">
              <p className="text-sm font-medium text-foreground/90">
                {isCleared ? 'Aucune image' : 'Fond blanc par défaut'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isCleared
                  ? 'Uploadez une image pour la rétablir.'
                  : 'Couleurs réglables dans Textes → Hero plateforme'}
              </p>
            </div>
          )}

          <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm p-3">
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
            {displayUrl ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  void handleDownload(displayUrl, keyPath.join('-').replace(/\./g, '-'))
                }
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleDelete(keyPath, allowClearEmpty ? 'clear' : 'reset')}
                disabled={loading}
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            ) : null}
            {isCustom && defaultUrl ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleDelete(keyPath, 'reset')}
                disabled={loading}
              >
                Revenir au défaut
              </Button>
            ) : null}
          </div>

          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            ref={fileInputRef}
            onChange={e => handleUpload(e, keyPath, pixelFormat)}
          />
        </div>

        <p className="text-center text-xs font-medium tabular-nums text-muted-foreground">
          Format : {formatLabel} · export auto WebP
        </p>
      </div>
    );
  };

  const platformCarousel = (media.landingPlatformHeroCarousel || {}) as Record<string, string>;

  return (
    <div className="space-y-6">
      <PageHeroImagesMediaSection onChange={onChange} />
      <Card>
        <CardHeader>
          <CardTitle>Page de Connexion / Inscription</CardTitle>
          <CardDescription>
            Personnalisez l&apos;image principale affichée sur la page d&apos;authentification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploader
            title="Image Héro (Auth)"
            description="Format recommandé: WebP ou PNG optimisé. Orienté portrait. Affichée sur la page de connexion/inscription."
            keyPath={['authHero']}
            currentUrl={media.authHero as string | undefined}
            pixelFormat={AUTH_HERO_FORMAT}
            optional
            allowClearEmpty
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hero plateforme — carrousel 5 verticales</CardTitle>
          <CardDescription>
            Images plein cadre synchronisées avec le premier hero de la landing. Chaque upload est
            automatiquement converti en WebP et redimensionné (1920×1080). Survolez une vignette
            pour remplacer, télécharger ou supprimer.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageUploader
            title="1 · Produits physiques"
            description="Slide carrousel — équipe logistique / fulfilment (1920×1080)."
            keyPath={['landingPlatformHeroCarousel', 'physical']}
            currentUrl={platformCarousel.physical}
            defaultUrl={platformHeroPhysical}
            pixelFormat={PLATFORM_HERO_CAROUSEL_FORMAT}
            allowClearEmpty
          />
          <ImageUploader
            title="2 · Produits digitaux"
            description="Slide carrousel — équipe produit digital (1920×1080)."
            keyPath={['landingPlatformHeroCarousel', 'digital']}
            currentUrl={platformCarousel.digital}
            defaultUrl={platformHeroDigital}
            pixelFormat={PLATFORM_HERO_CAROUSEL_FORMAT}
            allowClearEmpty
          />
          <ImageUploader
            title="3 · Services"
            description="Slide carrousel — équipe conseil / réunion client (1920×1080)."
            keyPath={['landingPlatformHeroCarousel', 'service']}
            currentUrl={platformCarousel.service}
            defaultUrl={platformHeroService}
            pixelFormat={PLATFORM_HERO_CAROUSEL_FORMAT}
            allowClearEmpty
          />
          <ImageUploader
            title="4 · Cours en ligne"
            description="Slide carrousel — formation / studio pédagogique (1920×1080)."
            keyPath={['landingPlatformHeroCarousel', 'courses']}
            currentUrl={platformCarousel.courses}
            defaultUrl={platformHeroCourses}
            pixelFormat={PLATFORM_HERO_CAROUSEL_FORMAT}
            allowClearEmpty
          />
          <ImageUploader
            title="5 · Œuvres d'artiste"
            description="Slide carrousel — atelier / création artistique (1920×1080)."
            keyPath={['landingPlatformHeroCarousel', 'artist']}
            currentUrl={platformCarousel.artist}
            defaultUrl={platformHeroArtist}
            pixelFormat={PLATFORM_HERO_CAROUSEL_FORMAT}
            allowClearEmpty
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page d&apos;Accueil (Landing) — autres visuels</CardTitle>
          <CardDescription>Modifiez les visuels clés de la page de présentation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUploader
            title="Arrière-plan gauche Hero plateforme (legacy)"
            description="Ancien fond gauche — optionnel. Le carrousel 5 verticales est prioritaire."
            keyPath={['landingPlatformHeroLeft']}
            currentUrl={media.landingPlatformHeroLeft as string | undefined}
            pixelFormat={PLATFORM_HERO_LEFT_FORMAT}
            optional
            allowClearEmpty
          />
          <ImageUploader
            title="Portrait Hero plateforme (legacy)"
            description="Ancien portrait droit — optionnel si vous utilisez uniquement le carrousel."
            keyPath={['landingPlatformHero']}
            currentUrl={media.landingPlatformHero as string | undefined}
            pixelFormat={PLATFORM_HERO_VISUAL_FORMAT}
            optional
            allowClearEmpty
          />
          <ImageUploader
            title="Image Adapt (Entrepreneur)"
            description="Image de la section 'S'adapte à vous'. Recommandé avec fond transparent."
            keyPath={['landingAdapt']}
            currentUrl={media.landingAdapt as string | undefined}
            defaultUrl={adaptPremiumWebp}
            pixelFormat={LANDING_ADAPT_FORMAT}
            allowClearEmpty
          />
          <ImageUploader
            title="Visuel CTA final"
            description="Image premium à droite du bloc « Prêt à tout vendre »."
            keyPath={['landingGlobe']}
            currentUrl={media.landingGlobe as string | undefined}
            defaultUrl={ctaVisualPremium}
            pixelFormat={LANDING_CTA_FORMAT}
            allowClearEmpty
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modèles de vente (page d&apos;accueil)</CardTitle>
          <CardDescription>
            Images des sections Produits physiques, digitaux, Services, Cours et Œuvres. Chaque
            upload est automatiquement converti en WebP et redimensionné (1600×1200).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageUploader
            title="Produits physiques"
            description="Section modèles de vente — visuel produits physiques."
            keyPath={['landingSellWays', 'physical']}
            currentUrl={getNestedMediaValue(media, 'landingSellWays', 'physical')}
            defaultUrl={sellWayPhysical}
            pixelFormat={LANDING_SELL_WAY_FORMAT}
            allowClearEmpty
          />
          <ImageUploader
            title="Produits digitaux"
            description="Section modèles de vente — visuel produits digitaux."
            keyPath={['landingSellWays', 'digital']}
            currentUrl={getNestedMediaValue(media, 'landingSellWays', 'digital')}
            defaultUrl={sellWayDigital}
            pixelFormat={LANDING_SELL_WAY_FORMAT}
            allowClearEmpty
          />
          <ImageUploader
            title="Services"
            description="Section modèles de vente — visuel services."
            keyPath={['landingSellWays', 'service']}
            currentUrl={getNestedMediaValue(media, 'landingSellWays', 'service')}
            defaultUrl={sellWayService}
            pixelFormat={LANDING_SELL_WAY_FORMAT}
            allowClearEmpty
          />
          <ImageUploader
            title="Cours en ligne"
            description="Section modèles de vente — visuel cours / formations."
            keyPath={['landingSellWays', 'courses']}
            currentUrl={getNestedMediaValue(media, 'landingSellWays', 'courses')}
            defaultUrl={sellWayCourses}
            pixelFormat={LANDING_SELL_WAY_FORMAT}
            allowClearEmpty
          />
          <ImageUploader
            title="Œuvres d'artiste"
            description="Section modèles de vente — visuel œuvres / créateurs."
            keyPath={['landingSellWays', 'artist']}
            currentUrl={getNestedMediaValue(media, 'landingSellWays', 'artist')}
            defaultUrl={sellWayArtist}
            pixelFormat={LANDING_SELL_WAY_FORMAT}
            allowClearEmpty
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carrousel Héro secondaire</CardTitle>
          <CardDescription>
            Images du second hero (section « Vendez tout ») — indépendant du carrousel plateforme.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageUploader
            title="Image 1: Entrepreneur"
            description="Visuel principal avec fond transparent."
            keyPath={['landingCarousel', 'entrepreneur']}
            currentUrl={getNestedMediaValue(media, 'landingCarousel', 'entrepreneur')}
            defaultUrl={heroEntrepreneur}
            pixelFormat={LANDING_CAROUSEL_FORMAT}
            allowClearEmpty
          />
          <ImageUploader
            title="Image 2: Vendeur Physique"
            description="Visuel principal."
            keyPath={['landingCarousel', 'physical']}
            currentUrl={getNestedMediaValue(media, 'landingCarousel', 'physical')}
            defaultUrl={heroPhysical}
            pixelFormat={LANDING_CAROUSEL_FORMAT}
            allowClearEmpty
          />
          <ImageUploader
            title="Image 3: Produits Digitaux"
            description="Visuel principal."
            keyPath={['landingCarousel', 'digital']}
            currentUrl={getNestedMediaValue(media, 'landingCarousel', 'digital')}
            defaultUrl={heroDigital}
            pixelFormat={LANDING_CAROUSEL_FORMAT}
            allowClearEmpty
          />
          <ImageUploader
            title="Image 4: Services"
            description="Visuel principal."
            keyPath={['landingCarousel', 'service']}
            currentUrl={getNestedMediaValue(media, 'landingCarousel', 'service')}
            defaultUrl={heroService}
            pixelFormat={LANDING_CAROUSEL_FORMAT}
            allowClearEmpty
          />
          <ImageUploader
            title="Image 5: Formations / Cours"
            description="Visuel principal."
            keyPath={['landingCarousel', 'courses']}
            currentUrl={getNestedMediaValue(media, 'landingCarousel', 'courses')}
            defaultUrl={heroCourses}
            pixelFormat={LANDING_CAROUSEL_FORMAT}
            allowClearEmpty
          />
          <ImageUploader
            title="Image 6: Artiste / Créateur"
            description="Visuel principal."
            keyPath={['landingCarousel', 'artist']}
            currentUrl={getNestedMediaValue(media, 'landingCarousel', 'artist')}
            defaultUrl={heroArtist}
            pixelFormat={LANDING_CAROUSEL_FORMAT}
            allowClearEmpty
          />
        </CardContent>
      </Card>
    </div>
  );
}
