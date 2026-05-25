/**
 * Hook pour gérer les erreurs de chargement des médias
 * Date: 1 Février 2025
 *
 * Extrait la logique complexe de gestion d'erreurs de MediaAttachment.tsx
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { extractStoragePath } from '@/utils/storage';

export interface MediaErrorState {
  /** Erreur de chargement */
  hasError: boolean;
  /** Toutes les tentatives ont échoué */
  allAttemptsFailed: boolean;
  /** Code de statut HTTP */
  errorStatus: number | null;
  /** Content-Type détecté */
  contentType: string | null;
  /** URL signée générée */
  signedUrl: string | null;
  /** Tentative d'URL signée effectuée */
  triedSignedUrl: boolean;
  /** Chargement en cours */
  isLoading: boolean;
}

export interface UseMediaErrorHandlerOptions {
  /** URL originale du fichier */
  originalUrl: string;
  /** URL corrigée */
  correctedUrl: string;
  /** Chemin de stockage */
  storagePath?: string;
  /** ID de l'attachment (pour les logs) */
  attachmentId?: string;
  /** Nom du fichier (pour les logs) */
  fileName?: string;
  /** Callback appelé en cas d'erreur */
  onError?: (error: Error) => void;
}

/**
 * Hook pour gérer les erreurs de chargement des médias
 *
 * @example
 * const { state, handleError, trySignedUrl, reset } = useMediaErrorHandler({
 *   originalUrl: attachment.file_url,
 *   correctedUrl: correctedUrl,
 *   storagePath: attachment.storage_path,
 * });
 */
export function useMediaErrorHandler(options: UseMediaErrorHandlerOptions) {
  const { originalUrl, correctedUrl, storagePath, attachmentId, fileName, onError } = options;

  const [state, setState] = useState<MediaErrorState>({
    hasError: false,
    allAttemptsFailed: false,
    errorStatus: null,
    contentType: null,
    signedUrl: null,
    triedSignedUrl: false,
    isLoading: false,
  });

  /**
   * Réinitialiser l'état d'erreur
   */
  const reset = useCallback(() => {
    setState({
      hasError: false,
      allAttemptsFailed: false,
      errorStatus: null,
      contentType: null,
      signedUrl: null,
      triedSignedUrl: false,
      isLoading: false,
    });
  }, []);

  /**
   * Essayer de générer une URL signée
   */
  const trySignedUrl = useCallback(async (): Promise<string | null> => {
    if (state.triedSignedUrl || state.allAttemptsFailed) {
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, triedSignedUrl: true }));

    try {
      // Essayer plusieurs variantes de chemins possibles
      const possiblePaths: string[] = [];

      if (storagePath) {
        // Nettoyer le storage_path pour s'assurer qu'il n'a pas de préfixe
        const cleanPath = storagePath
          .replace(/^attachments\//, '')
          .replace(/^\/attachments\//, '')
          .replace(/^storage\/v1\/object\/public\/attachments\//, '')
          .replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/attachments\//, '')
          .replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/sign\/attachments\//, '');

        if (cleanPath) {
          possiblePaths.push(cleanPath);

          // Essayer aussi sans le dossier parent si c'est un chemin avec dossier
          // Ex: vendor-message-attachments/uuid/file.png -> file.png
          const pathParts = cleanPath.split('/');
          if (pathParts.length > 1) {
            // Essayer juste le nom du fichier
            possiblePaths.push(pathParts[pathParts.length - 1]);
            // Essayer sans le premier dossier (ex: uuid/file.png)
            if (pathParts.length > 2) {
              possiblePaths.push(pathParts.slice(1).join('/'));
            }
          }
        }
      }

      // Extraire depuis les URLs
      const extractedFromCorrected = extractStoragePath(correctedUrl);
      if (extractedFromCorrected && !possiblePaths.includes(extractedFromCorrected)) {
        possiblePaths.push(extractedFromCorrected);
      }

      const extractedFromOriginal = extractStoragePath(originalUrl);
      if (extractedFromOriginal && !possiblePaths.includes(extractedFromOriginal)) {
        possiblePaths.push(extractedFromOriginal);
      }

      if (possiblePaths.length === 0) {
        if (import.meta.env.DEV) {
          logger.warn('Could not extract storage path', {
            attachmentId,
            fileName,
            originalUrl,
            correctedUrl,
            storagePath,
          });
        }
        setState(prev => ({ ...prev, isLoading: false, hasError: true, allAttemptsFailed: true }));
        onError?.(new Error('Impossible de déterminer le chemin du fichier'));
        return null;
      }

      // Essayer chaque chemin possible jusqu'à ce qu'on trouve un qui fonctionne
      let path: string | null = null;
      let lastError: unknown = null;

      for (const testPath of possiblePaths) {
        try {
          if (import.meta.env.DEV) {
            logger.info('🔍 Testing path variant', {
              attachmentId,
              fileName,
              testPath,
              totalVariants: possiblePaths.length,
            });
          }

          // Générer une URL signée pour tester
          const { data: testSignedUrlData, error: testError } = await supabase.storage
            .from('attachments')
            .createSignedUrl(testPath, 60); // Court délai pour le test

          if (!testError && testSignedUrlData?.signedUrl) {
            // Vérifier que l'URL signée fonctionne réellement
            try {
              const testResponse = await fetch(testSignedUrlData.signedUrl, {
                method: 'HEAD',
                cache: 'no-cache',
              });

              const testContentType = testResponse.headers.get('content-type') || '';

              // Si ça retourne une image, c'est le bon chemin
              if (testResponse.ok && testContentType.startsWith('image/')) {
                path = testPath;
                if (import.meta.env.DEV) {
                  logger.info('✅ Found working path variant', {
                    attachmentId,
                    fileName,
                    workingPath: path,
                    testedVariants: possiblePaths.indexOf(testPath) + 1,
                    totalVariants: possiblePaths.length,
                  });
                }
                break; // Sortir de la boucle, on a trouvé le bon chemin
              }
            } catch {
              // Continuer avec le prochain chemin
            }
          }

          lastError = testError;
        } catch (err) {
          lastError = err;
        }
      }

      // Si aucun chemin n'a fonctionné, utiliser le premier comme fallback
      if (!path) {
        path = possiblePaths[0];
        if (import.meta.env.DEV) {
          logger.warn('⚠️ No working path variant found, using first as fallback', {
            attachmentId,
            fileName,
            fallbackPath: path,
            testedVariants: possiblePaths.length,
          });
        }
      }

      // Ne pas vérifier avec list() car cela peut échouer à cause des politiques RLS
      // Essayer directement de générer une URL signée
      // Si le fichier n'existe pas, createSignedUrl retournera une erreur

      // Log du chemin utilisé pour le débogage
      if (import.meta.env.DEV) {
        logger.info('🔍 Attempting to generate signed URL', {
          attachmentId,
          fileName,
          path,
          originalPath: storagePath,
          correctedUrl,
          originalUrl,
          testedVariants: possiblePaths.length,
        });
      }

      // Générer l'URL signée avec le chemin trouvé (ou le premier en fallback)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('attachments')
        .createSignedUrl(path, 3600); // Valide 1 heure

      if (signedUrlError || !signedUrlData?.signedUrl) {
        // Analyser l'erreur pour déterminer si c'est un fichier introuvable
        const isFileNotFound =
          signedUrlError?.message?.toLowerCase().includes('not found') ||
          signedUrlError?.message?.toLowerCase().includes('does not exist') ||
          signedUrlError?.code === '404' ||
          signedUrlError?.status === 404;

        if (import.meta.env.DEV) {
          logger.error('❌ Could not generate signed URL', {
            attachmentId,
            fileName,
            path,
            originalPath: storagePath,
            correctedUrl,
            originalUrl,
            error: signedUrlError?.message,
            errorCode: signedUrlError?.code,
            errorDetails: signedUrlError?.details,
            errorStatus: signedUrlError?.status,
            isFileNotFound,
            suggestion: isFileNotFound
              ? "Le fichier n'existe pas dans le bucket. Vérifiez le storage_path en base de données."
              : "Erreur inconnue lors de la génération de l'URL signée.",
          });
        }
        setState(prev => ({
          ...prev,
          isLoading: false,
          hasError: true,
          allAttemptsFailed: true,
        }));
        onError?.(
          new Error(
            isFileNotFound
              ? `Fichier introuvable dans le bucket: ${path}. Le fichier a peut-être été supprimé ou le chemin est incorrect.`
              : signedUrlError?.message || 'Impossible de générer une URL signée.'
          )
        );
        return null;
      }

      // Vérifier que l'URL signée fonctionne réellement en testant avec HEAD
      try {
        const testResponse = await fetch(signedUrlData.signedUrl, {
          method: 'HEAD',
          cache: 'no-cache',
        });

        const testContentType = testResponse.headers.get('content-type') || '';

        // Si l'URL signée retourne aussi du JSON, le fichier n'existe pas
        if (testResponse.ok && testContentType.includes('application/json')) {
          if (import.meta.env.DEV) {
            logger.error('❌ Signed URL generated but returns JSON (file does not exist)', {
              attachmentId,
              fileName,
              path,
              status: testResponse.status,
              contentType: testContentType,
            });
          }
          setState(prev => ({
            ...prev,
            isLoading: false,
            hasError: true,
            allAttemptsFailed: true,
            signedUrl: null, // Ne pas utiliser cette URL signée
          }));
          onError?.(new Error("Le fichier n'existe pas dans le bucket, même avec URL signée"));
          return null;
        }

        // Si l'URL signée ne fonctionne pas (404, 403, etc.)
        if (!testResponse.ok) {
          if (import.meta.env.DEV) {
            logger.error('❌ Signed URL generated but returns error', {
              attachmentId,
              fileName,
              path,
              status: testResponse.status,
              statusText: testResponse.statusText,
            });
          }
          setState(prev => ({
            ...prev,
            isLoading: false,
            hasError: true,
            allAttemptsFailed: true,
            signedUrl: null,
          }));
          onError?.(new Error(`Fichier inaccessible: HTTP ${testResponse.status}`));
          return null;
        }
      } catch (_testError: unknown) {
        // Si le test échoue, on accepte quand même l'URL signée (peut être un problème CORS)
        if (import.meta.env.DEV) {
          logger.warn('⚠️ Could not test signed URL (may be CORS issue)', {
            attachmentId,
            fileName,
            path,
            error: _testError instanceof Error ? _testError.message : String(_testError),
          });
        }
      }

      if (import.meta.env.DEV) {
        logger.info('✅ Signed URL generated and verified successfully', {
          attachmentId,
          fileName,
          path,
          signedUrlPrefix: signedUrlData.signedUrl.substring(0, 100) + '...', // Log partiel pour sécurité
        });
      }

      setState(prev => ({
        ...prev,
        signedUrl: signedUrlData.signedUrl,
        hasError: false,
        isLoading: false,
      }));

      return signedUrlData.signedUrl;
    } catch (_error: unknown) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      if (import.meta.env.DEV) {
        logger.error('❌ Exception generating signed URL', {
          attachmentId,
          fileName,
          path,
          originalPath: storagePath,
          error: err.message,
          errorStack: err.stack,
        });
      }
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true,
        allAttemptsFailed: true,
      }));
      onError?.(new Error(err.message || "Erreur lors de la génération de l'URL signée"));
      return null;
    }
  }, [
    correctedUrl,
    originalUrl,
    storagePath,
    attachmentId,
    fileName,
    state.triedSignedUrl,
    state.allAttemptsFailed,
    onError,
  ]);

  /**
   * Gérer l'erreur de chargement d'image
   */
  const handleError = useCallback(async () => {
    if (state.allAttemptsFailed) {
      return;
    }

    // Si on a déjà une URL signée et qu'elle échoue, toutes les tentatives ont échoué
    if (state.signedUrl && state.triedSignedUrl) {
      setState(prev => ({
        ...prev,
        allAttemptsFailed: true,
        hasError: true,
      }));
      return;
    }

    // Si on reçoit du JSON au lieu d'une image (HTTP 200 avec Content-Type JSON)
    // Essayer immédiatement avec URL signée
    if (
      state.errorStatus === 200 &&
      state.contentType &&
      state.contentType.includes('application/json')
    ) {
      if (!state.triedSignedUrl) {
        const signedUrl = await trySignedUrl();
        // Si l'URL signée échoue aussi, le fichier n'existe probablement pas
        if (!signedUrl) {
          setState(prev => ({
            ...prev,
            allAttemptsFailed: true,
            hasError: true,
          }));
        }
        return;
      }
    }

    // Essayer avec URL signée si pas encore fait
    if (!state.triedSignedUrl) {
      const signedUrl = await trySignedUrl();
      // Si l'URL signée échoue, toutes les tentatives ont échoué
      if (!signedUrl) {
        setState(prev => ({
          ...prev,
          allAttemptsFailed: true,
          hasError: true,
        }));
      }
    } else {
      // Toutes les tentatives ont échoué
      setState(prev => ({
        ...prev,
        allAttemptsFailed: true,
        hasError: true,
      }));
    }
  }, [state, trySignedUrl]);

  /**
   * Analyser la réponse HTTP en cas d'erreur
   */
  const analyzeErrorResponse = useCallback(
    async (url: string) => {
      try {
        let response: Response;
        try {
          response = await fetch(url, { method: 'HEAD' });
        } catch {
          response = await fetch(url, {
            method: 'GET',
            headers: { Range: 'bytes=0-0' },
          });
        }

        const detectedContentType = response.headers.get('content-type') || '';
        const status = response.status;

        setState(prev => ({
          ...prev,
          errorStatus: status,
          contentType: detectedContentType,
        }));

        // Si c'est un 200 avec un mauvais Content-Type, analyser plus en détail
        if (status === 200 && !detectedContentType.startsWith('image/')) {
          try {
            const fullResponse = await fetch(url);
            const blob = await fullResponse.blob();

            if (detectedContentType.includes('application/json')) {
              const text = await blob.text();
              try {
                const jsonContent = JSON.parse(text);
                if (import.meta.env.DEV) {
                  logger.error('❌ CRITICAL: HTTP 200 but invalid Content-Type', {
                    attachmentId,
                    fileName,
                    contentType: detectedContentType,
                    jsonError: jsonContent,
                    url,
                  });
                }
                // Marquer comme erreur pour déclencher l'essai avec URL signée
                setState(prev => ({
                  ...prev,
                  hasError: true,
                  errorStatus: 200,
                  contentType: detectedContentType,
                }));
              } catch {
                // Ignorer les erreurs de parsing
              }
            }
          } catch {
            // Ignorer les erreurs d'analyse
          }
        }

        if (import.meta.env.DEV && status !== 200) {
          logger.error('Image load failed', {
            attachmentId,
            fileName,
            status,
            contentType: detectedContentType,
          });
        }
      } catch (fetchError) {
        // Ignorer les erreurs de fetch (CORS, réseau, etc.)
        if (import.meta.env.DEV) {
          logger.warn('Could not analyze error response', {
            attachmentId,
            fileName,
            error: fetchError,
          });
        }
      }
    },
    [attachmentId, fileName]
  );

  /**
   * Gérer le succès du chargement
   */
  const handleSuccess = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasError: false,
      allAttemptsFailed: false,
      errorStatus: null,
      contentType: null,
      isLoading: false,
    }));
  }, []);

  return {
    state,
    handleError,
    trySignedUrl,
    analyzeErrorResponse,
    handleSuccess,
    reset,
  };
}
