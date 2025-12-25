/**
 * Artist Certificate Display Component
 * Date: 28 Janvier 2025
 * 
 * Composant pour afficher le certificat d'authenticité sur la page de détail produit
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  FileText, 
  Download,
  Eye,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface ArtistCertificateDisplayProps {
  certificateUrl?: string | null;
  certificateOfAuthenticity?: boolean;
  signatureAuthenticated?: boolean;
  signatureLocation?: string | null;
  editionType?: string | null;
  editionNumber?: number | null;
  totalEditions?: number | null;
}

const ArtistCertificateDisplayComponent = ({
  certificateUrl,
  certificateOfAuthenticity,
  signatureAuthenticated,
  signatureLocation,
  editionType,
  editionNumber,
  totalEditions,
}: ArtistCertificateDisplayProps) => {
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!certificateUrl) return;

    try {
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

  // Ne rien afficher si aucun certificat et pas d'authentification
  if (!certificateOfAuthenticity && !signatureAuthenticated && !certificateUrl) {
    return null;
  }

  return (
    <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
          Authenticité & Certification
        </CardTitle>
        <CardDescription>
          Informations sur l'authenticité de cette œuvre
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Certificat d'authenticité */}
        {certificateOfAuthenticity && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-medium">Certificat d'authenticité disponible</span>
            </div>

            {certificateUrl ? (
              <div className="space-y-3">
                {/* Aperçu si image */}
                {isImage && (
                  <div className="relative border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                    <img
                      src={certificateUrl}
                      alt="Certificat d'authenticité"
                      className="w-full h-auto max-h-64 object-contain"
                    />
                  </div>
                )}

                {/* Informations du fichier */}
                <div className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">Certificat d'authenticité</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {certificateUrl.split('/').pop()}
                      </p>
                    </div>
                    {isPDF && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        PDF
                      </Badge>
                    )}
                    {isImage && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        Image
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
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
                </div>
              </div>
            ) : (
              <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                  Certificat d'authenticité déclaré mais fichier non disponible.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Signature authentifiée */}
        {signatureAuthenticated && (
          <div className="space-y-2 pt-3 border-t">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium">Signature authentifiée</span>
            </div>
            {signatureLocation && (
              <p className="text-sm text-muted-foreground ml-7">
                Emplacement : {signatureLocation}
              </p>
            )}
          </div>
        )}

        {/* Informations d'édition */}
        {editionType && (editionType === 'limited_edition' || editionType === 'print') && (
          <div className="space-y-2 pt-3 border-t">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span className="font-medium">Édition limitée</span>
            </div>
            {editionNumber && totalEditions && (
              <p className="text-sm text-muted-foreground ml-7">
                Édition {editionNumber} sur {totalEditions}
              </p>
            )}
          </div>
        )}

        {/* Message de confiance */}
        <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-900 dark:text-green-100">
            Cette œuvre est certifiée authentique. Les certificats et signatures authentifiées 
            garantissent l'authenticité et augmentent la valeur de l'œuvre.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export const ArtistCertificateDisplay = React.memo(ArtistCertificateDisplayComponent);
