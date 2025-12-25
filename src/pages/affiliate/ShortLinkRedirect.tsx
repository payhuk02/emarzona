/**
 * Page: ShortLinkRedirect
 * Description: Redirige les liens courts d'affiliation vers le lien complet
 * Date: 31/01/2025
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/logger';

export const ShortLinkRedirect = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectToTarget = async () => {
      if (!code) {
        setError('Code de lien court manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Appeler la fonction RPC pour tracker le clic et obtenir l'URL cible
        const { data, error: rpcError } = await supabase.rpc('track_short_link_click', {
          p_short_code: code.toUpperCase(),
        });

        if (rpcError) {
          logger.error('Error tracking short link click:', rpcError);
          
          // Si la fonction RPC n'existe pas, essayer une requête directe
          const { data: shortLinkData, error: queryError } = await supabase
            .from('affiliate_short_links')
            .select('target_url, is_active, expires_at')
            .eq('short_code', code.toUpperCase())
            .single();

          if (queryError || !shortLinkData) {
            setError('Lien court introuvable ou expiré');
            setLoading(false);
            return;
          }

          if (!shortLinkData.is_active) {
            setError('Ce lien court a été désactivé');
            setLoading(false);
            return;
          }

          if (shortLinkData.expires_at && new Date(shortLinkData.expires_at) < new Date()) {
            setError('Ce lien court a expiré');
            setLoading(false);
            return;
          }

          // Mettre à jour les statistiques manuellement
          const { data: currentLink } = await supabase
            .from('affiliate_short_links')
            .select('total_clicks')
            .eq('short_code', code.toUpperCase())
            .single();

          await supabase
            .from('affiliate_short_links')
            .update({
              total_clicks: (currentLink?.total_clicks || 0) + 1,
              last_used_at: new Date().toISOString(),
            })
            .eq('short_code', code.toUpperCase());

          // Rediriger vers l'URL cible
          window.location.href = shortLinkData.target_url;
          return;
        }

        // Si la fonction RPC a fonctionné
        if (data && data.success && data.target_url) {
          // Rediriger vers l'URL cible
          window.location.href = data.target_url;
        } else {
          setError(data?.error || 'Lien court introuvable ou expiré');
          setLoading(false);
        }
      } catch (err: unknown) {
        logger.error('Error in short link redirect:', err);
        setError('Une erreur est survenue lors de la redirection');
        setLoading(false);
      }
    };

    redirectToTarget();
  }, [code, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-sm text-muted-foreground">Redirection en cours...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur de redirection</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4">
              <button
                onClick={() => navigate('/')}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Retour à l'accueil
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

