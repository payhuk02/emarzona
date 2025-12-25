/**
 * User-Friendly Error Toast Component
 * Date: 28 Janvier 2025
 * 
 * Composant pour afficher des erreurs user-friendly avec actions suggérées
 */

import { AlertCircle, RefreshCw, WifiOff, ShieldAlert, LogIn, SearchX, FileQuestion, AlertTriangle, FileX, Database, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserFriendlyError, getActionText, SuggestedAction } from '@/lib/user-friendly-errors';
import { cn } from '@/lib/utils';

interface UserFriendlyErrorToastProps {
  error: UserFriendlyError;
  onAction?: (action: SuggestedAction) => void;
  className?: string;
  showTechnical?: boolean;
}

/**
 * Mapping des icônes
 */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  WifiOff,
  Clock: RefreshCw,
  ShieldAlert,
  LogIn,
  SearchX,
  FileQuestion,
  AlertCircle,
  FileX,
  Database,
  AlertTriangle,
  Info,
  CheckCircle,
};

/**
 * Composant pour afficher une erreur user-friendly
 */
export function UserFriendlyErrorToast({
  error,
  onAction,
  className,
  showTechnical = false,
}: UserFriendlyErrorToastProps) {
  const IconComponent = error.icon ? ICON_MAP[error.icon] || AlertCircle : AlertCircle;

  const handleAction = (action: SuggestedAction) => {
    if (action === 'none') return;
    
    if (onAction) {
      onAction(action);
    } else {
      // Actions par défaut
      switch (action) {
        case 'refresh':
          window.location.reload();
          break;
        case 'retry':
          // L'action de retry doit être gérée par le composant parent
          break;
        case 'check-connection':
          // Ouvrir les paramètres réseau (si possible)
          break;
        case 'login':
          window.location.href = '/login';
          break;
        case 'clear-cache':
          if ('caches' in window) {
            caches.keys().then((names) => {
              names.forEach((name) => caches.delete(name));
            });
            window.location.reload();
          }
          break;
        default:
          break;
      }
    }
  };

  return (
    <Alert
      variant={error.severity === 'CRITICAL' ? 'destructive' : 'default'}
      className={cn('border-l-4', className)}
    >
      <IconComponent className="h-4 w-4" />
      <AlertTitle>{error.title}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{error.description}</p>

        {error.helpText && (
          <p className="text-sm text-muted-foreground">{error.helpText}</p>
        )}

        {error.suggestedActions.length > 0 && error.suggestedActions[0] !== 'none' && (
          <div className="flex flex-wrap gap-2 mt-3">
            {error.suggestedActions.map((action) => (
              <Button
                key={action}
                variant="outline"
                size="sm"
                onClick={() => handleAction(action)}
                className="text-xs"
              >
                {getActionText(action)}
              </Button>
            ))}
          </div>
        )}

        {showTechnical && error.technicalMessage && (
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-muted-foreground">
              Détails techniques
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {error.technicalMessage}
            </pre>
            {error.errorCode && (
              <p className="mt-1 text-muted-foreground">
                Code d'erreur: {error.errorCode}
              </p>
            )}
          </details>
        )}
      </AlertDescription>
    </Alert>
  );
}

