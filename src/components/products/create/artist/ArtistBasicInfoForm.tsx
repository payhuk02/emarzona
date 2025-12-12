/**
 * Artist Product - Basic Info Form
 * Date: 28 Janvier 2025
 */

import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditorPro } from '@/components/ui/rich-text-editor-pro';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ImagePlus,
  X,
  Loader2,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  User,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ArtistProductFormData, ArtistSocialLinks } from '@/types/artist-product';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import { logger } from '@/lib/logger';

interface ArtistBasicInfoFormProps {
  data: Partial<ArtistProductFormData>;
  onUpdate: (data: Partial<ArtistProductFormData>) => void;
}

const ArtistBasicInfoFormComponent = ({ data, onUpdate }: ArtistBasicInfoFormProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [_imageError, setImageError] = useState(false);
  const [_imageLoading, setImageLoading] = useState(true);
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();

  // Compteurs pour éviter les boucles infinies de réessais
  const _artistPhotoRetryCount = useRef(0);
  const _artworkImageRetryCounts = useRef<Map<number, number>>(new Map());

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Vérifier l'authentification avec getSession (plus fiable que getUser)
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();
      if (authError || !session || !session.user) {
        logger.error('Erreur authentification upload images œuvre', { error: authError });
        throw new Error('Non authentifié. Veuillez vous reconnecter.');
      }

      // Validation préventive : vérifier tous les fichiers AVANT upload
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      const invalidFiles: string[] = [];

      // Validation synchrone (type MIME et extension)
      for (const file of Array.from(files)) {
        // Vérifier le type MIME
        if (!file.type || !file.type.startsWith('image/')) {
          invalidFiles.push(`${file.name} (type MIME: ${file.type || 'inconnu'})`);
          continue;
        }

        // Vérifier l'extension
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        if (!fileExt || !validExtensions.includes(fileExt)) {
          invalidFiles.push(`${file.name} (extension: .${fileExt || 'inconnue'})`);
          continue;
        }
      }

      if (invalidFiles.length > 0) {
        toast({
          title: '❌ Fichiers invalides',
          description: `Les fichiers suivants ne sont pas des images valides : ${invalidFiles.join(', ')}. Veuillez utiliser des images (PNG, JPG, WEBP, GIF).`,
          variant: 'destructive',
        });
        setUploading(false);
        setUploadProgress(0);
        e.target.value = '';
        return;
      }

      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Validation supplémentaire pour chaque fichier (double sécurité)
        if (!file.type || !file.type.startsWith('image/')) {
          throw new Error(
            `Le fichier "${file.name}" n'est pas une image valide (type: ${file.type || 'inconnu'})`
          );
        }

        // Générer un nom de fichier unique
        const fileExt = file.name.split('.').pop()?.toLowerCase();

        // Forcer le Content-Type selon l'extension (plus fiable que file.type qui peut être incorrect)
        // Cela garantit que Supabase Storage reçoit toujours un type MIME valide
        let contentType: string;
        if (fileExt === 'png') {
          contentType = 'image/png';
        } else if (fileExt === 'jpg' || fileExt === 'jpeg') {
          contentType = 'image/jpeg';
        } else if (fileExt === 'webp') {
          contentType = 'image/webp';
        } else if (fileExt === 'gif') {
          contentType = 'image/gif';
        } else {
          // Fallback : utiliser file.type si disponible, sinon image/png par défaut
          contentType = file.type && file.type.startsWith('image/') ? file.type : 'image/png';
        }

        const fileName = `artist/artwork_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

        logger.info('Upload image œuvre - Détails', {
          fileName: file.name,
          fileSize: file.size,
          originalFileType: file.type,
          correctedContentType: contentType,
          targetPath: fileName,
          index,
        });

        // SOLUTION CRITIQUE : Utiliser XMLHttpRequest directement pour contrôler le Content-Type
        // Note: session est déjà déclarée dans handleImageUpload, on la réutilise
        if (!session) {
          throw new Error('Non authentifié');
        }

        const projectUrl = supabase.supabaseUrl;
        const uploadUrl = `${projectUrl}/storage/v1/object/product-images/${fileName}`;

        // Upload via XMLHttpRequest avec Content-Type explicite
        const uploadData = await new Promise<{ path: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', e => {
            if (e.lengthComputable) {
              const progress = ((index + 1) / files.length) * 100;
              setUploadProgress(progress);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve({ path: response.path || fileName });
              } catch {
                resolve({ path: fileName });
              }
            } else {
              try {
                const error = JSON.parse(xhr.responseText);
                reject(
                  new Error(
                    error.message ||
                      error.error ||
                      `Erreur upload: ${xhr.statusText} (${xhr.status})`
                  )
                );
              } catch {
                reject(new Error(`Erreur upload: ${xhr.statusText} (${xhr.status})`));
              }
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error("Erreur réseau lors de l'upload"));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('Upload annulé'));
          });

          xhr.open('POST', uploadUrl);
          xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
          xhr.setRequestHeader('Content-Type', contentType); // CRITIQUE : Forcer le Content-Type
          xhr.setRequestHeader('x-upsert', 'false');
          xhr.setRequestHeader('cache-control', '3600');

          xhr.send(file);
        });

        const uploadError = null; // Pas d'erreur si on arrive ici

        if (uploadError) {
          logger.error('Erreur upload image œuvre', {
            error: uploadError,
            errorMessage: uploadError.message,
            fileName: file.name,
            contentType,
            fileType: file.type,
            index,
          });
          throw uploadError;
        }
        if (!uploadData || !uploadData.path)
          throw new Error('Upload réussi mais aucun chemin retourné');

        // Construire l'URL publique
        const publicUrl = `${projectUrl}/storage/v1/object/public/product-images/${uploadData.path}`;

        logger.info('Image œuvre uploadée', {
          url: publicUrl,
          path: uploadData.path,
          fileName: file.name,
          index,
          urlFormat: 'valid',
        });

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const currentImages = data.images || [];
      onUpdate({ images: [...currentImages, ...uploadedUrls] });

      toast({
        title: '✅ Images uploadées',
        description: `${uploadedUrls.length} image(s) uploadée(s) avec succès`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Erreur upload images œuvre', {
        error: errorMessage,
        errorDetails: error,
      });
      toast({
        title: "❌ Erreur d'upload",
        description: errorMessage || "Une erreur est survenue lors de l'upload",
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = data.images || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    onUpdate({ images: newImages });
  };

  const handleArtistPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      toast({
        title: '❌ Format invalide',
        description: 'Veuillez uploader une image',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();
      if (authError || !session || !session.user) {
        throw new Error('Non authentifié');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      let contentType: string;
      if (fileExt === 'png') {
        contentType = 'image/png';
      } else if (fileExt === 'jpg' || fileExt === 'jpeg') {
        contentType = 'image/jpeg';
      } else if (fileExt === 'webp') {
        contentType = 'image/webp';
      } else {
        contentType = file.type && file.type.startsWith('image/') ? file.type : 'image/png';
      }

      const fileName = `artist/artist-photo_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const projectUrl = supabase.supabaseUrl;
      const uploadUrl = `${projectUrl}/storage/v1/object/product-images/${fileName}`;

      const uploadData = await new Promise<{ path: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) {
            setUploadProgress((e.loaded / e.total) * 100);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({ path: response.path || fileName });
            } catch {
              resolve({ path: fileName });
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(
                new Error(
                  error.message || error.error || `Erreur upload: ${xhr.statusText} (${xhr.status})`
                )
              );
            } catch {
              reject(new Error(`Erreur upload: ${xhr.statusText} (${xhr.status})`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error("Erreur réseau lors de l'upload"));
        });

        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
        xhr.setRequestHeader('Content-Type', contentType);
        xhr.setRequestHeader('x-upsert', 'false');
        xhr.send(file);
      });

      const publicUrl = `${projectUrl}/storage/v1/object/public/product-images/${uploadData.path}`;
      onUpdate({ artist_photo_url: publicUrl });

      toast({
        title: '✅ Photo uploadée',
        description: "La photo de l'artiste a été uploadée avec succès",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Erreur upload photo artiste', { error: errorMessage });
      toast({
        title: "❌ Erreur d'upload",
        description: errorMessage || 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Artist Type Badge */}
      {data.artist_type && (
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {data.artist_type === 'writer'
              ? 'Écrivain'
              : data.artist_type === 'musician'
                ? 'Musicien'
                : data.artist_type === 'visual_artist'
                  ? 'Artiste visuel'
                  : data.artist_type === 'designer'
                    ? 'Designer'
                    : data.artist_type === 'multimedia'
                      ? 'Multimédia'
                      : 'Artiste'}
          </Badge>
        </div>
      )}

      {/* Artist Photo */}
      <div className="space-y-2">
        <Label>Photo de l'artiste</Label>
        {data.artist_photo_url ? (
          <div className="flex items-center gap-4">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-primary/30 bg-muted shadow-md flex-shrink-0 group">
              <img
                src={data.artist_photo_url}
                alt="Photo artiste"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
                onLoad={() => setImageLoading(false)}
              />
              <button
                type="button"
                onClick={() => onUpdate({ artist_photo_url: undefined })}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                aria-label="Supprimer la photo de l'artiste"
              >
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Photo de l'artiste uploadée</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.getElementById('artist-photo-upload') as HTMLInputElement;
                  input?.click();
                }}
                className="mt-2"
              >
                Changer la photo
              </Button>
            </div>
          </div>
        ) : (
          <label
            htmlFor="artist-photo-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Upload en cours... {uploadProgress.toFixed(0)}%
                </span>
              </div>
            ) : (
              <>
                <User className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Cliquez pour uploader une photo
                </span>
              </>
            )}
            <input
              id="artist-photo-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleArtistPhotoUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {/* Artist Name */}
      <div className="space-y-2">
        <Label htmlFor="artist_name">Nom de l'artiste *</Label>
        <Input
          id="artist_name"
          value={data.artist_name || ''}
          onChange={e => onUpdate({ artist_name: e.target.value })}
          placeholder="Nom complet de l'artiste"
          onKeyDown={handleSpaceKeyDown}
        />
      </div>

      {/* Artist Bio */}
      <div className="space-y-2">
        <Label htmlFor="artist_bio">Biographie de l'artiste</Label>
        <Textarea
          id="artist_bio"
          value={data.artist_bio || ''}
          onChange={e => onUpdate({ artist_bio: e.target.value })}
          placeholder="Présentez l'artiste, son parcours, son style..."
          rows={4}
          onKeyDown={handleSpaceKeyDown}
          className="min-h-[44px] sm:min-h-[auto] text-base sm:text-sm"
        />
      </div>

      {/* Artist Website */}
      <div className="space-y-2">
        <Label htmlFor="artist_website">Site web de l'artiste</Label>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Input
            id="artist_website"
            type="url"
            value={data.artist_website || ''}
            onChange={e => onUpdate({ artist_website: e.target.value })}
            placeholder="https://exemple.com"
            onKeyDown={handleSpaceKeyDown}
            className="text-base sm:text-sm"
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-2">
        <Label>Réseaux sociaux</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Instagram className="h-4 w-4 text-pink-500" />
            <Input
              type="url"
              placeholder="Instagram"
              value={(data.artist_social_links as ArtistSocialLinks)?.instagram || ''}
              onChange={e =>
                onUpdate({
                  artist_social_links: {
                    ...((data.artist_social_links as ArtistSocialLinks) || {}),
                    instagram: e.target.value,
                  },
                })
              }
              onKeyDown={handleSpaceKeyDown}
              className="text-base sm:text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Facebook className="h-4 w-4 text-blue-500" />
            <Input
              type="url"
              placeholder="Facebook"
              value={(data.artist_social_links as ArtistSocialLinks)?.facebook || ''}
              onChange={e =>
                onUpdate({
                  artist_social_links: {
                    ...((data.artist_social_links as ArtistSocialLinks) || {}),
                    facebook: e.target.value,
                  },
                })
              }
              onKeyDown={handleSpaceKeyDown}
              className="text-base sm:text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Twitter className="h-4 w-4 text-blue-400" />
            <Input
              type="url"
              placeholder="Twitter/X"
              value={(data.artist_social_links as ArtistSocialLinks)?.twitter || ''}
              onChange={e =>
                onUpdate({
                  artist_social_links: {
                    ...((data.artist_social_links as ArtistSocialLinks) || {}),
                    twitter: e.target.value,
                  },
                })
              }
              onKeyDown={handleSpaceKeyDown}
              className="text-base sm:text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Youtube className="h-4 w-4 text-red-500" />
            <Input
              type="url"
              placeholder="YouTube"
              value={(data.artist_social_links as ArtistSocialLinks)?.youtube || ''}
              onChange={e =>
                onUpdate({
                  artist_social_links: {
                    ...((data.artist_social_links as ArtistSocialLinks) || {}),
                    youtube: e.target.value,
                  },
                })
              }
              onKeyDown={handleSpaceKeyDown}
              className="text-base sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Artwork Title */}
      <div className="space-y-2">
        <Label htmlFor="artwork_title">Titre de l'œuvre *</Label>
        <Input
          id="artwork_title"
          value={data.artwork_title || ''}
          onChange={e => onUpdate({ artwork_title: e.target.value })}
          placeholder="Titre de l'œuvre"
          onKeyDown={handleSpaceKeyDown}
        />
      </div>

      {/* Artwork Year */}
      <div className="space-y-2">
        <Label htmlFor="artwork_year">Année de création</Label>
        <Input
          id="artwork_year"
          type="number"
          min="1000"
          max={new Date().getFullYear() + 1}
          value={data.artwork_year || ''}
          onChange={e =>
            onUpdate({ artwork_year: e.target.value ? parseInt(e.target.value) : null })
          }
          placeholder="2024"
          onKeyDown={handleSpaceKeyDown}
          className="text-base sm:text-sm"
        />
      </div>

      {/* Artwork Medium */}
      <div className="space-y-2">
        <Label htmlFor="artwork_medium">Médium</Label>
        <Input
          id="artwork_medium"
          value={data.artwork_medium || ''}
          onChange={e => onUpdate({ artwork_medium: e.target.value })}
          placeholder="Ex: Huile sur toile, Acrylique, Aquarelle, Digital..."
          onKeyDown={handleSpaceKeyDown}
        />
      </div>

      {/* Artwork Dimensions */}
      <div className="space-y-2">
        <Label>Dimensions</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="artwork_width" className="text-xs sm:text-sm">
              Largeur
            </Label>
            <Input
              id="artwork_width"
              type="number"
              min="0"
              value={data.artwork_dimensions?.width || ''}
              onChange={e =>
                onUpdate({
                  artwork_dimensions: {
                    ...(data.artwork_dimensions || {
                      width: null,
                      height: null,
                      depth: null,
                      unit: 'cm',
                    }),
                    width: e.target.value ? parseFloat(e.target.value) : null,
                  },
                })
              }
              placeholder="0"
              onKeyDown={handleSpaceKeyDown}
              className="text-base sm:text-sm"
            />
          </div>
          <div>
            <Label htmlFor="artwork_height" className="text-xs sm:text-sm">
              Hauteur
            </Label>
            <Input
              id="artwork_height"
              type="number"
              min="0"
              value={data.artwork_dimensions?.height || ''}
              onChange={e =>
                onUpdate({
                  artwork_dimensions: {
                    ...(data.artwork_dimensions || {
                      width: null,
                      height: null,
                      depth: null,
                      unit: 'cm',
                    }),
                    height: e.target.value ? parseFloat(e.target.value) : null,
                  },
                })
              }
              placeholder="0"
              onKeyDown={handleSpaceKeyDown}
              className="text-base sm:text-sm"
            />
          </div>
          <div>
            <Label htmlFor="artwork_unit" className="text-xs sm:text-sm">
              Unité
            </Label>
            <Input
              id="artwork_unit"
              value={data.artwork_dimensions?.unit || 'cm'}
              onChange={e =>
                onUpdate({
                  artwork_dimensions: {
                    ...(data.artwork_dimensions || {
                      width: null,
                      height: null,
                      depth: null,
                      unit: 'cm',
                    }),
                    unit: e.target.value,
                  },
                })
              }
              placeholder="cm"
              onKeyDown={handleSpaceKeyDown}
              className="text-base sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Artwork Link URL */}
      <div className="space-y-2">
        <Label htmlFor="artwork_link_url">Lien vers l'œuvre (optionnel)</Label>
        <Input
          id="artwork_link_url"
          type="url"
          value={data.artwork_link_url || ''}
          onChange={e => onUpdate({ artwork_link_url: e.target.value || undefined })}
          placeholder="https://exemple.com/oeuvre"
          onKeyDown={handleSpaceKeyDown}
          className="text-base sm:text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Lien vers une page dédiée, portfolio, ou galerie en ligne
        </p>
      </div>

      {/* Artwork Images */}
      <div className="space-y-2">
        <Label>Images de l'œuvre *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {(data.images || []).map((imageUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={imageUrl}
                alt={`Œuvre ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
                onError={() => {
                  logger.warn('Erreur chargement image œuvre', { index, imageUrl });
                }}
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={`Supprimer l'image ${index + 1} de l'œuvre`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          <label
            htmlFor="artwork-images-upload"
            className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors h-32 sm:h-32 md:h-40 min-h-[120px] touch-manipulation"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-1">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{uploadProgress.toFixed(0)}%</span>
              </div>
            ) : (
              <>
                <ImagePlus className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground text-center px-2">Ajouter</span>
              </>
            )}
            <input
              id="artwork-images-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Ajoutez plusieurs images pour montrer différents angles de l'œuvre
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description complète de l'œuvre</Label>
        <RichTextEditorPro
          value={data.description || ''}
          onChange={value => onUpdate({ description: value })}
          placeholder="Décrivez l'œuvre, son histoire, sa signification, sa technique..."
        />
      </div>

      {/* Short Description */}
      <div className="space-y-2">
        <Label htmlFor="short_description">Description courte</Label>
        <Textarea
          id="short_description"
          value={data.short_description || ''}
          onChange={e => onUpdate({ short_description: e.target.value })}
          placeholder="Description courte pour les aperçus (max 160 caractères)"
          rows={2}
          maxLength={160}
          onKeyDown={handleSpaceKeyDown}
          className="min-h-[44px] sm:min-h-[auto] text-base sm:text-sm"
        />
        <p className="text-xs text-muted-foreground">
          {(data.short_description || '').length} / 160 caractères
        </p>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="price">Prix *</Label>
        <Input
          id="price"
          type="number"
          min="0"
          step="0.01"
          value={data.price || 0}
          onChange={e => onUpdate({ price: parseFloat(e.target.value) || 0 })}
          placeholder="0.00"
          onKeyDown={handleSpaceKeyDown}
          className="text-base sm:text-sm"
        />
      </div>

      {/* Compare at Price */}
      <div className="space-y-2">
        <Label htmlFor="compare_at_price">Prix de comparaison (optionnel)</Label>
        <Input
          id="compare_at_price"
          type="number"
          min="0"
          step="0.01"
          value={data.compare_at_price || ''}
          onChange={e =>
            onUpdate({ compare_at_price: e.target.value ? parseFloat(e.target.value) : null })
          }
          placeholder="0.00"
          onKeyDown={handleSpaceKeyDown}
          className="text-base sm:text-sm"
        />
        <p className="text-xs text-muted-foreground">Prix barré pour montrer une réduction</p>
      </div>
    </div>
  );
};

// Optimisation avec React.memo
export const ArtistBasicInfoForm = React.memo(
  ArtistBasicInfoFormComponent,
  (prevProps, nextProps) => {
    // Comparaison personnalisée pour éviter les re-renders inutiles
    return (
      prevProps.data.artist_type === nextProps.data.artist_type &&
      prevProps.data.artist_name === nextProps.data.artist_name &&
      prevProps.data.artwork_title === nextProps.data.artwork_title &&
      prevProps.data.artist_photo_url === nextProps.data.artist_photo_url &&
      JSON.stringify(prevProps.data.images) === JSON.stringify(nextProps.data.images)
    );
  }
);
