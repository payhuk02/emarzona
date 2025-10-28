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
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Lock,
} from 'lucide-react';
import { useGenerateDownloadLink, useTrackDownload } from '@/hooks/digital/useDownloads';
import { useRemainingDownloads } from '@/hooks/digital/useDigitalProducts';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
   * Handle download
   */
  const handleDownload = async () => {
    setError(null);
    setIsDownloading(true);
    setShowDialog(true);
    setDownloadProgress(0);

    try {
      // Check remaining downloads
      if (remainingData && !remainingData.unlimited && remainingData.remaining === 0) {
        throw new Error('Limite de téléchargements atteinte');
      }

      // Generate secure download link
      const result = await generateLink.mutateAsync({ 
        fileId,
        expiresIn: 3600, // 1 hour
      });

      // Simulate progress (in real app, use proper download with progress)
      setDownloadProgress(25);

      // Track download start
      const tracking = await trackDownload.mutateAsync({
        digitalProductId,
        fileId,
        licenseKey,
      });

      setDownloadProgress(50);

      // Start actual download
      const link = document.createElement('a');
      link.href = result.url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadProgress(100);

      // Success
      setTimeout(() => {
        setIsDownloading(false);
        setTimeout(() => setShowDialog(false), 1500);
      }, 500);

    } catch (err: any) {
      console.error('Download error:', err);
      setError(err.message || 'Erreur lors du téléchargement');
      setIsDownloading(false);
    }
  };

  /**
   * Check if can download
   */
  const canDownload = !remainingData || 
                      remainingData.unlimited || 
                      remainingData.remaining > 0;

  return (
    <>
      <div className="space-y-2">
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={handleDownload}
          disabled={isDownloading || !canDownload}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isDownloading ? 'Téléchargement en cours...' : error ? 'Erreur' : 'Téléchargement terminé'}
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
                  {downloadProgress < 50 ? 'Génération du lien sécurisé...' :
                   downloadProgress < 100 ? 'Téléchargement du fichier...' :
                   'Finalisation...'}
                </p>
              </>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!isDownloading && !error && downloadProgress === 100 && (
              <div className="text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                <p className="text-sm font-medium">Téléchargement démarré !</p>
                <p className="text-xs text-muted-foreground">
                  Si le téléchargement ne démarre pas automatiquement, 
                  vérifiez les téléchargements de votre navigateur.
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
      console.error('Quick download error:', error);
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


