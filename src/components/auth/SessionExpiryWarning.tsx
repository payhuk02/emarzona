/**
 * Composant d'avertissement d'expiration de session
 * Affiche un avertissement quand le token JWT va expirer
 */

import { useEffect, useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { useAuthRefresh } from '@/hooks/useAuthRefresh';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

interface SessionExpiryWarningProps {
  showRefreshButton?: boolean;
  showSignOutButton?: boolean;
  warningThreshold?: number; // Minutes avant expiration pour afficher l'avertissement
  className?: string;
}

export const SessionExpiryWarning = ({
  showRefreshButton = true,
  showSignOutButton = true,
  warningThreshold = 10, // 10 minutes par défaut
  className = ''
}: SessionExpiryWarningProps) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const { refreshToken, isTokenExpiringSoon } = useAuthRefresh({
    refreshThreshold: warningThreshold,
  });
  const { signOut } = useAuth();

  // Vérifier régulièrement l'état du token
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await import('@/integrations/supabase/client').then(m => m.supabase.auth.getSession());

        if (!session?.expires_at) {
          setShowWarning(false);
          return;
        }

        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();

        // Convertir en minutes
        const minutesRemaining = Math.floor(timeUntilExpiry / (1000 * 60));

        setTimeRemaining(minutesRemaining);

        // Vérifier si la session est déjà expirée
        const isExpired = minutesRemaining <= 0;
        setIsSessionExpired(isExpired);

        // Afficher l'avertissement si moins de warningThreshold minutes restantes ou déjà expiré
        const shouldShowWarning = (minutesRemaining <= warningThreshold && minutesRemaining > 0) || isExpired;
        setShowWarning(shouldShowWarning);

        // Log pour debug
        if (isExpired) {
          logger.error(`❌ Session déjà expirée (${minutesRemaining} minutes)`);
        } else if (shouldShowWarning) {
          logger.warn(`⚠️ Session expire dans ${minutesRemaining} minutes`);
        }

      } catch (error) {
        logger.error('Erreur vérification session:', error);
        setShowWarning(false);
      }
    };

    // Vérifier immédiatement
    checkSession();

    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkSession, 30 * 1000);

    return () => clearInterval(interval);
  }, [warningThreshold]);

  // Fonction pour rafraîchir manuellement
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const success = await refreshToken();
      if (success) {
        setShowWarning(false);
        logger.info('✅ Session rafraîchie manuellement');
      } else {
        logger.error('❌ Échec du rafraîchissement manuel');
      }
    } catch (error) {
      logger.error('Erreur rafraîchissement manuel:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshToken]);

  // Fonction pour se déconnecter
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      logger.info('👋 Déconnexion utilisateur suite avertissement session');
    } catch (error) {
      logger.error('Erreur déconnexion:', error);
    }
  }, [signOut]);

  // Ne rien afficher si pas d'avertissement
  if (!showWarning) {
    return null;
  }

  const getUrgencyColor = () => {
    if (isSessionExpired) return 'destructive';
    if (timeRemaining === null) return 'default';
    if (timeRemaining <= 2) return 'destructive';
    if (timeRemaining <= 5) return 'destructive';
    return 'secondary';
  };

  const getUrgencyMessage = () => {
    if (isSessionExpired) return 'Reconnexion en cours...';
    if (timeRemaining === null) return 'Expiration imminente';
    if (timeRemaining <= 1) return `Expire dans moins d'1 minute`;
    if (timeRemaining === 1) return 'Expire dans 1 minute';
    return `Expire dans ${timeRemaining} minutes`;
  };

  return (
    <Alert className={`border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">Session expirant bientôt</span>
          <Badge variant={getUrgencyColor()}>
            {getUrgencyMessage()}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {showRefreshButton && !isSessionExpired && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs"
            >
              {isRefreshing ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Rafraîchir
            </Button>
          )}

          {showSignOutButton && (
            <Button
              variant={isSessionExpired ? "default" : "outline"}
              size="sm"
              onClick={handleSignOut}
              className="text-xs"
            >
              <LogOut className="h-3 w-3 mr-1" />
              {isSessionExpired ? 'Se reconnecter' : 'Se reconnecter'}
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};