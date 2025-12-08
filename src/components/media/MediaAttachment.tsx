/**
 * Composant réutilisable pour l'affichage des pièces jointes (images, vidéos, fichiers)
 * 
 * Ce composant centralise toute la logique d'affichage des médias dans les messages,
 * avec gestion d'erreurs, fallback avec URL signée, et support de tous les types de fichiers.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { detectMediaType } from '@/utils/media-detection';
import { getCorrectedFileUrl, extractStoragePath } from '@/utils/storage';
import { MEDIA_SIZES, type MediaSize } from '@/constants/media';
import { FileWarning, Paperclip } from 'lucide-react';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

export interface MediaAttachmentProps {
  /** Données de l'attachment */
  attachment: {
    id: string;
    file_name: string;
    file_type: string;
    file_url: string;
    storage_path?: string;
    file_size?: number;
  };
  /** Taille d'affichage */
  size?: MediaSize;
  /** Afficher la taille du fichier */
  showSize?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
  /** Callback appelé en cas d'erreur */
  onError?: (error: Error) => void;
  /** Callback appelé lors du clic sur l'image */
  onClick?: () => void;
}

export function MediaAttachment({
  attachment,
  size = 'medium',
  showSize = false,
  className,
  onError,
  onClick,
}: MediaAttachmentProps) {
  const [imageError, setImageError] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [triedSignedUrl, setTriedSignedUrl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Détecter le type de média
  const mediaType = detectMediaType(attachment.file_name, attachment.file_type);

  // Corriger l'URL
  const correctedUrl = getCorrectedFileUrl(attachment.file_url, attachment.storage_path);
  const displayUrl = signedUrl || correctedUrl;

  // Obtenir les classes CSS pour la taille
  const sizeClasses = MEDIA_SIZES[size];

  // Logs de débogage complets
  useEffect(() => {
    logger.info('MediaAttachment - Component render', {
      attachmentId: attachment.id,
      fileName: attachment.file_name,
      fileType: attachment.file_type,
      mediaType,
      originalUrl: attachment.file_url,
      storagePath: attachment.storage_path,
      correctedUrl,
      displayUrl,
      signedUrl,
      imageError,
      triedSignedUrl,
      size,
    });
  }, [attachment.id, attachment.file_name, attachment.file_type, attachment.file_url, attachment.storage_path, mediaType, correctedUrl, displayUrl, signedUrl, imageError, triedSignedUrl, size]);

  // Gérer l'erreur de chargement d'image
  const handleImageError = async () => {
    // Si on a déjà essayé l'URL signée et que ça a échoué, afficher le lien
    if (triedSignedUrl && imageError) {
      logger.warn('MediaAttachment - All attempts failed, showing fallback link', {
        attachmentId: attachment.id,
        fileName: attachment.file_name,
      });
      return;
    }

    // Si on a déjà une URL signée et qu'elle échoue aussi, afficher le lien
    if (signedUrl && imageError) {
      logger.warn('MediaAttachment - Signed URL also failed, showing fallback link', {
        attachmentId: attachment.id,
        fileName: attachment.file_name,
      });
      return;
    }

    // Première erreur : essayer avec URL signée
    if (!triedSignedUrl) {
      setIsLoading(true);
      setTriedSignedUrl(true);

      try {
        // Extraire le chemin depuis l'URL
        const path = extractStoragePath(correctedUrl) || attachment.storage_path;
        
        if (!path) {
          logger.error('Could not extract storage path', { 
            fileUrl: attachment.file_url,
            correctedUrl,
            storagePath: attachment.storage_path 
          });
          setImageError(true);
          setIsLoading(false);
          return;
        }

        // Vérifier si le fichier existe
        const folderPath = path.split('/').slice(0, -1).join('/');
        const fileName = path.split('/').pop();
        
        const { data: listData, error: listError } = await supabase.storage
          .from('attachments')
          .list(folderPath, {
            search: fileName,
          });

        logger.info('File existence check', { 
          folderPath,
          fileName,
          path, 
          exists: listData && listData.length > 0,
          listError 
        });

        if (listData && listData.length > 0) {
          // Le fichier existe, générer une URL signée
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('attachments')
            .createSignedUrl(path, 3600); // Valide 1 heure

          if (!signedUrlError && signedUrlData?.signedUrl) {
            logger.info('Generated signed URL, will retry with signed URL', { 
              signedUrl: signedUrlData.signedUrl,
              originalUrl: attachment.file_url,
              correctedUrl 
            });
            setSignedUrl(signedUrlData.signedUrl);
            setImageError(false); // Réinitialiser l'erreur pour permettre le re-render
            setIsLoading(false);
            // Le re-render avec signedUrl affichera l'image avec la nouvelle URL
            return;
          }

          logger.error('Could not generate signed URL', signedUrlError || undefined);
        } else {
          logger.error('File does not exist in bucket', { path });
        }
      } catch (error) {
        logger.error('Error checking file or generating signed URL', error instanceof Error ? { message: error.message, error } : { error });
      } finally {
        setIsLoading(false);
        setImageError(true);
      }
    } else {
      // Si on a déjà essayé l'URL signée et que ça échoue encore, c'est définitif
      setImageError(true);
    }
  };

  // Formatage de la taille du fichier
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Affichage selon le type de média
  if (mediaType === 'image') {
    // Logs de débogage pour comprendre pourquoi un lien est affiché
    if (imageError && triedSignedUrl) {
      logger.warn('MediaAttachment - Displaying fallback link', {
        attachmentId: attachment.id,
        fileName: attachment.file_name,
        imageError,
        triedSignedUrl,
        displayUrl,
        originalUrl: attachment.file_url,
        correctedUrl,
      });
      
      return (
        <div className={cn('flex items-center gap-2', className)}>
          <a
            href={attachment.file_url || correctedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted rounded hover:text-primary transition-colors"
            onClick={(e) => {
              if (onClick) {
                e.preventDefault();
                onClick();
              }
            }}
          >
            <FileWarning className="h-4 w-4 text-destructive" />
            <span>{attachment.file_name}</span>
            {showSize && attachment.file_size && (
              <span className="text-xs opacity-75">({formatFileSize(attachment.file_size)})</span>
            )}
            <span className="text-primary underline ml-2">Ouvrir</span>
          </a>
        </div>
      );
    }

    // Toujours essayer d'afficher l'image (même si l'URL n'est pas "valide" selon la validation stricte)
    // Le navigateur et onError géreront les erreurs
    logger.info('MediaAttachment - Attempting to display image', {
      attachmentId: attachment.id,
      fileName: attachment.file_name,
      displayUrl,
      originalUrl: attachment.file_url,
      correctedUrl,
      imageError,
      triedSignedUrl,
    });

    return (
      <div className={cn('relative group', className)}>
        <img
          key={displayUrl} // Force le re-render quand l'URL change
          src={displayUrl}
          alt={attachment.file_name || 'Image'}
          className={cn(
            sizeClasses.className,
            'rounded-lg object-contain cursor-pointer hover:opacity-90 transition-opacity border border-border/50 shadow-sm bg-muted/50',
            isLoading && 'opacity-50'
          )}
          loading="lazy"
          decoding="async"
          onClick={() => {
            if (onClick) {
              onClick();
            } else {
              window.open(displayUrl, '_blank');
            }
          }}
          onError={handleImageError}
          onLoad={() => {
            setIsLoading(false);
            setImageError(false); // Réinitialiser l'erreur si l'image se charge
            logger.info('Image loaded successfully', { 
              attachmentId: attachment.id,
              url: displayUrl,
              originalUrl: attachment.file_url,
              correctedUrl: correctedUrl,
              signedUrl: signedUrl
            });
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-colors pointer-events-none" />
      </div>
    );
  }

  if (mediaType === 'video') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <video
          src={displayUrl}
          controls
          className={cn(sizeClasses.className, 'rounded-lg object-contain bg-muted/50')}
          onError={() => {
            logger.error('Video load error', { 
              attachmentId: attachment.id,
              url: displayUrl 
            });
            onError?.(new Error(`Failed to load video: ${attachment.file_name}`));
          }}
        >
          Votre navigateur ne supporte pas la balise vidéo.
        </video>
      </div>
    );
  }

  // Fichier générique
  // Log si un fichier qui devrait être une image est traité comme fichier
  if (attachment.file_name && (
    attachment.file_name.toLowerCase().endsWith('.png') ||
    attachment.file_name.toLowerCase().endsWith('.jpg') ||
    attachment.file_name.toLowerCase().endsWith('.jpeg') ||
    attachment.file_name.toLowerCase().endsWith('.gif') ||
    attachment.file_name.toLowerCase().endsWith('.webp')
  )) {
    logger.warn('MediaAttachment - Image file detected as generic file', {
      attachmentId: attachment.id,
      fileName: attachment.file_name,
      fileType: attachment.file_type,
      detectedMediaType: mediaType,
      originalUrl: attachment.file_url,
    });
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <a
        href={attachment.file_url || correctedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm underline text-muted-foreground p-2 bg-muted rounded hover:text-primary transition-colors"
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <Paperclip className="h-4 w-4" />
        <span>{attachment.file_name}</span>
        {showSize && attachment.file_size && (
          <span className="text-xs opacity-75">({formatFileSize(attachment.file_size)})</span>
        )}
      </a>
    </div>
  );
}
