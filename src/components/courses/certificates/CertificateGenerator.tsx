/**
 * Générateur de certificat avec téléchargement
 * Date : 27 octobre 2025
 * Phase : 6 - Quiz et Certificats
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Award, 
  CheckCircle2,
  Loader2,
  Eye
} from 'lucide-react';
import { CertificateTemplate } from './CertificateTemplate';
import { useCertificate, useCreateCertificate, useCanGetCertificate } from '@/hooks/courses/useCertificates';
import { useAuth } from '@/contexts/AuthContext';

interface CertificateGeneratorProps {
  enrollmentId: string;
  courseId: string;
  courseName: string;
  instructorName?: string;
}

export const CertificateGenerator = ({
  enrollmentId,
  courseId,
  courseName,
  instructorName,
}: CertificateGeneratorProps) => {
  const { user } = useAuth();
  const { data: certificate, isLoading } = useCertificate(enrollmentId);
  const { data: canGetCertificate } = useCanGetCertificate(enrollmentId);
  const createCertificate = useCreateCertificate();
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = () => {
    createCertificate.mutate({
      enrollmentId,
      courseId,
    });
  };

  const handleDownload = () => {
    // Utiliser window.print() avec une feuille de style spéciale pour l'impression
    window.print();
  };

  const handlePreview = () => {
    setShowPreview(!showPreview);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si le certificat n'existe pas encore
  if (!certificate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-6 h-6 text-orange-600" />
            Certificat de Réussite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canGetCertificate ? (
            <>
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Félicitations ! Vous avez complété ce cours. Vous pouvez maintenant générer votre certificat.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleGenerate}
                disabled={createCertificate.isPending}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {createCertificate.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4 mr-2" />
                    Générer mon certificat
                  </>
                )}
              </Button>
            </>
          ) : (
            <Alert>
              <AlertDescription>
                Complétez toutes les leçons du cours pour obtenir votre certificat.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // Si le certificat existe
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-6 h-6 text-green-600" />
            Votre Certificat
            <Badge className="ml-auto bg-green-600">Obtenu</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Numéro :</p>
              <p className="font-mono font-semibold">{certificate.certificate_number}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date d'émission :</p>
              <p className="font-semibold">
                {new Date(certificate.issued_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handlePreview} variant="outline" className="flex-1">
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Masquer' : 'Prévisualiser'}
            </Button>
            <Button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Télécharger (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prévisualisation du certificat */}
      {showPreview && (
        <div className="print:block">
          <CertificateTemplate
            studentName={user?.user_metadata?.full_name || user?.email || 'Étudiant'}
            courseName={courseName}
            completionDate={certificate.issued_at}
            certificateNumber={certificate.certificate_number}
            instructorName={instructorName}
          />
        </div>
      )}

      {/* Version cachée pour l'impression */}
      <div className="hidden print:block">
        <CertificateTemplate
          studentName={user?.user_metadata?.full_name || user?.email || 'Étudiant'}
          courseName={courseName}
          completionDate={certificate.issued_at}
          certificateNumber={certificate.certificate_number}
          instructorName={instructorName}
        />
      </div>

      {/* CSS pour l'impression */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #certificate, #certificate * {
            visibility: visible;
          }
          #certificate {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

