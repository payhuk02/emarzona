/**
 * Public download redemption page — /download/:token
 * Consumes token server-side (Edge Function) then triggers file download.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { redeemDownloadToken } from '@/lib/digital/redeem-download';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';

type RedeemState = 'loading' | 'success' | 'error';

export default function SecureDownloadPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<RedeemState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('download');
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMessage('Lien de téléchargement invalide.');
      return;
    }

    let cancelled = false;

    const redeem = async () => {
      const result = await redeemDownloadToken(token);

      if (cancelled) return;

      if (!result.ok) {
        setState('error');
        setErrorMessage(result.error.error);
        return;
      }

      const { signedUrl, fileName: resolvedName } = result.data;
      setFileUrl(signedUrl);
      setFileName(resolvedName);

      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = resolvedName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setState('success');
    };

    void redeem().catch(err => {
      if (cancelled) return;
      setState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Erreur de téléchargement');
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {state === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {state === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {state === 'error' && <AlertTriangle className="h-5 w-5 text-destructive" />}
            Téléchargement sécurisé
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === 'loading' && (
            <p className="text-muted-foreground text-sm">
              Vérification du lien et préparation du fichier…
            </p>
          )}
          {state === 'success' && (
            <>
              <p className="text-sm">
                Votre téléchargement <strong>{fileName}</strong> a démarré. Si rien ne se lance,
                utilisez le bouton ci-dessous.
              </p>
              {fileUrl && (
                <Button asChild variant="outline" className="w-full">
                  <a href={fileUrl} download={fileName} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Relancer le téléchargement
                  </a>
                </Button>
              )}
            </>
          )}
          {state === 'error' && <p className="text-sm text-destructive">{errorMessage}</p>}
          <Button asChild variant="ghost" className="w-full">
            <Link to="/account/downloads">Mes téléchargements</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
