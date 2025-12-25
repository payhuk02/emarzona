/**
 * Certificate Uploader Component for Artist Products
 * Date: 28 Janvier 2025
 * 
 * Composant dédié pour uploader et gérer les certificats d'authenticité
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Upload, 
  FileText, 
  X, 
  CheckCircle2, 
  Info, 
  Download,
  Eye,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadToSupabaseStorage } from '@/utils/uploadToSupabase';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface CertificateUploaderProps {
  certificateUrl?: string | null;
  onCertificateChange: (url: string | null) => void;
  productId?: string;
  readOnly?: boolean;
}

export const CertificateUploader = ({
  certificateUrl,
  onCertificateChange,
  productId,
  readOnly = false,
}: CertificateUploaderProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du type de fichier
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const isValidType = allowedTypes.includes(file.type);
    const isValidExt = fileExt && allowedExtensions.includes(fileExt);

    if (!isValidType || !isValidExt) {
      toast({
        title: '❌ Format non supporté',
        description: 'Veuillez uploader un fichier PDF ou une image (JPG, PNG)',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    // Validation de la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: '❌ Fichier trop volumineux',
        description: 'La taille maximale est de 10MB. Veuillez compresser votre fichier.',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simuler la progression (pour UX)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const { url, error } = await uploadToSupabaseStorage(file, {
        bucket: 'product-files',
        path: 'certificates',
        filePrefix: productId ? `certificate-${productId}` : 'certificate',
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      if (url) {
        onCertificateChange(url);
        
        // Si c'est une image, créer une URL de prévisualisation
        if (file.type.startsWith('image/')) {
          setPreviewUrl(url);
        }

        toast({
          title: '✅ Certificat uploadé',
          description: 'Le certificat d\'authenticité a été uploadé avec succès',
        });

        logger.info('Certificat uploadé avec succès', {
          productId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        });
      }
    } catch (error) {
      logger.error('Erreur upload certificat', {
        error: error instanceof Error ? error.message : String(error),
        productId,
      });
      
      toast({
        title: '❌ Erreur d\'upload',
        description: error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'upload',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleRemove = () => {
    onCertificateChange(null);
    setPreviewUrl(null);
    toast({
      title: 'Certificat supprimé',
      description: 'Le certificat a été retiré',
    });
  };

  const handleDownload = async () => {
    if (!certificateUrl) return;

    try {
      // Télécharger le fichier depuis Supabase Storage
      const fileName = certificateUrl.split('/').pop() || 'certificate';
      const response = await fetch(certificateUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: '✅ Téléchargement démarré',
        description: 'Le certificat est en cours de téléchargement',
      });
    } catch (error) {
      logger.error('Erreur téléchargement certificat', { error, certificateUrl });
      toast({
        title: '❌ Erreur',
        description: 'Impossible de télécharger le certificat',
        variant: 'destructive',
      });
    }
  };

  const handlePreview = () => {
    if (!certificateUrl) return;
    window.open(certificateUrl, '_blank');
  };

  const isImage = certificateUrl && (
    certificateUrl.endsWith('.jpg') ||
    certificateUrl.endsWith('.jpeg') ||
    certificateUrl.endsWith('.png') ||
    certificateUrl.includes('image')
  );

  const isPDF = certificateUrl && (
    certificateUrl.endsWith('.pdf') ||
    certificateUrl.includes('application/pdf')
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              Certificat d'authenticité
            </CardTitle>
            <CardDescription>
              Uploader un certificat d'authenticité pour cette œuvre
            </CardDescription>
          </div>
          {certificateUrl && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Certificat présent
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {certificateUrl ? (
          <div className="space-y-4">
            {/* Aperçu du certificat */}
            {isImage && (
              <div className="relative border rounded-lg overflow-hidden bg-muted/30">
                <img
                  src={certificateUrl}
                  alt="Certificat d'authenticité"
                  className="w-full h-auto max-h-96 object-contain"
                  onError={() => setPreviewUrl(null)}
                />
              </div>
            )}

            {/* Informations du certificat */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3 flex-1">
                <FileText className="h-8 w-8 text-green-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">Certificat uploadé</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {certificateUrl.split('/').pop()}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {isPDF && (
                      <Badge variant="outline" className="text-xs">
                        PDF
                      </Badge>
                    )}
                    {isImage && (
                      <Badge variant="outline" className="text-xs">
                        Image
                      </Badge>
                    )}
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              </div>
            </div>

            {/* Actions */}
            {!readOnly && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Aperçu
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="text-destructive hover:text-destructive"
                  aria-label="Supprimer le certificat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {readOnly && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir le certificat
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {!readOnly && (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors relative">
                {uploading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Upload en cours... {uploadProgress}%
                    </span>
                    {uploadProgress > 0 && (
                      <div className="w-48 h-1 bg-muted rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground text-center px-4">
                      Cliquez pour uploader un certificat
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      PDF, JPG, PNG (max 10MB)
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/jpg"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}

            {readOnly && (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun certificat d'authenticité disponible</p>
              </div>
            )}
          </>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Le certificat d'authenticité sera visible par les acheteurs sur la page produit. 
            Il renforce la confiance et la valeur de l'œuvre.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

