/**
 * Composant réutilisable pour l'affichage des pièces jointes (images, vidéos, fichiers)
 * 
 * Version simplifiée - Logique d'erreur extraite dans useMediaErrorHandler
 * Date: 1 Février 2025
 */

import { useMemo, useCallback, memo, useEffect } from 'react';
import { detectMediaType } from '@/utils/media-detection';
import { getCorrectedFileUrl } from '@/utils/storage';
import { MEDIA_SIZES, type MediaSize } from '@/constants/media';
import { FileWarning, Paperclip } from 'lucide-react';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { useMediaErrorHandler } from '@/hooks/useMediaErrorHandler';
import { formatFileSize } from '@/utils/fileValidation';

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

function MediaAttachmentComponent({
  attachment,
  size = 'medium',
  showSize = false,
  className,
  onError,
  onClick,
}: MediaAttachmentProps) {
  // Détecter le type de média
  const mediaType = useMemo(
    () => detectMediaType(attachment.file_name, attachment.file_type),
    [attachment.file_name, attachment.file_type]
  );

  // Corriger l'URL
  const correctedUrl = useMemo(
    () => getCorrectedFileUrl(attachment.file_url, attachment.storage_path),
    [attachment.file_url, attachment.storage_path]
  );

  // Gestion des erreurs (hook simplifié)
  const {
    state: errorState,
    handleError,
    analyzeErrorResponse,
    handleSuccess,
    reset,
  } = useMediaErrorHandler({
    originalUrl: attachment.file_url,
    correctedUrl,
    storagePath: attachment.storage_path,
    attachmentId: attachment.id,
    fileName: attachment.file_name,
    onError,
  });

  // Réinitialiser l'état quand l'attachment change
  useEffect(() => {
    reset();
  }, [attachment.id, attachment.file_url, reset]);

  // URL d'affichage (priorité: signedUrl > correctedUrl > originalUrl)
  const displayUrl = useMemo(() => {
    return errorState.signedUrl || correctedUrl || attachment.file_url || '';
  }, [errorState.signedUrl, correctedUrl, attachment.file_url]);

  // Classes CSS pour la taille
  const sizeClasses = useMemo(
    () => MEDIA_SIZES[size],
    [size]
  );

  // Gérer l'erreur de chargement d'image
  const handleImageError = useCallback(async () => {
    // Analyser la réponse HTTP pour obtenir plus d'infos (détecte JSON, etc.)
    await analyzeErrorResponse(displayUrl);
    // Essayer de récupérer avec URL signée (gère automatiquement le cas JSON)
    await handleError();
  }, [displayUrl, analyzeErrorResponse, handleError]);

  // Vérifier immédiatement si l'URL retourne du JSON avant même le chargement
  useEffect(() => {
    // Ne vérifier que si on n'a pas encore essayé l'URL signée et qu'on a une URL
    if (!errorState.triedSignedUrl && displayUrl && !errorState.isLoading && !errorState.hasError && !errorState.allAttemptsFailed) {
      // Vérifier rapidement si l'URL retourne du JSON
      const checkUrl = async () => {
        try {
          const response = await fetch(displayUrl, { method: 'HEAD', cache: 'no-cache' });
          const contentType = response.headers.get('content-type') || '';
          
          // Si c'est du JSON, le fichier n'existe pas - essayer immédiatement l'URL signée
          if (response.ok && contentType.includes('application/json')) {
            // Analyser d'abord pour mettre à jour l'état
            await analyzeErrorResponse(displayUrl);
            // Puis essayer l'URL signée (qui va aussi vérifier si elle fonctionne)
            await handleError();
          } else if (!response.ok) {
            // Si l'URL ne fonctionne pas (404, 403, etc.), essayer l'URL signée
            await analyzeErrorResponse(displayUrl);
            await handleError();
          }
        } catch {
          // Ignorer les erreurs de fetch (CORS, réseau, etc.)
          // On laissera le navigateur essayer de charger l'image normalement
        }
      };
      
      // Délai court pour éviter de surcharger
      const timeoutId = setTimeout(checkUrl, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [displayUrl, errorState.triedSignedUrl, errorState.isLoading, errorState.hasError, errorState.allAttemptsFailed, analyzeErrorResponse, handleError]);

  // Affichage selon le type de média
  if (mediaType === 'image') {
    // Si toutes les tentatives ont échoué, afficher directement l'erreur sans essayer de charger l'image
    if (errorState.allAttemptsFailed && errorState.hasError) {
      return (
        <div className={cn('relative group', className)}>
          <div className={cn(
            sizeClasses.className,
            'rounded-lg object-contain border border-destructive/50 shadow-sm bg-muted/50 flex items-center justify-center min-h-[200px]'
          )}>
            <div className="flex flex-col items-center justify-center gap-3 p-4 text-center max-w-full">
              <FileWarning className="h-8 w-8 text-destructive flex-shrink-0" />
              <p className="text-sm font-medium text-foreground">
                Image non disponible
              </p>
              {errorState.errorStatus && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    Erreur HTTP {errorState.errorStatus}
                    {errorState.errorStatus === 403 && ' - Permissions insuffisantes'}
                    {errorState.errorStatus === 404 && ' - Fichier introuvable'}
                  </p>
                  {errorState.errorStatus === 200 && errorState.contentType && !errorState.contentType.startsWith('image/') && (
                    <div className="flex flex-col items-center gap-1 mt-1">
                      <span className="text-[10px] text-destructive font-medium">
                        ⚠️ Le serveur retourne {errorState.contentType.includes('html') ? 'du HTML' : errorState.contentType.includes('json') ? 'du JSON' : errorState.contentType} au lieu d'une image
                      </span>
                      {errorState.contentType.includes('json') && (
                        <span className="text-[9px] text-muted-foreground text-center max-w-[200px]">
                          Le fichier n'existe probablement pas dans le bucket
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center max-w-[200px] truncate" title={attachment.file_name}>
                {attachment.file_name}
              </p>
              <div className="flex flex-col gap-2 items-center">
                <a
                  href={attachment.file_url || correctedUrl || displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-primary text-primary-foreground px-3 py-2 rounded hover:bg-primary/90 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onClick) {
                      onClick();
                    }
                  }}
                >
                  Ouvrir dans un nouvel onglet
                </a>
                {errorState.contentType?.includes('json') && (
                  <a
                    href="/admin/storage-diagnostic"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-primary hover:text-primary/80 underline"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    💡 Nettoyer les fichiers manquants
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Si aucune URL n'est disponible, afficher le fallback
    if (!displayUrl) {
      return (
        <div className={cn('flex items-center gap-2', className)}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted rounded">
            <FileWarning className="h-4 w-4 text-destructive" />
            <span>{attachment.file_name}</span>
            {showSize && attachment.file_size && (
              <span className="text-xs opacity-75">({formatFileSize(attachment.file_size)})</span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={cn('relative group', className)}>
        <img
          key={displayUrl}
          src={displayUrl}
          alt={attachment.file_name || 'Image'}
          className={cn(
            sizeClasses.className,
            'rounded-lg object-contain cursor-pointer hover:opacity-90 transition-opacity border border-border/50 shadow-sm bg-muted/50',
            errorState.isLoading && 'opacity-50',
            errorState.allAttemptsFailed && errorState.hasError && 'opacity-60'
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
          onLoad={handleSuccess}
        />

        {/* Overlay d'erreur si toutes les tentatives ont échoué */}
        {errorState.allAttemptsFailed && errorState.hasError && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center gap-3 p-4">
            <div className="flex flex-col items-center gap-2">
              <FileWarning className="h-8 w-8 text-destructive" />
              <p className="text-sm font-medium text-foreground text-center">
                Image non disponible
              </p>
              {errorState.errorStatus && (
                <div className="text-xs text-muted-foreground text-center space-y-1">
                  <p>
                    Erreur HTTP {errorState.errorStatus}
                    {errorState.errorStatus === 403 && ' - Permissions insuffisantes'}
                    {errorState.errorStatus === 404 && ' - Fichier introuvable'}
                  </p>
                  {errorState.errorStatus === 200 && errorState.contentType && !errorState.contentType.startsWith('image/') && (
                    <div className="flex flex-col items-center gap-1 mt-1">
                      <span className="text-[10px] text-destructive font-medium">
                        ⚠️ Le serveur retourne {errorState.contentType.includes('html') ? 'du HTML' : errorState.contentType.includes('json') ? 'du JSON' : errorState.contentType} au lieu d'une image
                      </span>
                      {errorState.contentType.includes('json') && (
                        <span className="text-[9px] text-muted-foreground text-center max-w-[200px]">
                          Le fichier n'existe probablement pas dans le bucket
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                {attachment.file_name}
              </p>
            </div>
            <div className="flex flex-col gap-2 items-center">
              <a
                href={attachment.file_url || correctedUrl || displayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-primary text-primary-foreground px-3 py-2 rounded hover:bg-primary/90 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClick) {
                    onClick();
                  }
                }}
              >
                Ouvrir dans un nouvel onglet
              </a>
              {errorState.errorStatus === 403 && (
                <p className="text-xs text-muted-foreground text-center max-w-[250px] mt-2">
                  ⚠️ Problème de permissions RLS. Vérifiez les politiques dans Supabase Dashboard
                </p>
              )}
            </div>
          </div>
        )}

        {/* Overlay subtil au survol */}
        {!errorState.allAttemptsFailed && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-colors pointer-events-none" />
        )}
      </div>
    );
  }

  // Vidéo
  if (mediaType === 'video') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <video
          src={displayUrl}
          controls
          className={cn(sizeClasses.className, 'rounded-lg object-contain bg-muted/50')}
          onError={() => {
            if (import.meta.env.DEV) {
              logger.error('Video load error', {
                attachmentId: attachment.id,
                url: displayUrl,
              });
            }
            onError?.(new Error(`Failed to load video: ${attachment.file_name}`));
          }}
        >
          Votre navigateur ne supporte pas la balise vidéo.
        </video>
      </div>
    );
  }

  // Fichier générique
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

// Export avec React.memo pour optimiser les re-renders
export const MediaAttachment = memo(MediaAttachmentComponent, (prevProps, nextProps) => {
  return (
    prevProps.attachment.id === nextProps.attachment.id &&
    prevProps.attachment.file_url === nextProps.attachment.file_url &&
    prevProps.attachment.storage_path === nextProps.attachment.storage_path &&
    prevProps.size === nextProps.size &&
    prevProps.showSize === nextProps.showSize &&
    prevProps.className === nextProps.className
  );
});






