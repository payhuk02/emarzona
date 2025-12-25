/**
 * Digital Download Button - Professional
 * Date: 27 octobre 2025
 *
 * Bouton de téléchargement sécurisé avec suivi
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, CheckCircle2, AlertCircle, Loader2, Clock, Lock, RefreshCw } from 'lucide-react';
import { useGenerateDownloadLink, useTrackDownload } from '@/hooks/digital/useDownloads';
import { useRemainingDownloads } from '@/hooks/digital/useDigitalProducts';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

interface DigitalDownloadButtonProps {
  digitalProductId: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  licenseKey?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showRemainingDownloads?: boolean;
}

export const DigitalDownloadButton = ({
  digitalProductId,
  fileId,
  fileName,
  fileSize,
  licenseKey,
  variant = 'default',
  size = 'default',
  className,
  showRemainingDownloads = true,
}: DigitalDownloadButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const { toast } = useToast();
  const generateLink = useGenerateDownloadLink();
  const trackDownload = useTrackDownload();
  const { data: remainingData } = useRemainingDownloads(digitalProductId);

  /**
   * Format file size
   */
  const formatSize = (mb: number) => {
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  /**
   * Handle download with retry logic
   */
  const handleDownload = async (retryAttempt: number = 0) => {
    setError(null);
    setIsDownloading(true);
    setShowDialog(true);
    setDownloadProgress(0);
    setRetryCount(retryAttempt);

    try {
      // Check remaining downloads
      if (remainingData && !remainingData.unlimited && remainingData.remaining === 0) {
        throw new Error('Limite de téléchargements atteinte');
      }

      // Generate secure download link (hook already has retry logic)
      setDownloadProgress(10);
      const result = await generateLink.mutateAsync({
        fileId,
        expiresIn: 3600, // 1 hour
      });

      setDownloadProgress(30);

      // Track download start
      try {
        await trackDownload.mutateAsync({
          digitalProductId,
          fileId,
          licenseKey,
        });
        setDownloadProgress(50);
      } catch (trackError: unknown) {
        // Ne pas bloquer le téléchargement si le tracking échoue
        logger.warn('Download tracking failed', { error: trackError });
        setDownloadProgress(50);
      }

      // Start actual download with error handling
      try {
        const link = document.createElement('a');
        link.href = result.url;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();

        // Cleanup after a short delay
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);

        setDownloadProgress(100);

        // Success notification
        toast({
          title: 'Téléchargement démarré',
          description: `${fileName} est en cours de téléchargement`,
        });

        // Success
        setTimeout(() => {
          setIsDownloading(false);
          setTimeout(() => setShowDialog(false), 1500);
        }, 500);
      } catch (downloadError: unknown) {
        logger.error('Error starting download', { error: downloadError });
        throw new Error('Erreur lors du démarrage du téléchargement. Veuillez réessayer.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Download error', {
        error: errorMessage,
        fileId,
        fileName,
        retryAttempt,
      });

      setError(errorMessage);
      setIsDownloading(false);

      // Show error toast
      toast({
        title: 'Erreur de téléchargement',
        description: errorMessage,
        variant: 'destructive',
      });

      // Auto-retry for network errors (max 2 retries)
      if (
        retryAttempt < 2 &&
        (errorMessage.includes('réseau') ||
          errorMessage.includes('network') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('fetch'))
      ) {
        setIsRetrying(true);
        setTimeout(
          () => {
            setIsRetrying(false);
            handleDownload(retryAttempt + 1);
          },
          2000 * (retryAttempt + 1)
        ); // Exponential backoff: 2s, 4s
      }
    }
  };

  /**
   * Check if can download
   */
  const canDownload = !remainingData || remainingData.unlimited || remainingData.remaining > 0;

  return (
    <>
      <div className="space-y-2">
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => handleDownload(0)}
          disabled={isDownloading || !canDownload || isRetrying}
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Téléchargement...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </>
          )}
        </Button>

        {/* Remaining downloads indicator */}
        {showRemainingDownloads && remainingData && !remainingData.unlimited && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {remainingData.remaining} / {remainingData.limit} téléchargements restants
            </span>
          </div>
        )}

        {/* No downloads left */}
        {!canDownload && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Limite de téléchargements atteinte. Contactez le support pour plus d'informations.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Download Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isDownloading
                ? 'Téléchargement en cours...'
                : error
                  ? 'Erreur'
                  : 'Téléchargement terminé'}
            </DialogTitle>
            <DialogDescription>
              {fileName} ({formatSize(fileSize)})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isDownloading && (
              <>
                <Progress value={downloadProgress} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">
                  {downloadProgress < 50
                    ? 'Génération du lien sécurisé...'
                    : downloadProgress < 100
                      ? 'Téléchargement du fichier...'
                      : 'Finalisation...'}
                </p>
              </>
            )}

            {error && (
              <div className="space-y-3">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                {isRetrying && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Tentative de nouvelle connexion... ({retryCount + 1}/3)</span>
                  </div>
                )}
                {!isRetrying && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(0)}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                )}
              </div>
            )}

            {!isDownloading && !error && downloadProgress === 100 && (
              <div className="text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                <p className="text-sm font-medium">Téléchargement démarré !</p>
                <p className="text-xs text-muted-foreground">
                  Si le téléchargement ne démarre pas automatiquement, vérifiez les téléchargements
                  de votre navigateur.
                </p>
              </div>
            )}

            {/* Security notice */}
            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Lien sécurisé</p>
                <p>Ce lien expire dans 1 heure et est unique à votre compte.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * Compact version for inline usage
 */
export const DigitalDownloadButtonCompact = ({
  digitalProductId,
  fileId,
  fileName,
}: {
  digitalProductId: string;
  fileId: string;
  fileName: string;
}) => {
  const generateLink = useGenerateDownloadLink();
  const trackDownload = useTrackDownload();

  const handleQuickDownload = async () => {
    try {
      // Generate link
      const result = await generateLink.mutateAsync({ fileId });

      // Track
      await trackDownload.mutateAsync({
        digitalProductId,
        fileId,
      });

      // Download
      window.open(result.url, '_blank');
    } catch (error) {
      logger.error('Quick download error', { error, productId: digitalProductId });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleQuickDownload}
      disabled={generateLink.isPending}
    >
      {generateLink.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  );
};
