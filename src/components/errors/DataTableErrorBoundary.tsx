/**
 * Error Boundary spécialisée pour les tableaux de données
 * Gère les erreurs dans les composants de tableaux (React Table, etc.)
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database } from 'lucide-react';
import { AlertCircleIcon } from '@/components/icons/AlertCircleIcon';
import * as Sentry from '@sentry/react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  tableName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export class DataTableErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Incrémenter le compteur d'erreurs
    this.setState((prev) => ({
      errorCount: prev.errorCount + 1,
    }));

    // Log vers Sentry avec contexte du tableau
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
        table: {
          name: this.props.tableName || 'unknown',
          errorCount: this.state.errorCount + 1,
        },
      },
      tags: {
        component: 'DataTableErrorBoundary',
        tableName: this.props.tableName || 'unknown',
      },
    });

    // Callback personnalisé
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    logger.error(`DataTable Error (${this.props.tableName || 'unknown'})`, { error, errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    
    // Callback de reset personnalisé
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    const { hasError, errorCount } = this.state;
    const { children, tableName, fallback } = this.props;

    if (hasError) {
      // Si fallback personnalisé fourni, l'utiliser
      if (fallback) {
        return fallback;
      }

      // Si trop d'erreurs consécutives, afficher un message différent
      if (errorCount >= 3) {
        return (
          <Alert variant="destructive" className="my-4">
            <Database className="h-4 w-4" />
            <AlertTitle>Erreurs répétées dans le tableau</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p>
                Le tableau{tableName && ` "${tableName}"`} rencontre des erreurs
                répétées. Veuillez rafraîchir la page ou contacter le support si
                le problème persiste.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="gap-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  Rafraîchir la page
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );
      }

      // Erreur normale
      return (
        <Alert variant="destructive" className="my-4">
          <AlertCircleIcon className="h-4 w-4" size={16} />
          <AlertTitle>Erreur d'affichage du tableau</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>
              Une erreur s'est produite lors du chargement du tableau
              {tableName && ` "${tableName}"`}.
              Nous avons été notifiés du problème.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/10 rounded text-xs font-mono text-red-600 dark:text-red-400 overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return children;
  }
}

/**
 * Placeholder à afficher pendant le chargement ou en cas d'erreur
 */
export const DataTablePlaceholder = ({ message = 'Chargement des données...' }: { message?: string }) => {
  return (
    <div className="flex items-center justify-center p-8 text-muted-foreground">
      <div className="flex flex-col items-center gap-2">
        <Database className="h-8 w-8 animate-pulse" />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};

