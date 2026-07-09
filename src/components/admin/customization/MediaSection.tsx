import React, { useState, useRef } from 'react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, UploadCloud, Info } from 'lucide-react';
import { logger } from '@/lib/logger';

// Default images imports
import authHero from '@/assets/auth/auth-hero.webp';
import adaptPremiumPng from '@/assets/landing/adapt-entrepreneur.png';
import ctaGlobePng from '@/assets/landing/cta-globe.png';
import heroEntrepreneur from '@/assets/landing/hero-carousel-entrepreneur.webp';
import heroPhysical from '@/assets/landing/hero-carousel-physical.webp';
import heroDigital from '@/assets/landing/hero-carousel-digital.webp';
import heroService from '@/assets/landing/hero-carousel-service.webp';
import heroCourses from '@/assets/landing/hero-carousel-courses.webp';
import heroArtist from '@/assets/landing/hero-carousel-artist.webp';

interface MediaSectionProps {
  onChange: () => void;
}

export function MediaSection({ onChange }: MediaSectionProps) {
  const { customizationData, save } = usePlatformCustomization();
  const { toast } = useToast();

  const media = customizationData?.media?.images || {};

  const [isUploading, setIsUploading] = useState<string | null>(null);

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
      } else if (keyPath.length === 2 && keyPath[0] === 'landingCarousel') {
        const carousel = { ...((updatedMedia.landingCarousel as Record<string, string>) || {}) };
        carousel[keyPath[1]] = publicUrl;
        updatedMedia = { ...updatedMedia, landingCarousel: carousel };
      }

      await save('media', { images: updatedMedia });
      onChange();

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

  const ImageUploader = ({
    title,
    description,
    keyPath,
    currentUrl,
    defaultUrl,
  }: {
    title: string;
    description: string;
    keyPath: string[];
    currentUrl?: string;
    defaultUrl: string;
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadKey = keyPath.join('.');
    const loading = isUploading === uploadKey;
    const isCustom = !!currentUrl;
    const displayUrl = currentUrl || defaultUrl;

    return (
      <div className="flex flex-col gap-3 p-4 border rounded-lg bg-card">
        <div>
          <div className="flex items-center gap-2">
            <Label className="text-base font-semibold">{title}</Label>
            {!isCustom && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                Par défaut
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        <div className="mt-2 relative group overflow-hidden rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/10 flex items-center justify-center min-h-[160px]">
          <img
            src={displayUrl}
            alt={title}
            className={`max-h-[200px] w-full object-contain p-2 transition-opacity ${!isCustom ? 'opacity-60 grayscale-[30%]' : ''}`}
          />

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
            {!isCustom && (
              <p className="text-xs font-medium text-foreground">
                L'image par défaut est actuellement utilisée.
              </p>
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
      </div>
    );
  };

  return (
    <div className="space-y-6">
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
            description="Format recommandé: WebP ou PNG optimisé. Orienté portrait."
            keyPath={['authHero']}
            currentUrl={media.authHero as string}
            defaultUrl={authHero}
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
            title="Image Adapt (Entrepreneur)"
            description="Image de la section 'S'adapte à vous'. Recommandé avec fond transparent."
            keyPath={['landingAdapt']}
            currentUrl={media.landingAdapt as string}
            defaultUrl={adaptPremiumPng}
          />
          <ImageUploader
            title="Globe 3D (Call to Action)"
            description="Visuel du globe dans le bas de la page d'accueil."
            keyPath={['landingGlobe']}
            currentUrl={media.landingGlobe as string}
            defaultUrl={ctaGlobePng}
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
          />
          <ImageUploader
            title="Image 2: Vendeur Physique"
            description="Visuel principal."
            keyPath={['landingCarousel', 'physical']}
            currentUrl={media.landingCarousel?.physical}
            defaultUrl={heroPhysical}
          />
          <ImageUploader
            title="Image 3: Produits Digitaux"
            description="Visuel principal."
            keyPath={['landingCarousel', 'digital']}
            currentUrl={media.landingCarousel?.digital}
            defaultUrl={heroDigital}
          />
          <ImageUploader
            title="Image 4: Services"
            description="Visuel principal."
            keyPath={['landingCarousel', 'service']}
            currentUrl={media.landingCarousel?.service}
            defaultUrl={heroService}
          />
          <ImageUploader
            title="Image 5: Formations / Cours"
            description="Visuel principal."
            keyPath={['landingCarousel', 'courses']}
            currentUrl={media.landingCarousel?.courses}
            defaultUrl={heroCourses}
          />
          <ImageUploader
            title="Image 6: Artiste / Créateur"
            description="Visuel principal."
            keyPath={['landingCarousel', 'artist']}
            currentUrl={media.landingCarousel?.artist}
            defaultUrl={heroArtist}
          />
        </CardContent>
      </Card>
    </div>
  );
}
