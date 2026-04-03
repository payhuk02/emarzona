/**
 * Générateur de Certificat d'Authenticité pour Produits Artistes
 * Date: 28 Janvier 2025
 * 
 * Composant pour générer, afficher et télécharger les certificats d'authenticité
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Shield, 
  CheckCircle2,
  Loader2,
  Eye,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useArtistCertificate, useUpdateCertificateDownload } from '@/hooks/artist/useArtistCertificates';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ArtistCertificateGeneratorProps {
  certificateId: string;
  orderId: string;
  productId: string;
  artistProductId: string;
}

export const ArtistCertificateGenerator = ({
  certificateId,
  orderId,
  productId,
  artistProductId,
}: ArtistCertificateGeneratorProps) => {
  const { toast } = useToast();
  const { data: certificate, isLoading } = useArtistCertificate(certificateId);
  const updateDownload = useUpdateCertificateDownload();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleDownload = async () => {
    if (!certificate?.certificate_pdf_url) {
      toast({
        title: 'Erreur',
        description: 'Le certificat PDF n\'est pas disponible.',
        variant: 'destructive',
      });
      return;
    }

    setIsDownloading(true);
    try {
      // Mettre à jour le compteur de téléchargements
      await updateDownload.mutateAsync(certificate.id);

      // Télécharger le PDF
      const link = document.createElement('a');
      link.href = certificate.certificate_pdf_url;
      link.download = `certificat-${certificate.certificate_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: '✅ Téléchargement réussi',
        description: 'Votre certificat a été téléchargé.',
      });
    } catch (error) {
      logger.error('Error downloading certificate', { error, certificateId });
      toast({
        title: '❌ Erreur',
        description: 'Une erreur est survenue lors du téléchargement.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyVerificationCode = () => {
    if (!certificate?.verification_code) return;

    navigator.clipboard.writeText(certificate.verification_code);
    toast({
      title: 'Code copié',
      description: 'Le code de vérification a été copié dans le presse-papiers.',
    });
  };

  const handleOpenPDF = () => {
    if (!certificate?.certificate_pdf_url) return;
    window.open(certificate.certificate_pdf_url, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!certificate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            Certificat d'Authenticité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Aucun certificat trouvé pour cette commande.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-600" />
              Certificat d'Authenticité
              {certificate.is_generated && (
                <Badge className="ml-2 bg-green-600">Généré</Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informations du certificat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Numéro de certificat:</p>
              <p className="font-mono font-semibold">{certificate.certificate_number}</p>
            </div>
            {certificate.verification_code && (
              <div>
                <p className="text-muted-foreground">Code de vérification:</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-semibold">{certificate.verification_code}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyVerificationCode}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Type:</p>
              <p className="font-semibold capitalize">
                {certificate.certificate_type === 'authenticity' && 'Authenticité'}
                {certificate.certificate_type === 'limited_edition' && 'Édition Limitée'}
                {certificate.certificate_type === 'handmade' && 'Fait Main'}
              </p>
            </div>
            {certificate.generated_at && (
              <div>
                <p className="text-muted-foreground">Date de génération:</p>
                <p className="font-semibold">
                  {format(new Date(certificate.generated_at), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            )}
            {certificate.edition_number && certificate.total_edition && (
              <div>
                <p className="text-muted-foreground">Édition:</p>
                <p className="font-semibold">
                  {certificate.edition_number} / {certificate.total_edition}
                </p>
              </div>
            )}
            {certificate.signed_by_artist && (
              <div>
                <p className="text-muted-foreground">Signature:</p>
                <p className="font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Signé par l'artiste
                </p>
              </div>
            )}
          </div>

          {/* Informations œuvre */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Informations sur l'œuvre</h4>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Titre:</span> {certificate.artwork_title}</p>
              <p><span className="text-muted-foreground">Artiste:</span> {certificate.artist_name}</p>
              {certificate.artwork_medium && (
                <p><span className="text-muted-foreground">Médium:</span> {certificate.artwork_medium}</p>
              )}
              {certificate.artwork_year && (
                <p><span className="text-muted-foreground">Année:</span> {certificate.artwork_year}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button
              onClick={handleOpenPDF}
              variant="outline"
              className="flex-1"
              disabled={!certificate.certificate_pdf_url}
            >
              <Eye className="w-4 h-4 mr-2" />
              Prévisualiser
            </Button>
            <Button
              onClick={handleDownload}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={!certificate.certificate_pdf_url || isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Téléchargement...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger PDF
                </>
              )}
            </Button>
          </div>

          {/* Statistiques */}
          {certificate.download_count > 0 && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Téléchargé {certificate.download_count} fois
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerte si certificat révoqué */}
      {certificate.revoked && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ce certificat a été révoqué le {certificate.revoked_at && format(new Date(certificate.revoked_at), 'dd MMMM yyyy', { locale: fr })}.
            {certificate.revoked_reason && ` Raison: ${certificate.revoked_reason}`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};







