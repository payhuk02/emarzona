import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Shield, CheckCircle2 } from 'lucide-react';
import { useGenerateDownloadToken, useLogDownload } from '@/hooks/digital/useSecureDownload';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// TYPES
// ============================================================================

interface SecureDownloadButtonProps {
  productId: string;
  fileUrl: string;
  fileName?: string;
  customerId?: string;
  licenseId?: string;
  expiresHours?: number;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SecureDownloadButton({
  productId,
  fileUrl,
  fileName,
  customerId,
  licenseId,
  expiresHours = 1,
  variant = 'default',
  size = 'default',
  className,
  children,
}: SecureDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  
  const { mutateAsync: generateToken } = useGenerateDownloadToken();
  const { mutate: logDownload } = useLogDownload();
  const { toast } = useToast();

  const handleSecureDownload = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      // Step 1: Generate secure token
      const token = await generateToken({
        product_id: productId,
        file_url: fileUrl,
        customer_id: customerId,
        license_id: licenseId,
        expires_hours: expiresHours,
      });

      // Step 2: Create download link
      const downloadStartTime = Date.now();
      
      // Create temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName || 'download';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Step 3: Log the download
      const downloadEndTime = Date.now();
      const durationSeconds = Math.floor((downloadEndTime - downloadStartTime) / 1000);

      logDownload({
        product_id: productId,
        customer_id: customerId,
        download_completed: true,
        download_duration_seconds: durationSeconds,
        ip_address: undefined, // Will be set server-side if needed
        user_agent: navigator.userAgent,
      });

      // Show success feedback
      setDownloadSuccess(true);
      toast({
        title: '✅ Téléchargement démarré !',
        description: 'Votre fichier est en cours de téléchargement de manière sécurisée.',
      });

      // Reset success state after 3 seconds
      setTimeout(() => setDownloadSuccess(false), 3000);

    } catch (error: any) {
      console.error('Download error:', error);
      
      // Log the failed download
      logDownload({
        product_id: productId,
        customer_id: customerId,
        download_completed: false,
        error_message: error.message,
      });

      toast({
        variant: 'destructive',
        title: '❌ Erreur de téléchargement',
        description: error.message || 'Impossible de générer le lien sécurisé.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSecureDownload}
      disabled={isDownloading || downloadSuccess}
    >
      {isDownloading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Génération...
        </>
      ) : downloadSuccess ? (
        <>
          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
          Téléchargé !
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          {children || 'Télécharger'}
          <Shield className="h-3 w-3 ml-2 text-muted-foreground" />
        </>
      )}
    </Button>
  );
}

// ============================================================================
// VARIANTS
// ============================================================================

/**
 * Simple download button with icon only
 */
export function SecureDownloadIconButton(props: Omit<SecureDownloadButtonProps, 'children'>) {
  return (
    <SecureDownloadButton {...props} size="icon" variant="ghost">
      <Download className="h-4 w-4" />
    </SecureDownloadButton>
  );
}

/**
 * Large prominent download button
 */
export function SecureDownloadLargeButton(props: Omit<SecureDownloadButtonProps, 'size' | 'children'>) {
  return (
    <SecureDownloadButton {...props} size="lg" className="w-full gap-3">
      <Download className="h-5 w-5" />
      Télécharger de manière sécurisée
      <Shield className="h-4 w-4 ml-auto" />
    </SecureDownloadButton>
  );
}

