/**
 * Vérification publique d'un certificat d'authenticité œuvre d'artiste
 */

import { useParams, Link } from 'react-router-dom';
import { useVerifyCertificate } from '@/hooks/artist/useArtistCertificates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldCheck, ShieldX, ArrowLeft, FileCheck } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SEOMeta } from '@/components/seo';

export default function VerifyCertificatePage() {
  const { code } = useParams<{ code: string }>();
  const normalizedCode = code?.trim().toUpperCase() ?? '';

  const { data, isLoading, isError } = useVerifyCertificate(normalizedCode || undefined);

  const isValid = data?.valid === true;

  return (
    <div className="min-h-screen bg-background">
      <SEOMeta
        title="Vérification de certificat | Emarzona"
        description="Vérifiez l'authenticité d'un certificat d'œuvre d'artiste Emarzona."
      />
      <div className="container mx-auto max-w-lg px-4 py-10 sm:py-16">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link to="/marketplace">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la marketplace
          </Link>
        </Button>

        <div className="mb-8 text-center">
          <FileCheck className="mx-auto h-12 w-12 text-pink-500 mb-3" />
          <h1 className="text-2xl font-bold tracking-tight">Vérification de certificat</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Code saisi :{' '}
            <span className="font-mono font-medium text-foreground">{normalizedCode || '—'}</span>
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <Alert variant="destructive">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              Impossible de contacter le service de vérification. Réessayez plus tard.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !isError && data && (
          <>
            {isValid ? (
              <Card className="border-green-200 dark:border-green-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-green-600" />
                    <CardTitle className="text-green-700 dark:text-green-400">
                      Certificat authentique
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Ce certificat est enregistré sur la plateforme Emarzona.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{data.certificate_number}</Badge>
                    {data.certificate_type && (
                      <Badge variant="outline">{data.certificate_type}</Badge>
                    )}
                  </div>
                  <dl className="grid gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Œuvre</dt>
                      <dd className="font-medium">{data.artwork_title}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Artiste</dt>
                      <dd className="font-medium">{data.artist_name}</dd>
                    </div>
                    {data.edition_number != null && data.total_edition != null && (
                      <div>
                        <dt className="text-muted-foreground">Édition</dt>
                        <dd className="font-medium">
                          {data.edition_number} / {data.total_edition}
                        </dd>
                      </div>
                    )}
                    {data.artwork_medium && (
                      <div>
                        <dt className="text-muted-foreground">Technique</dt>
                        <dd>{data.artwork_medium}</dd>
                      </div>
                    )}
                    {data.purchase_date && (
                      <div>
                        <dt className="text-muted-foreground">Date d&apos;émission</dt>
                        <dd>
                          {format(new Date(data.purchase_date), 'd MMMM yyyy', { locale: fr })}
                        </dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-destructive/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShieldX className="h-6 w-6 text-destructive" />
                    <CardTitle>Certificat non valide</CardTitle>
                  </div>
                  <CardDescription>
                    {data.reason === 'not_found' &&
                      'Aucun certificat ne correspond à ce code de vérification.'}
                    {data.reason === 'revoked' &&
                      'Ce certificat a été révoqué et ne peut plus être utilisé.'}
                    {data.reason === 'invalid_code' && 'Le code de vérification est incomplet.'}
                    {!data.reason && 'Vérification impossible pour ce code.'}
                  </CardDescription>
                </CardHeader>
                {data.certificate_number && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Référence : <span className="font-mono">{data.certificate_number}</span>
                    </p>
                    {data.revoked_reason && (
                      <p className="text-sm mt-2 text-destructive">{data.revoked_reason}</p>
                    )}
                  </CardContent>
                )}
              </Card>
            )}
          </>
        )}

        {!isLoading && !isError && !data && normalizedCode.length >= 8 && (
          <Card className="border-destructive/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldX className="h-6 w-6 text-destructive" />
                <CardTitle>Certificat non valide</CardTitle>
              </div>
              <CardDescription>
                Aucun certificat ne correspond à ce code de vérification.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
