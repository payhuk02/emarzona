/**
 * Artist Product - Basic Info Form
 * Date: 28 Janvier 2025
 */

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { RichTextEditorPro } from '@/components/ui/rich-text-editor-pro';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Link2,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ArtistProductFormData, ArtistSocialLinks } from '@/types/artist-product';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import { logger } from '@/lib/logger';
import { ArtistFormField } from './ArtistFormField';
import { getFieldHelpHint, formatHelpHint } from '@/lib/artist-product-help-hints';
import { generateSlug } from '@/lib/validation-utils';
import {
  validateLength,
  validateGenericURL,
  validateInstagramURL,
  validateFacebookURL,
  validateTwitterURL,
  validateYouTubeURL,
  validateYear,
  validateDimension,
  validatePrice,
  validateComparePrice,
} from '@/lib/artist-product-validators';

interface ArtistBasicInfoFormProps {
  data: Partial<ArtistProductFormData>;
  onUpdate: (data: Partial<ArtistProductFormData>) => void;
  storeSlug?: string;
}

const ArtistBasicInfoFormComponent = ({ data, onUpdate, storeSlug }: ArtistBasicInfoFormProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [_imageError, setImageError] = useState(false);
  const [_imageLoading, setImageLoading] = useState(true);
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  const [artworkLinkUrl, setArtworkLinkUrl] = useState(data.artwork_link_url || '');
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);

  // Synchroniser l'état local avec les props
  React.useEffect(() => {
    setArtworkLinkUrl(data.artwork_link_url || '');
  }, [data.artwork_link_url]);

  /**
   * Valider une URL
   */
  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  /**
   * Générer l'URL de la page produit à partir du titre de l'œuvre
   * Format: https://[domaine]/stores/[storeSlug]/products/[slug] ou https://[domaine]/products/[slug]
   */
  const generateUrlFromTitle = (title: string): string => {
    if (!title || title.trim().length < 2) {
      return '';
    }

    // Générer un slug à partir du titre
    const slug = generateSlug(title);

    // Créer l'URL de la page produit sur la plateforme
    // Format avec storeSlug: /stores/[storeSlug]/products/[slug]
    // Format sans storeSlug: /products/[slug]
    const baseUrl = window.location.origin;
    if (storeSlug) {
      return `${baseUrl}/stores/${storeSlug}/products/${slug}`;
    }
    return `${baseUrl}/products/${slug}`;
  };

  /**
   * Auto-remplir l'URL à partir du titre de l'œuvre
   * Seulement si le champ URL est vide et n'a pas été modifié manuellement
   */
  React.useEffect(() => {
    // Ne pas auto-remplir si :
    // 1. L'URL a été modifiée manuellement
    // 2. L'URL existe déjà
    // 3. Le titre est vide
    if (isManuallyEdited || data.artwork_link_url || !data.artwork_title) {
      return;
    }

    const generatedUrl = generateUrlFromTitle(data.artwork_title);
    if (generatedUrl && generatedUrl !== artworkLinkUrl) {
      setArtworkLinkUrl(generatedUrl);
      // Mettre à jour seulement si l'URL générée est valide
      if (isValidUrl(generatedUrl)) {
        onUpdate({ artwork_link_url: generatedUrl });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.artwork_title, isManuallyEdited, data.artwork_link_url]);

  /**
   * Gérer le changement du lien de l'œuvre
   */
  const handleArtworkLinkUrlChange = (url: string) => {
    setArtworkLinkUrl(url);
    // Marquer comme modifié manuellement si l'utilisateur saisit quelque chose
    if (url && url.trim().length > 0) {
      setIsManuallyEdited(true);
    }

    if (url && isValidUrl(url)) {
      onUpdate({ artwork_link_url: url });
    } else if (!url) {
      onUpdate({ artwork_link_url: undefined });
      // Réinitialiser le flag si l'utilisateur supprime l'URL
      setIsManuallyEdited(false);
    }
  };

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

        const projectUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!projectUrl) {
          throw new Error("VITE_SUPABASE_URL n'est pas définie");
        }
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
      const projectUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!projectUrl) {
        throw new Error("VITE_SUPABASE_URL n'est pas définie");
      }
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
      <ArtistFormField
        id="artist_name"
        label="Nom de l'artiste"
        value={data.artist_name || ''}
        onChange={value => onUpdate({ artist_name: value as string })}
        placeholder="Nom complet de l'artiste"
        required
        maxLength={100}
        showCharCount
        showHelpIcon
        helpHint={formatHelpHint(
          getFieldHelpHint('artist_name') || { hint: "Nom complet de l'artiste" }
        )}
        validationFn={value => validateLength(value as string, 2, 100, "Le nom de l'artiste")}
        onKeyDown={handleSpaceKeyDown}
      />

      {/* Artist Bio */}
      <ArtistFormField
        id="artist_bio"
        label="Biographie de l'artiste"
        value={data.artist_bio || ''}
        onChange={value => onUpdate({ artist_bio: value as string })}
        placeholder="Présentez l'artiste, son parcours, son style..."
        multiline
        rows={4}
        maxLength={2000}
        showCharCount
        showHelpIcon
        helpHint={formatHelpHint(
          getFieldHelpHint('artist_bio') || {
            hint: "Présentez l'artiste, son parcours, son style artistique, ses influences...",
          }
        )}
        validationFn={value => {
          const strValue = value as string;
          if (!strValue || strValue.trim().length === 0) return null; // Optionnel
          if (strValue.trim().length < 10) {
            return 'La biographie doit contenir au moins 10 caractères';
          }
          return validateLength(strValue, 10, 2000, "La biographie de l'artiste");
        }}
        onKeyDown={handleSpaceKeyDown}
        className="min-h-[44px] sm:min-h-[auto] text-base sm:text-sm"
      />

      {/* Artist Website */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <ArtistFormField
            id="artist_website"
            label="Site web de l'artiste"
            value={data.artist_website || ''}
            onChange={value => onUpdate({ artist_website: value as string })}
            type="url"
            placeholder="https://exemple.com"
            showHelpIcon
            helpHint={formatHelpHint(
              getFieldHelpHint('artist_website') || {
                hint: "Site web officiel de l'artiste (portfolio, galerie, etc.)",
              }
            )}
            validationFn={value => {
              if (!value || (value as string).trim().length === 0) return null;
              return validateGenericURL(value as string);
            }}
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
            <Instagram className="h-4 w-4 text-pink-500" aria-hidden="true" />
            <ArtistFormField
              id="artist_social_instagram"
              label="Instagram"
              value={(data.artist_social_links as ArtistSocialLinks)?.instagram || ''}
              onChange={value =>
                onUpdate({
                  artist_social_links: {
                    ...((data.artist_social_links as ArtistSocialLinks) || {}),
                    instagram: value as string,
                  },
                })
              }
              type="url"
              placeholder="https://instagram.com/artiste"
              maxLength={500}
              showHelpIcon
              helpHint={formatHelpHint(
                getFieldHelpHint('artist_social_links') || {
                  hint: "Lien vers le profil Instagram de l'artiste",
                }
              )}
              validationFn={value => {
                if (!value || (value as string).trim().length === 0) return null;
                return validateInstagramURL(value as string);
              }}
              onKeyDown={handleSpaceKeyDown}
              className="text-base sm:text-sm flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Facebook className="h-4 w-4 text-blue-500" aria-hidden="true" />
            <ArtistFormField
              id="artist_social_facebook"
              label="Facebook"
              value={(data.artist_social_links as ArtistSocialLinks)?.facebook || ''}
              onChange={value =>
                onUpdate({
                  artist_social_links: {
                    ...((data.artist_social_links as ArtistSocialLinks) || {}),
                    facebook: value as string,
                  },
                })
              }
              type="url"
              placeholder="https://facebook.com/artiste"
              maxLength={500}
              showHelpIcon
              helpHint={formatHelpHint(
                getFieldHelpHint('artist_social_links') || {
                  hint: "Lien vers le profil Facebook de l'artiste",
                }
              )}
              validationFn={value => {
                if (!value || (value as string).trim().length === 0) return null;
                return validateFacebookURL(value as string);
              }}
              onKeyDown={handleSpaceKeyDown}
              className="text-base sm:text-sm flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Twitter className="h-4 w-4 text-blue-400" aria-hidden="true" />
            <ArtistFormField
              id="artist_social_twitter"
              label="Twitter/X"
              value={(data.artist_social_links as ArtistSocialLinks)?.twitter || ''}
              onChange={value =>
                onUpdate({
                  artist_social_links: {
                    ...((data.artist_social_links as ArtistSocialLinks) || {}),
                    twitter: value as string,
                  },
                })
              }
              type="url"
              placeholder="https://twitter.com/artiste ou https://x.com/artiste"
              maxLength={500}
              showHelpIcon
              helpHint={formatHelpHint(
                getFieldHelpHint('artist_social_links') || {
                  hint: "Lien vers le profil Twitter/X de l'artiste",
                }
              )}
              validationFn={value => {
                if (!value || (value as string).trim().length === 0) return null;
                return validateTwitterURL(value as string);
              }}
              onKeyDown={handleSpaceKeyDown}
              className="text-base sm:text-sm flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Youtube className="h-4 w-4 text-red-500" aria-hidden="true" />
            <ArtistFormField
              id="artist_social_youtube"
              label="YouTube"
              value={(data.artist_social_links as ArtistSocialLinks)?.youtube || ''}
              onChange={value =>
                onUpdate({
                  artist_social_links: {
                    ...((data.artist_social_links as ArtistSocialLinks) || {}),
                    youtube: value as string,
                  },
                })
              }
              type="url"
              placeholder="https://youtube.com/@artiste"
              maxLength={500}
              showHelpIcon
              helpHint={formatHelpHint(
                getFieldHelpHint('artist_social_links') || {
                  hint: "Lien vers la chaîne YouTube de l'artiste",
                }
              )}
              validationFn={value => {
                if (!value || (value as string).trim().length === 0) return null;
                return validateYouTubeURL(value as string);
              }}
              onKeyDown={handleSpaceKeyDown}
              className="text-base sm:text-sm flex-1"
            />
          </div>
        </div>
      </div>

      {/* Artwork Title */}
      <ArtistFormField
        id="artwork_title"
        label="Titre de l'œuvre"
        value={data.artwork_title || ''}
        onChange={value => onUpdate({ artwork_title: value as string })}
        placeholder="Titre de l'œuvre"
        required
        maxLength={200}
        showCharCount
        showHelpIcon
        helpHint={formatHelpHint(
          getFieldHelpHint('artwork_title') || {
            hint: "Titre de l'œuvre tel qu'il apparaîtra dans le catalogue",
          }
        )}
        validationFn={value => validateLength(value as string, 2, 200, "Le titre de l'œuvre")}
        onKeyDown={handleSpaceKeyDown}
      />

      {/* Artwork Year */}
      <ArtistFormField
        id="artwork_year"
        label="Année de création"
        value={data.artwork_year || null}
        onChange={value =>
          onUpdate({
            artwork_year: value
              ? typeof value === 'number'
                ? value
                : parseInt(value.toString())
              : null,
          })
        }
        type="number"
        min={1000}
        max={new Date().getFullYear() + 1}
        placeholder="2024"
        showHelpIcon
        helpHint={formatHelpHint(
          getFieldHelpHint('artwork_year') || { hint: "Année de création de l'œuvre" }
        )}
        validationFn={value => {
          if (value === null || value === undefined || value === '') return null; // Optionnel
          const numValue = typeof value === 'number' ? value : parseInt(value.toString());
          return validateYear(numValue);
        }}
        onKeyDown={handleSpaceKeyDown}
        className="text-base sm:text-sm"
      />

      {/* Artwork Medium */}
      <ArtistFormField
        id="artwork_medium"
        label="Médium"
        value={data.artwork_medium || ''}
        onChange={value => onUpdate({ artwork_medium: value as string })}
        placeholder="Ex: Huile sur toile, Acrylique, Aquarelle, Digital..."
        required
        maxLength={100}
        showCharCount
        showHelpIcon
        helpHint={formatHelpHint(
          getFieldHelpHint('artwork_medium') || {
            hint: "Technique et matériaux utilisés pour créer l'œuvre",
          }
        )}
        validationFn={value => {
          if (!value || (value as string).trim().length === 0) {
            return 'Le médium est requis';
          }
          return validateLength(value as string, 1, 100, 'Le médium');
        }}
        onKeyDown={handleSpaceKeyDown}
      />

      {/* Artwork Dimensions */}
      <div className="space-y-2">
        <Label>Dimensions</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <ArtistFormField
              id="artwork_width"
              label="Largeur"
              value={data.artwork_dimensions?.width || null}
              onChange={value =>
                onUpdate({
                  artwork_dimensions: {
                    ...(data.artwork_dimensions || {
                      width: null,
                      height: null,
                      depth: null,
                      unit: 'cm',
                    }),
                    width: value
                      ? typeof value === 'number'
                        ? value
                        : parseFloat(value.toString())
                      : null,
                  },
                })
              }
              type="number"
              min={0}
              placeholder="0"
              showHelpIcon
              helpHint={formatHelpHint(
                getFieldHelpHint('artwork_dimensions') || { hint: "Largeur de l'œuvre" }
              )}
              validationFn={value => {
                if (value === null || value === undefined || value === '') return null; // Optionnel
                const numValue = typeof value === 'number' ? value : parseFloat(value.toString());
                return validateDimension(numValue);
              }}
              onKeyDown={handleSpaceKeyDown}
              className="text-base sm:text-sm"
            />
          </div>
          <div>
            <ArtistFormField
              id="artwork_height"
              label="Hauteur"
              value={data.artwork_dimensions?.height || null}
              onChange={value =>
                onUpdate({
                  artwork_dimensions: {
                    ...(data.artwork_dimensions || {
                      width: null,
                      height: null,
                      depth: null,
                      unit: 'cm',
                    }),
                    height: value
                      ? typeof value === 'number'
                        ? value
                        : parseFloat(value.toString())
                      : null,
                  },
                })
              }
              type="number"
              min={0}
              placeholder="0"
              showHelpIcon
              helpHint={formatHelpHint(
                getFieldHelpHint('artwork_dimensions') || { hint: "Hauteur de l'œuvre" }
              )}
              validationFn={value => {
                if (value === null || value === undefined || value === '') return null; // Optionnel
                const numValue = typeof value === 'number' ? value : parseFloat(value.toString());
                return validateDimension(numValue);
              }}
              onKeyDown={handleSpaceKeyDown}
              className="text-base sm:text-sm"
            />
          </div>
          <div>
            <ArtistFormField
              id="artwork_unit"
              label="Unité"
              value={data.artwork_dimensions?.unit || 'cm'}
              onChange={value =>
                onUpdate({
                  artwork_dimensions: {
                    ...(data.artwork_dimensions || {
                      width: null,
                      height: null,
                      depth: null,
                      unit: 'cm',
                    }),
                    unit: ((value as string) === 'in' || (value as string) === 'cm'
                      ? (value as string)
                      : 'cm') as 'in' | 'cm',
                  },
                })
              }
              placeholder="cm"
              maxLength={10}
              showHelpIcon
              helpHint={formatHelpHint(
                getFieldHelpHint('artwork_dimensions') || {
                  hint: 'Unité de mesure (cm, m, inch, etc.)',
                }
              )}
              validationFn={value => {
                if (!value || (value as string).trim().length === 0) return "L'unité est requise";
                return validateLength(value as string, 1, 10, "L'unité");
              }}
              onKeyDown={handleSpaceKeyDown}
              className="text-base sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Artwork Link URL - Card dédiée comme dans le wizard digital */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">URL de la page produit</CardTitle>
          <CardDescription>
            URL de la page produit sur la plateforme (générée automatiquement à partir du titre de
            l'œuvre)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-muted-foreground" />
              <input
                type="url"
                placeholder={
                  storeSlug
                    ? `https://exemple.com/stores/${storeSlug}/products/mon-oeuvre`
                    : 'https://exemple.com/products/mon-oeuvre'
                }
                value={artworkLinkUrl}
                onChange={e => handleArtworkLinkUrlChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                maxLength={500}
              />
            </div>
            {artworkLinkUrl && !isValidUrl(artworkLinkUrl) && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <X className="h-4 w-4" />
                URL invalide. Veuillez entrer une URL valide (commençant par http:// ou https://)
              </p>
            )}
            {artworkLinkUrl && isValidUrl(artworkLinkUrl) && (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">URL de la page produit configurée</p>
                    <p className="text-sm text-muted-foreground break-all">{artworkLinkUrl}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setArtworkLinkUrl('');
                    onUpdate({ artwork_link_url: undefined });
                  }}
                  aria-label="Supprimer l'URL de la page produit"
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!artworkLinkUrl && (
              <p className="text-sm text-muted-foreground">
                💡 L'URL sera générée automatiquement à partir du titre de l'œuvre. Format:{' '}
                {storeSlug ? `/stores/${storeSlug}/products/[slug]` : '/products/[slug]'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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
          content={data.description || ''}
          onChange={value => onUpdate({ description: value })}
          placeholder="Décrivez l'œuvre, son histoire, sa signification, sa technique..."
        />
      </div>

      {/* Short Description */}
      <ArtistFormField
        id="short_description"
        label="Description courte"
        value={data.short_description || ''}
        onChange={value => onUpdate({ short_description: value as string })}
        placeholder="Description courte pour les aperçus (max 160 caractères)"
        multiline
        rows={2}
        maxLength={160}
        showCharCount
        showHelpIcon
        helpHint={formatHelpHint(
          getFieldHelpHint('short_description') || {
            hint: 'Description courte pour les aperçus et listes de produits',
          }
        )}
        validationFn={value => {
          const strValue = value as string;
          if (!strValue || strValue.trim().length === 0) return null; // Optionnel
          if (strValue.trim().length < 20) {
            return 'La description courte doit contenir au moins 20 caractères pour le SEO';
          }
          return validateLength(strValue, 20, 160, 'La description courte');
        }}
        onKeyDown={handleSpaceKeyDown}
        className="min-h-[44px] sm:min-h-[auto] text-base sm:text-sm"
      />

      {/* Price */}
      <ArtistFormField
        id="price"
        label="Prix"
        value={data.price || 0}
        onChange={value =>
          onUpdate({
            price: value ? (typeof value === 'number' ? value : parseFloat(value.toString())) : 0,
          })
        }
        type="number"
        min={0}
        step={0.01}
        placeholder="0.00"
        required
        showHelpIcon
        helpHint={formatHelpHint(
          getFieldHelpHint('price') || { hint: "Prix de vente de l'œuvre en XOF" }
        )}
        validationFn={value => {
          const numValue =
            typeof value === 'number' ? value : value ? parseFloat(value.toString()) : 0;
          return validatePrice(numValue);
        }}
        onKeyDown={handleSpaceKeyDown}
        className="text-base sm:text-sm"
      />

      {/* Compare at Price */}
      <ArtistFormField
        id="compare_at_price"
        label="Prix de comparaison (optionnel)"
        value={data.compare_at_price || null}
        onChange={value =>
          onUpdate({
            compare_at_price: value
              ? typeof value === 'number'
                ? value
                : parseFloat(value.toString())
              : null,
          })
        }
        type="number"
        min={0}
        step={0.01}
        placeholder="0.00"
        showHelpIcon
        helpHint={formatHelpHint(
          getFieldHelpHint('compare_at_price') || {
            hint: 'Prix barré affiché pour montrer une réduction (doit être >= prix)',
          }
        )}
        validationFn={value => {
          if (value === null || value === undefined || value === '') return null; // Optionnel
          const numValue = typeof value === 'number' ? value : parseFloat(value.toString());
          return validateComparePrice(numValue, data.price || 0);
        }}
        onKeyDown={handleSpaceKeyDown}
        className="text-base sm:text-sm"
      />
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
