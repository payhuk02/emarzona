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

        // Recherche insensible à la casse - vérifier tous les liens actifs
        const { data: allLinks, error: linksError } = await supabase
          .from('affiliate_short_links')
          .select('id, short_code, target_url, is_active, expires_at, total_clicks')
          .eq('is_active', true);

        if (linksError) {
          logger.error('Error fetching links:', linksError);
          setError('Erreur lors de la recherche du lien');
          setLoading(false);
          return;
        }

        // Trouver le lien correspondant (insensible à la casse)
        const matchingLink = allLinks?.find(link =>
          link.short_code.toLowerCase() === code.toLowerCase()
        );

        if (!matchingLink) {
          setError('Lien court introuvable ou expiré');
          setLoading(false);
          return;
        }

        // Vérifier l'expiration
        if (matchingLink.expires_at && new Date(matchingLink.expires_at) < new Date()) {
          setError('Ce lien court a expiré');
          setLoading(false);
          return;
        }

        // Mettre à jour les statistiques
        await supabase
          .from('affiliate_short_links')
          .update({
            total_clicks: matchingLink.total_clicks + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('id', matchingLink.id);

        // Rediriger vers l'URL cible
        window.location.href = matchingLink.target_url;
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







