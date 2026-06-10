/**
 * Public download redemption page — /download/:token
 * Consumes a secure token server-side then triggers the file download.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
      try {
        const { data, error } = await supabase.rpc('validate_download_token', {
          p_token: token,
        });

        if (cancelled) return;

        if (error) {
          setState('error');
          setErrorMessage(error.message);
          return;
        }

        const result = data as {
          valid?: boolean;
          error?: string;
          file_url?: string;
        };

        if (!result?.valid || !result.file_url) {
          setState('error');
          setErrorMessage(result?.error || 'Token invalide ou expiré.');
          return;
        }

        const url = result.file_url;
        setFileUrl(url);
        const nameFromUrl = url.split('/').pop()?.split('?')[0];
        if (nameFromUrl) setFileName(decodeURIComponent(nameFromUrl));

        const link = document.createElement('a');
        link.href = url;
        link.download = nameFromUrl || 'download';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setState('success');
      } catch (err) {
        if (cancelled) return;
        setState('error');
        setErrorMessage(err instanceof Error ? err.message : 'Erreur de téléchargement');
      }
    };

    void redeem();

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
