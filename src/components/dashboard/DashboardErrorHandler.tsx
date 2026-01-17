/**
 * Gestionnaire d'erreurs spécialisé pour le dashboard
 * Propose des actions spécifiques selon le type d'erreur
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  RefreshCw,
  LogOut,
  Database,
  Shield,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

interface DashboardErrorHandlerProps {
  error: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}

type ErrorType =
  | 'SESSION_EXPIRED'
  | 'RPC_INEXISTANTE'
  | 'RPC_PERMISSIONS'
  | 'NETWORK_ERROR'
  | 'DATABASE_ERROR'
  | 'UNKNOWN';

export const DashboardErrorHandler = ({
  error,
  onRetry,
  isRetrying = false
}: DashboardErrorHandlerProps) => {
  const [errorType, setErrorType] = useState<ErrorType>('UNKNOWN');
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Déterminer le type d'erreur
  useEffect(() => {
    if (!error) {
      setErrorType('UNKNOWN');
      return;
    }

    if (error.includes('SESSION_EXPIRED') ||
        error.includes('JWT expired') ||
        error.includes('session') && error.includes('expir')) {
      setErrorType('SESSION_EXPIRED');
    } else if (error.includes('RPC_INEXISTANTE') ||
               error.includes('function') && error.includes('does not exist')) {
      setErrorType('RPC_INEXISTANTE');
    } else if (error.includes('RPC_PERMISSIONS') ||
               error.includes('permission denied')) {
      setErrorType('RPC_PERMISSIONS');
    } else if (error.includes('fetch') ||
               error.includes('network') ||
               error.includes('Failed to fetch')) {
      setErrorType('NETWORK_ERROR');
    } else if (error.includes('GROUP BY') ||
               error.includes('database') ||
               error.includes('SQL')) {
      setErrorType('DATABASE_ERROR');
    } else {
      setErrorType('UNKNOWN');
    }
  }, [error]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/login');
    } catch (err) {
      logger.error('Erreur lors de la déconnexion:', err);
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      logger.info('🔄 Nouvelle tentative de chargement du dashboard');
      onRetry();
    }
  };

  const handleGoToSettings = () => {
    navigate('/dashboard/settings');
  };

  const handleContactSupport = () => {
    // Ouvrir un email ou un chat de support
    window.open('mailto:support@emarzona.com?subject=Erreur Dashboard&body=' +
                encodeURIComponent(`Erreur rencontrée: ${error}\n\nDescription du problème: [Décrivez ce qui s'est passé]`),
                '_blank');
  };

  // Ne rien afficher si pas d'erreur
  if (!error) return null;

  const getErrorConfig = () => {
    switch (errorType) {
      case 'SESSION_EXPIRED':
        return {
          icon: <LogOut className="h-5 w-5" />,
          title: 'Session expirée',
          description: 'Votre session de connexion a expiré. Veuillez vous reconnecter pour continuer.',
          variant: 'destructive' as const,
          actions: [
            {
              label: 'Se reconnecter',
              onClick: handleSignOut,
              variant: 'default' as const,
              icon: <LogOut className="h-4 w-4" />
            }
          ]
        };

      case 'RPC_INEXISTANTE':
        return {
          icon: <Database className="h-5 w-5" />,
          title: 'Service temporairement indisponible',
          description: 'Le service de statistiques est en cours de mise à jour. Les données affichées peuvent ne pas être à jour.',
          variant: 'default' as const,
          actions: [
            {
              label: 'Réessayer',
              onClick: handleRetry,
              variant: 'outline' as const,
              icon: <RefreshCw className="h-4 w-4" />,
              disabled: isRetrying
            },
            {
              label: 'Contacter le support',
              onClick: handleContactSupport,
              variant: 'ghost' as const
            }
          ]
        };

      case 'RPC_PERMISSIONS':
        return {
          icon: <Shield className="h-5 w-5" />,
          title: 'Problème d\'autorisation',
          description: 'Vous n\'avez pas les permissions nécessaires pour accéder aux statistiques. Vérifiez vos droits d\'accès.',
          variant: 'destructive' as const,
          actions: [
            {
              label: 'Vérifier les paramètres',
              onClick: handleGoToSettings,
              variant: 'outline' as const,
              icon: <Shield className="h-4 w-4" />
            },
            {
              label: 'Contacter le support',
              onClick: handleContactSupport,
              variant: 'ghost' as const
            }
          ]
        };

      case 'NETWORK_ERROR':
        return {
          icon: <WifiOff className="h-5 w-5" />,
          title: 'Problème de connexion',
          description: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
          variant: 'destructive' as const,
          actions: [
            {
              label: 'Réessayer',
              onClick: handleRetry,
              variant: 'outline' as const,
              icon: <RefreshCw className="h-4 w-4" />,
              disabled: isRetrying
            },
            {
              label: 'Vérifier la connexion',
              onClick: () => window.location.reload(),
              variant: 'ghost' as const,
              icon: <Wifi className="h-4 w-4" />
            }
          ]
        };

      case 'DATABASE_ERROR':
        return {
          icon: <Database className="h-5 w-5" />,
          title: 'Erreur technique',
          description: 'Un problème technique empêche le chargement des statistiques. Nos équipes ont été notifiées.',
          variant: 'destructive' as const,
          actions: [
            {
              label: 'Réessayer',
              onClick: handleRetry,
              variant: 'outline' as const,
              icon: <RefreshCw className="h-4 w-4" />,
              disabled: isRetrying
            },
            {
              label: 'Actualiser la page',
              onClick: () => window.location.reload(),
              variant: 'ghost' as const
            }
          ]
        };

      default:
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          title: 'Erreur inattendue',
          description: 'Une erreur inattendue s\'est produite. Veuillez réessayer ou contacter le support.',
          variant: 'destructive' as const,
          actions: [
            {
              label: 'Réessayer',
              onClick: handleRetry,
              variant: 'outline' as const,
              icon: <RefreshCw className="h-4 w-4" />,
              disabled: isRetrying
            },
            {
              label: 'Contacter le support',
              onClick: handleContactSupport,
              variant: 'ghost' as const
            }
          ]
        };
    }
  };

  const config = getErrorConfig();

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
          {config.icon}
          {config.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <Alert variant={config.variant} className="mb-4">
          <AlertTitle className="text-sm sm:text-base">{config.title}</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm mt-1">
            {config.description}
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-2">
          {config.actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className="min-h-[44px] text-xs sm:text-sm touch-manipulation"
            >
              {action.icon && (
                <span className="mr-2">{action.icon}</span>
              )}
              {isRetrying && action.label === 'Réessayer' ? 'Rechargement...' : action.label}
            </Button>
          ))}
        </div>

        {/* Informations de debug pour les développeurs */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              Informations de debug
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              Type d'erreur: {errorType}
              Message original: {error}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
};