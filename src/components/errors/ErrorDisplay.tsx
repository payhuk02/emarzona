/**
 * Composant standardisé pour afficher les erreurs
 * Utilise le système de normalisation d'erreurs
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, X } from '@/components/icons';
import { normalizeError, ErrorSeverity, ErrorType } from '@/lib/error-handling';

interface ErrorDisplayProps {
  error: unknown;
  /**
   * Titre personnalisé
   */
  title?: string;
  /**
   * Si true, affiche un bouton de retry
   */
  showRetry?: boolean;
  /**
   * Callback appelé lors du retry
   */
  onRetry?: () => void;
  /**
   * Si true, affiche un bouton de fermeture
   */
  showDismiss?: boolean;
  /**
   * Callback appelé lors de la fermeture
   */
  onDismiss?: () => void;
  /**
   * Classe CSS personnalisée
   */
  className?: string;
}

export function ErrorDisplay({
  error,
  title,
  showRetry = false,
  onRetry,
  showDismiss = false,
  onDismiss,
  className = '',
}: ErrorDisplayProps) {
  const normalized = normalizeError(error);

  // Ne pas afficher les erreurs non-critiques
  if (normalized.severity === ErrorSeverity.LOW) {
    return null;
  }

  const getVariant = () => {
    switch (normalized.severity) {
      case ErrorSeverity.CRITICAL:
        return 'destructive';
      case ErrorSeverity.HIGH:
        return 'destructive';
      case ErrorSeverity.MEDIUM:
        return 'default';
      default:
        return 'default';
    }
  };

  const displayTitle = title || 
    (normalized.severity === ErrorSeverity.CRITICAL 
      ? 'Erreur critique' 
      : normalized.severity === ErrorSeverity.HIGH
      ? 'Erreur'
      : 'Attention');

  return (
    <Alert variant={getVariant()} className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{displayTitle}</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span className="flex-1">{normalized.userMessage}</span>
        <div className="flex items-center gap-2">
          {showRetry && normalized.retryable && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
          )}
          {showDismiss && onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0"
              aria-label="Fermer l'erreur"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}


