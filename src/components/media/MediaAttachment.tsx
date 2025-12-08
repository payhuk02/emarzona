/**
 * Composant réutilisable pour l'affichage des pièces jointes (images, vidéos, fichiers)
 * 
 * Ce composant centralise toute la logique d'affichage des médias dans les messages,
 * avec gestion d'erreurs, fallback avec URL signée, et support de tous les types de fichiers.
 */

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
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

function MediaAttachmentComponent({
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
  const [allAttemptsFailed, setAllAttemptsFailed] = useState(false);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);
  const [isImageBlob, setIsImageBlob] = useState<boolean | null>(null);
  const [jsonError, setJsonError] = useState<any>(null); // Pour stocker l'erreur JSON de Supabase

  // Détecter le type de média (memoized)
  const mediaType = useMemo(
    () => detectMediaType(attachment.file_name, attachment.file_type),
    [attachment.file_name, attachment.file_type]
  );

  // Corriger l'URL (memoized)
  const correctedUrl = useMemo(
    () => getCorrectedFileUrl(attachment.file_url, attachment.storage_path),
    [attachment.file_url, attachment.storage_path]
  );

  // URL d'affichage (memoized) - S'assurer qu'elle n'est jamais vide pour les images
  const displayUrl = useMemo(() => {
    const url = signedUrl || correctedUrl || attachment.file_url;
    // Pour les images, s'assurer qu'on a au moins une URL valide
    if (mediaType === 'image' && !url) {
      if (import.meta.env.DEV) {
        logger.warn('MediaAttachment - No valid URL for image', {
          attachmentId: attachment.id,
          fileName: attachment.file_name,
          fileUrl: attachment.file_url,
          storagePath: attachment.storage_path,
          correctedUrl,
        });
      }
    }
    return url || '';
  }, [signedUrl, correctedUrl, attachment.file_url, attachment.file_name, attachment.id, attachment.storage_path, mediaType]);

  // Obtenir les classes CSS pour la taille (memoized)
  const sizeClasses = useMemo(
    () => MEDIA_SIZES[size],
    [size]
  );

  // Logs de débogage complets (seulement en développement)
  // Réduire les dépendances : seulement logger quand les valeurs importantes changent
  useEffect(() => {
    if (import.meta.env.DEV) {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment.id, attachment.file_url, mediaType, displayUrl, imageError]);

  // Réinitialiser les états d'erreur quand l'attachment change
  useEffect(() => {
    setImageError(false);
    setTriedSignedUrl(false);
    setSignedUrl(null);
    setAllAttemptsFailed(false);
    setErrorStatus(null);
    setContentType(null);
    setIsImageBlob(null);
    setJsonError(null); // Réinitialiser l'erreur JSON
  }, [attachment.id, attachment.file_url]);

  // Gérer l'erreur de chargement d'image (memoized avec useCallback)
  const handleImageError = useCallback(async () => {
    // Si toutes les tentatives ont déjà échoué, ne rien faire
    if (allAttemptsFailed) {
      return;
    }

    // Si on a déjà une URL signée et qu'elle échoue, toutes les tentatives ont échoué
    if (signedUrl && triedSignedUrl) {
      if (import.meta.env.DEV) {
        logger.warn('MediaAttachment - Signed URL also failed, all attempts exhausted', {
          attachmentId: attachment.id,
          fileName: attachment.file_name,
          displayUrl,
        });
      }
      setAllAttemptsFailed(true);
      setImageError(true);
      return;
    }

    // Première erreur : essayer avec URL signée
    if (!triedSignedUrl) {
      setIsLoading(true);
      setTriedSignedUrl(true);

      try {
        // Extraire le chemin depuis l'URL (essayer d'abord avec correctedUrl, puis signedUrl, puis file_url)
        const path = extractStoragePath(correctedUrl) || 
                     extractStoragePath(attachment.file_url) || 
                     attachment.storage_path;
        
        if (!path) {
          if (import.meta.env.DEV) {
            logger.error('Could not extract storage path, trying direct URL correction', { 
              fileUrl: attachment.file_url,
              correctedUrl,
              storagePath: attachment.storage_path 
            });
          }
          
          // Si on ne peut pas extraire le chemin, on considère que toutes les tentatives ont échoué
          // mais on continue d'essayer d'afficher l'image avec l'URL corrigée
          setIsLoading(false);
          setImageError(true);
          
          // Ne pas marquer comme définitivement échoué - laisser le navigateur essayer
          return;
        }

        // Vérifier d'abord que le fichier existe vraiment dans le bucket
        const folderPath = path.split('/').slice(0, -1).join('/') || '';
        const fileName = path.split('/').pop() || '';
        
        const { data: fileList, error: listError } = await supabase.storage
          .from('attachments')
          .list(folderPath, {
            limit: 100,
            search: fileName
          });

        const fileExists = fileList && fileList.length > 0;
        
          if (import.meta.env.DEV) {
            if (listError) {
              logger.error('❌ File existence check FAILED', { 
                folderPath,
                fileName,
                path,
                listError: {
                  message: listError.message,
                  name: listError.name
                },
                suggestion: 'Problème de permissions RLS ou bucket inaccessible. Vérifiez dans Supabase Dashboard > Storage > Policies'
              });
          } else if (!fileExists) {
            logger.error('❌ File does NOT exist in bucket', { 
              path,
              folderPath,
              fileName,
              filesFound: fileList?.length || 0,
              suggestion: 'Le fichier n\'existe pas dans le bucket. Vérifiez dans Supabase Dashboard > Storage > attachments > vendor-message-attachments/'
            });
          } else {
            logger.info('✅ File exists in bucket', { 
              folderPath,
              fileName,
              path,
              filesFound: fileList.length,
              matchingFiles: fileList.map(f => f.name)
            });
          }
        }

        // Si le fichier n'existe pas, marquer comme échec définitif
        if (listError || !fileExists) {
          setAllAttemptsFailed(true);
          setImageError(true);
          setIsLoading(false);
          const errorMessage = listError 
            ? `Erreur d'accès au bucket: ${listError.message}` 
            : `Fichier introuvable dans le bucket: ${fileName}`;
          onError?.(new Error(errorMessage));
          return;
        }

        // Essayer de générer une URL signée maintenant qu'on sait que le fichier existe
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('attachments')
          .createSignedUrl(path, 3600); // Valide 1 heure

        if (!signedUrlError && signedUrlData?.signedUrl) {
          if (import.meta.env.DEV) {
            logger.info('Generated signed URL, will retry with signed URL', { 
              signedUrl: signedUrlData.signedUrl,
              originalUrl: attachment.file_url,
              correctedUrl,
              path
            });
          }
          setSignedUrl(signedUrlData.signedUrl);
          setImageError(false); // Réinitialiser l'erreur pour permettre le re-render
          setIsLoading(false);
          // Le re-render avec signedUrl affichera l'image avec la nouvelle URL
          return;
        }

        // Si la génération de l'URL signée échoue même si le fichier existe, c'est un problème de permissions
        if (import.meta.env.DEV) {
          logger.error('❌ Could not generate signed URL even though file exists', {
            signedUrlError: signedUrlError ? {
              message: signedUrlError.message,
              name: signedUrlError.name
            } : null,
            path,
            correctedUrl,
            fileName,
            suggestion: 'Problème de permissions RLS sur le bucket "attachments". Vérifiez les politiques dans Supabase Dashboard > Storage > Policies. La politique "Anyone can view attachments" (SELECT) doit être active.'
          });
        }

        // Si la génération de l'URL signée échoue, on continue d'essayer avec l'URL corrigée
        if (import.meta.env.DEV) {
          logger.warn('Could not generate signed URL, will continue with corrected URL', {
            signedUrlError,
            path,
            correctedUrl
          });
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          logger.error('Error generating signed URL', error instanceof Error ? { message: error.message, error } : { error });
        }
        // En cas d'erreur, on continue d'essayer d'afficher avec l'URL corrigée
      } finally {
        setIsLoading(false);
        // Ne pas marquer imageError comme true immédiatement - laisser le navigateur essayer
      }
    } else if (signedUrl) {
      // Si on a déjà essayé l'URL signée et qu'elle échoue, toutes les tentatives ont échoué
      setAllAttemptsFailed(true);
      setImageError(true);
    }
  }, [triedSignedUrl, signedUrl, correctedUrl, allAttemptsFailed, attachment.id, attachment.file_name, attachment.file_url, attachment.storage_path, displayUrl, onError]);

  // Formatage de la taille du fichier (memoized avec useCallback)
  const formatFileSize = useCallback((bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  // Affichage selon le type de média
  if (mediaType === 'image') {
    // Construire l'URL finale à partir de toutes les sources disponibles
    const finalDisplayUrl = displayUrl || correctedUrl || attachment.file_url || '';

    // TOUJOURS essayer d'afficher l'image si on a une URL (même si elle a échoué précédemment)
    // Le navigateur peut réussir à la charger même après plusieurs tentatives
    // On affiche un fallback avec lien seulement si vraiment aucune URL n'est disponible
    if (import.meta.env.DEV) {
      logger.info('MediaAttachment - Attempting to display image', {
        attachmentId: attachment.id,
        fileName: attachment.file_name,
        displayUrl,
        finalDisplayUrl,
        originalUrl: attachment.file_url,
        correctedUrl,
        imageError,
        triedSignedUrl,
        allAttemptsFailed,
      });
    }

    // Si vraiment aucune URL n'est disponible, afficher le fallback
    if (!finalDisplayUrl) {
      if (import.meta.env.DEV) {
        logger.warn('MediaAttachment - No valid URL available, displaying fallback', {
          attachmentId: attachment.id,
          fileName: attachment.file_name,
          originalUrl: attachment.file_url,
          correctedUrl,
        });
      }
      
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
        {/* Toujours afficher l'image même si elle échoue - ne jamais la remplacer par un lien */}
        <img
          key={finalDisplayUrl} // Force le re-render quand l'URL change
          src={finalDisplayUrl}
          alt={attachment.file_name || 'Image'}
          className={cn(
            sizeClasses.className,
            'rounded-lg object-contain cursor-pointer hover:opacity-90 transition-opacity border border-border/50 shadow-sm bg-muted/50',
            isLoading && 'opacity-50',
            allAttemptsFailed && imageError && 'opacity-60' // Légèrement transparent si toutes les tentatives ont échoué
          )}
          loading="lazy"
          decoding="async"
          onClick={() => {
            if (onClick) {
              onClick();
            } else {
              window.open(finalDisplayUrl, '_blank');
            }
          }}
          onError={async () => {
            // Capturer le code de statut HTTP et vérifier le Content-Type
            try {
              // Essayer d'abord avec HEAD, puis avec GET si HEAD échoue (certains serveurs ne supportent pas HEAD)
              let response: Response;
              try {
                response = await fetch(finalDisplayUrl, { method: 'HEAD' });
              } catch {
                // Si HEAD échoue, essayer avec GET mais ne télécharger que les headers
                response = await fetch(finalDisplayUrl, { 
                  method: 'GET',
                  headers: { 'Range': 'bytes=0-0' } // Télécharger seulement le premier byte pour vérifier les headers
                });
              }
              
              const detectedContentType = response.headers.get('content-type') || '';
              setErrorStatus(response.status);
              setContentType(detectedContentType);
              
              // Si le statut est 200 mais que le Content-Type n'est pas une image, analyser le contenu
              if (response.status === 200 && !detectedContentType.startsWith('image/')) {
                // Télécharger le contenu pour analyser
                try {
                  const fullResponse = await fetch(finalDisplayUrl, { method: 'GET' });
                  const blob = await fullResponse.blob();
                  const isImageBlobType = blob.type.startsWith('image/');
                  setIsImageBlob(isImageBlobType);
                  
                  // Si c'est du JSON, parser pour extraire l'erreur
                  if (detectedContentType.includes('application/json') || blob.type.includes('application/json')) {
                    try {
                      const text = await blob.text();
                      const jsonContent = JSON.parse(text);
                      setJsonError(jsonContent);
                    } catch {
                      // Ignorer les erreurs de parsing
                    }
                  }
                } catch {
                  // Ignorer les erreurs d'analyse
                }
              }
              
              if (import.meta.env.DEV) {
                // Si le statut est 200 mais que le Content-Type n'est pas une image, c'est un problème
                const isImageContentType = detectedContentType.startsWith('image/');
                const isHtmlResponse = detectedContentType.includes('text/html') || detectedContentType.includes('application/json');
                const contentLength = response.headers.get('content-length');
                
                logger.error('Image load failed with HTTP status', {
                  attachmentId: attachment.id,
                  fileName: attachment.file_name,
                  url: finalDisplayUrl,
                  status: response.status,
                  statusText: response.statusText,
                  contentType: detectedContentType,
                  isImageContentType,
                  isHtmlResponse,
                  contentLength,
                  suggestion: response.status === 403 
                    ? 'Problème de permissions RLS. Vérifiez les politiques dans Supabase Dashboard > Storage > Policies. La politique "Anyone can view attachments" (SELECT) doit être active.'
                    : response.status === 404
                    ? 'Fichier introuvable dans le bucket malgré la vérification d\'existence'
                    : response.status === 200 && !isImageContentType
                    ? `Le serveur retourne du ${detectedContentType} au lieu d'une image. Le fichier peut être corrompu, vide, ou le Content-Type est incorrect. Vérifiez le fichier dans Supabase Dashboard > Storage.`
                    : response.status === 200 && isHtmlResponse
                    ? 'Le serveur retourne du HTML/JSON au lieu d\'une image. Problème de permissions RLS ou fichier corrompu. Vérifiez les politiques RLS dans Supabase Dashboard.'
                    : response.status === 200 && contentLength === '0'
                    ? 'Le fichier existe mais est vide (0 bytes). Le fichier a peut-être été corrompu lors de l\'upload.'
                    : `Erreur HTTP ${response.status}: ${response.statusText}`
                });
                
                // Si c'est un 200 avec un mauvais Content-Type, c'est un problème critique
                if (response.status === 200 && !isImageContentType) {
                  logger.error('❌ CRITICAL: HTTP 200 but invalid Content-Type', {
                    attachmentId: attachment.id,
                    fileName: attachment.file_name,
                    contentType: detectedContentType,
                    url: finalDisplayUrl,
                    contentLength,
                    suggestion: 'Le serveur retourne du JSON/HTML au lieu d\'une image. Causes possibles: 1) Fichier introuvable (RLS retourne erreur JSON), 2) Fichier corrompu, 3) Content-Type incorrect, 4) Fichier vide. Vérifiez dans Supabase Dashboard > Storage que le fichier existe et est valide.'
                  });
                  
                  // Télécharger le contenu pour analyser la réponse JSON/HTML
                  try {
                    const fullResponse = await fetch(finalDisplayUrl);
                    const blob = await fullResponse.blob();
                    const blobType = blob.type;
                    const blobSize = blob.size;
                    
                    // Vérifier si le blob est vraiment une image
                    const isImageBlobType = blobType.startsWith('image/');
                    setIsImageBlob(isImageBlobType);
                    
                    // Si c'est du JSON, essayer de le parser pour voir le message d'erreur
                    if (detectedContentType.includes('application/json') || blobType.includes('application/json')) {
                      try {
                        const text = await blob.text();
                        let jsonContent;
                        try {
                          jsonContent = JSON.parse(text);
                          setJsonError(jsonContent); // Stocker l'erreur JSON dans l'état
                        } catch {
                          jsonContent = { raw: text.substring(0, 200) }; // Premiers 200 caractères si pas JSON valide
                          setJsonError(jsonContent);
                        }
                        
                        logger.error('❌ JSON Response Analysis (Supabase Error)', {
                          attachmentId: attachment.id,
                          fileName: attachment.file_name,
                          url: finalDisplayUrl,
                          jsonError: jsonContent,
                          blobSize,
                          suggestion: jsonContent.error || jsonContent.message 
                            ? `Erreur Supabase: ${jsonContent.error || jsonContent.message}. Vérifiez les politiques RLS dans Supabase Dashboard > Storage > Policies.`
                            : 'Le serveur retourne du JSON au lieu d\'une image. Problème de permissions RLS ou fichier introuvable.'
                        });
                      } catch (textError) {
                        logger.error('Could not parse JSON response', { textError, blobSize });
                        setJsonError({ parseError: 'Could not parse JSON response' });
                      }
                    } else if (detectedContentType.includes('text/html') || blobType.includes('text/html')) {
                      // Si c'est du HTML, c'est probablement une page d'erreur
                      const text = await blob.text();
                      const isErrorPage = text.includes('error') || text.includes('404') || text.includes('403') || text.includes('Not Found');
                      
                      logger.error('❌ HTML Response Analysis (Error Page)', {
                        attachmentId: attachment.id,
                        fileName: attachment.file_name,
                        url: finalDisplayUrl,
                        isErrorPage,
                        blobSize,
                        preview: text.substring(0, 300),
                        suggestion: isErrorPage 
                          ? 'Le serveur retourne une page d\'erreur HTML. Fichier introuvable ou problème de permissions RLS.'
                          : 'Le serveur retourne du HTML au lieu d\'une image.'
                      });
                      setJsonError({ htmlError: true, isErrorPage });
                    } else {
                      logger.error('File content analysis', {
                        attachmentId: attachment.id,
                        fileName: attachment.file_name,
                        blobType,
                        blobSize,
                        isImageBlob: isImageBlobType,
                        firstBytes: blobSize > 0 ? 'File has content' : 'File is empty',
                        suggestion: isImageBlobType
                          ? 'Le blob est une image mais le Content-Type HTTP est incorrect. Problème de configuration Supabase.'
                          : blobSize === 0
                          ? 'Le fichier est vide (0 bytes). Il a été corrompu lors de l\'upload.'
                          : `Le fichier contient du ${blobType}, pas une image.`
                      });
                    }
                  } catch (blobError) {
                    logger.error('Could not analyze response content', {
                      attachmentId: attachment.id,
                      error: blobError
                    });
                  }
                }
              }
            } catch (fetchError) {
              // Si la requête fetch échoue (CORS, réseau, etc.), on ne peut pas obtenir le statut
              if (import.meta.env.DEV) {
                logger.error('Could not determine HTTP status (CORS or network error)', {
                  attachmentId: attachment.id,
                  url: finalDisplayUrl,
                  error: fetchError
                });
              }
            }
            
            handleImageError();
          }}
          onLoad={() => {
            setIsLoading(false);
            setImageError(false); // Réinitialiser l'erreur si l'image se charge
            setAllAttemptsFailed(false); // Réinitialiser aussi le flag d'échec complet
            setErrorStatus(null); // Réinitialiser le code de statut
            setContentType(null); // Réinitialiser le Content-Type
            setIsImageBlob(null);
            setJsonError(null); // Réinitialiser l'erreur JSON
            if (import.meta.env.DEV) {
              logger.info('Image loaded successfully', { 
                attachmentId: attachment.id,
                url: finalDisplayUrl,
                originalUrl: attachment.file_url,
                correctedUrl: correctedUrl,
                signedUrl: signedUrl
              });
            }
          }}
        />
        
        {/* Overlay avec message d'erreur et lien de secours seulement si l'image a vraiment échoué */}
        {allAttemptsFailed && imageError && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center gap-3 p-4">
            <div className="flex flex-col items-center gap-2">
              <FileWarning className="h-8 w-8 text-destructive" />
              <p className="text-sm font-medium text-foreground text-center">
                Image non disponible
              </p>
              {errorStatus && (
                <p className="text-xs text-muted-foreground text-center">
                  Erreur HTTP {errorStatus}
                  {errorStatus === 403 && ' - Permissions insuffisantes'}
                  {errorStatus === 404 && ' - Fichier introuvable'}
              {errorStatus === 200 && (
                <>
                  {' - Le serveur répond mais le contenu n\'est pas une image valide'}
                  {contentType && (
                    <>
                      <span className="block mt-1 text-[10px] opacity-75">
                        Content-Type: {contentType}
                      </span>
                      {!contentType.startsWith('image/') && (
                        <span className="block mt-1 text-[10px] text-destructive">
                          ⚠️ Le serveur retourne {contentType.includes('html') ? 'du HTML' : contentType.includes('json') ? 'du JSON' : contentType} au lieu d'une image
                        </span>
                      )}
                      {jsonError && (
                        <span className="block mt-1 text-[10px] text-destructive">
                          Détail: {jsonError.message || jsonError.error || JSON.stringify(jsonError)}
                        </span>
                      )}
                    </>
                  )}
                </>
              )}
                </p>
              )}
              <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                {attachment.file_name}
              </p>
            </div>
            <div className="flex flex-col gap-2 items-center">
              <div className="flex gap-2">
                <a
                  href={attachment.file_url || correctedUrl || finalDisplayUrl}
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
                {import.meta.env.DEV && (
                  <button
                    className="text-xs bg-secondary text-secondary-foreground px-3 py-2 rounded hover:bg-secondary/90 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      logger.info('Attachment debug info', {
                        attachmentId: attachment.id,
                        fileName: attachment.file_name,
                        fileType: attachment.file_type,
                        mediaType,
                        originalUrl: attachment.file_url,
                        storagePath: attachment.storage_path,
                        correctedUrl,
                        displayUrl,
                        finalDisplayUrl,
                        signedUrl,
                        imageError,
                        triedSignedUrl,
                        allAttemptsFailed,
                        errorStatus,
                        contentType,
                        isImageBlob,
                        jsonError, // Inclure l'erreur JSON dans le debug info
                        size,
                      });
                      alert('Debug info logged to console.');
                    }}
                  >
                    Debug
                  </button>
                )}
              </div>
              {errorStatus === 403 && (
                <p className="text-xs text-muted-foreground text-center max-w-[250px] mt-2">
                  ⚠️ Problème de permissions RLS. Vérifiez les politiques dans Supabase Dashboard
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Overlay subtil au survol */}
        {!allAttemptsFailed && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-colors pointer-events-none" />
        )}
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
            if (import.meta.env.DEV) {
              logger.error('Video load error', { 
                attachmentId: attachment.id,
                url: displayUrl 
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
  // Log si un fichier qui devrait être une image est traité comme fichier (seulement en développement)
  if (import.meta.env.DEV && attachment.file_name && (
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

// Export avec React.memo pour optimiser les re-renders
export const MediaAttachment = memo(MediaAttachmentComponent, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter les re-renders inutiles
  return (
    prevProps.attachment.id === nextProps.attachment.id &&
    prevProps.attachment.file_url === nextProps.attachment.file_url &&
    prevProps.attachment.storage_path === nextProps.attachment.storage_path &&
    prevProps.size === nextProps.size &&
    prevProps.showSize === nextProps.showSize &&
    prevProps.className === nextProps.className
  );
});
