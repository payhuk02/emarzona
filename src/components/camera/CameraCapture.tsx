/**
 * Composant de capture photo avec caméra avant/arrière
 * Supporte la bascule entre caméras et la capture directe
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Camera, FlipHorizontal, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface CameraCaptureProps {
  /** Callback appelé avec le fichier capturé */
  onCapture: (file: File) => void;
  /** Callback appelé pour fermer */
  onClose: () => void;
  /** Si le dialog est ouvert */
  open: boolean;
  /** Label du bouton de capture */
  captureLabel?: string;
}

type FacingMode = 'user' | 'environment';

export function CameraCapture({
  onCapture,
  onClose,
  open,
  captureLabel = 'Prendre la photo',
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<FacingMode>('environment'); // Par défaut caméra arrière
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const { toast } = useToast();

  // Démarrer le flux vidéo
  const startStream = useCallback(
    async (mode: FacingMode): Promise<void> => {
      // Arrêter le stream précédent
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Vérifier que videoRef est disponible
      if (!videoRef.current) {
        const error = new Error('Référence vidéo non disponible');
        logger.error('videoRef.current is null when starting stream', { mode });
        setError('Référence vidéo non disponible. Veuillez réessayer.');
        throw error;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Vérifier que l'API est disponible
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            "L'API de la caméra n'est pas disponible. Votre navigateur ne supporte pas l'accès à la caméra."
          );
        }

        const  constraints: MediaStreamConstraints = {
          video: {
            facingMode: mode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        logger.info('Camera stream obtained', {
          facingMode: mode,
          tracks: stream.getTracks().length,
          videoTracks: stream.getVideoTracks().length,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Attendre que la vidéo soit prête avant de jouer
          const playPromise = videoRef.current.play();

          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                logger.info('Video stream playing successfully', { facingMode: mode });
                setHasPermission(true);
              })
              .catch( playError => {
                logger.warn('Video play error', { error: playError, facingMode: mode });
                // Essayer de jouer quand les métadonnées sont chargées
                videoRef.current!.onloadedmetadata = () => {
                  videoRef.current
                    ?.play()
                    .then(() => {
                      logger.info('Video stream playing after loadedmetadata', {
                        facingMode: mode,
                      });
                      setHasPermission(true);
                    })
                    .catch( err => {
                      logger.error('Error playing video stream after loadedmetadata', {
                        error: err,
                      });
                      setError('Impossible de démarrer le flux vidéo');
                    });
                };
              });
          } else {
            // Fallback si play() ne retourne pas de Promise
            setHasPermission(true);
          }
        } else {
          logger.warn('videoRef.current is null, cannot attach stream');
          // Ne pas définir d'erreur ici, le useEffect va réessayer
          // setError('Référence vidéo non disponible');
        }
      } catch ( _err: unknown) {
        logger.error('Error accessing camera', { error: err, facingMode: mode });

        let  errorMessage= "Impossible d'accéder à la caméra";

        const error = err as Error;
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          // Vérifier si c'est une violation de Permissions-Policy
          const errorMessageLower = error.message?.toLowerCase() || '';
          if (
            errorMessageLower.includes('permissions policy') ||
            errorMessageLower.includes('policy violation')
          ) {
            errorMessage =
              "L'accès à la caméra est bloqué par la politique de sécurité du site. Veuillez contacter l'administrateur.";
          } else {
            errorMessage =
              "Permission d'accès à la caméra refusée. Veuillez autoriser l'accès dans les paramètres de votre navigateur.";
          }
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage = 'Aucune caméra trouvée sur cet appareil.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage = 'La caméra est déjà utilisée par une autre application.';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'Les contraintes de la caméra ne peuvent pas être satisfaites.';
        } else if (
          error.message?.includes('Permissions policy') ||
          error.message?.includes('policy violation')
        ) {
          errorMessage =
            "L'accès à la caméra est bloqué par la politique de sécurité. Veuillez contacter l'administrateur.";
        }

        setError(errorMessage);
        setHasPermission(false);
        toast({
          title: 'Erreur caméra',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // Arrêter le flux vidéo
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Basculer entre caméras
  const toggleCamera = useCallback(async () => {
    const  newMode: FacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    await startStream(newMode);
  }, [facingMode, startStream]);

  // Capturer la photo
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Définir la taille du canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Dessiner l'image sur le canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Impossible d'obtenir le contexte du canvas");
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convertir en blob puis en File
      canvas.toBlob(
        blob => {
          if (!blob) {
            throw new Error("Impossible de créer l'image");
          }

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const fileName = `photo-${timestamp}.jpg`;
          const file = new File([blob], fileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          onCapture(file);

          toast({
            title: 'Photo capturée',
            description: 'La photo a été ajoutée avec succès',
          });
        },
        'image/jpeg',
        0.92 // Qualité JPEG (92%)
      );
    } catch ( _err: unknown) {
      logger.error('Error capturing photo', { error: err });
      const error = err as Error;
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de capturer la photo',
        variant: 'destructive',
      });
    } finally {
      setIsCapturing(false);
    }
  }, [onCapture, toast]);

  // Initialiser le stream quand le dialog s'ouvre
  useEffect(() => {
    if (!open) {
      stopStream();
      setHasPermission(null);
      setError(null);
      return;
    }

    // Utiliser requestAnimationFrame pour s'assurer que le DOM est complètement rendu
    let  mounted= true;
    let  retryCount= 0;
    const maxRetries = 10; // Augmenter le nombre de tentatives

    const tryStartStream = () => {
      if (!mounted) return;

      if (videoRef.current) {
        logger.info('videoRef is ready, starting stream', { facingMode, retryCount });
        startStream(facingMode).catch( err => {
          if (mounted) {
            logger.error('Failed to start stream', { error: err });
          }
        });
      } else if (retryCount < maxRetries) {
        retryCount++;
        logger.warn(`videoRef not ready, retrying (${retryCount}/${maxRetries})...`);
        // Utiliser requestAnimationFrame pour attendre le prochain cycle de rendu
        requestAnimationFrame(() => {
          if (mounted) {
            setTimeout(tryStartStream, 50); // Réduire le délai entre les tentatives
          }
        });
      } else {
        logger.error('videoRef not available after max retries', {
          maxRetries,
          dialogOpen: open,
          videoElementExists: document.querySelector('video') !== null,
        });
        if (mounted) {
          setError("Impossible d'initialiser la caméra. Veuillez fermer et rouvrir le dialog.");
        }
      }
    };

    // Démarrer après un court délai pour laisser le dialog se monter complètement
    // Le Dialog de ShadCN UI peut prendre du temps à monter tous ses éléments
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(tryStartStream); // Double RAF pour s'assurer que le DOM est prêt
      });
    }, 300); // Augmenter légèrement le délai initial

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopStream();
    };
  }, [open, facingMode, startStream, stopStream]);

  // Nettoyer à la fermeture
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full sm:w-[95vw] p-0 h-full sm:h-auto max-h-[100vh] sm:max-h-[90vh] flex flex-col">
        <DialogHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
            Prendre une photo
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Utilisez votre caméra pour prendre une photo directement
          </DialogDescription>
        </DialogHeader>

        <div className="relative bg-black rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
          {/* Zone de vidéo - Agrandie sur mobile */}
          <div className="relative bg-black flex-1 min-h-[60vh] sm:aspect-video sm:min-h-0">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-2" />
                  <p className="text-white text-sm">Chargement de la caméra...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="text-center p-4">
                  <X className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-white text-sm mb-2">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startStream(facingMode)}
                    className="mt-2"
                  >
                    Réessayer
                  </Button>
                </div>
              </div>
            )}

            {/* Toujours rendre l'élément video pour que videoRef soit disponible */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover sm:object-contain"
              style={{
                display: hasPermission && streamRef.current ? 'block' : 'none',
                visibility: hasPermission && streamRef.current ? 'visible' : 'hidden',
              }}
            />

            {/* Canvas caché pour la capture */}
            <canvas ref={canvasRef} className="hidden" />

            {!error && !isLoading && !hasPermission && streamRef.current === null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="text-center p-4">
                  <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-white text-sm">En attente de la caméra...</p>
                </div>
              </div>
            )}
          </div>

          {/* Contrôles */}
          {!error && hasPermission && (
            <div className="absolute bottom-2 sm:bottom-4 left-0 right-0 flex justify-center gap-3 sm:gap-4 px-2 sm:px-4 z-20">
              {/* Bouton basculer caméra */}
              <Button
                variant="secondary"
                size="icon"
                onClick={toggleCamera}
                disabled={isLoading || isCapturing}
                className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 touch-manipulation min-h-[44px] min-w-[44px]"
                aria-label={
                  facingMode === 'user'
                    ? 'Basculer vers caméra arrière'
                    : 'Basculer vers caméra avant'
                }
              >
                <FlipHorizontal className="h-5 w-5 text-white" />
              </Button>

              {/* Bouton capturer */}
              <Button
                onClick={capturePhoto}
                disabled={isLoading || isCapturing || !hasPermission}
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-white hover:bg-white/90 shadow-lg touch-manipulation min-h-[56px] min-w-[56px] sm:min-h-[64px] sm:min-w-[64px]"
                aria-label={captureLabel}
              >
                {isCapturing ? (
                  <Loader2 className="h-6 w-6 animate-spin text-black" />
                ) : (
                  <Camera className="h-6 w-6 text-black" />
                )}
              </Button>

              {/* Bouton fermer */}
              <Button
                variant="secondary"
                size="icon"
                onClick={onClose}
                disabled={isLoading || isCapturing}
                className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 touch-manipulation min-h-[44px] min-w-[44px]"
                aria-label="Fermer"
              >
                <X className="h-5 w-5 text-white" />
              </Button>
            </div>
          )}
        </div>

        {/* Instructions - Réduites sur mobile */}
        <div className="px-3 sm:px-6 pb-3 sm:pb-6 flex-shrink-0">
          <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
            <p className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-medium">Astuce:</span>
              <span className="hidden sm:inline">
                Cliquez sur le bouton de bascule pour changer entre caméra avant et arrière
              </span>
              <span className="sm:hidden">Basculez entre caméras</span>
            </p>
            {facingMode === 'user' && <p className="text-xs">📷 Caméra avant activée</p>}
            {facingMode === 'environment' && <p className="text-xs">📷 Caméra arrière activée</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}






