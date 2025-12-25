/**
 * Error Boundary Component
 * Date: 28 Janvier 2025
 * 
 * Composant pour capturer et afficher les erreurs React
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { logger } from '@/lib/logger';
import { normalizeError, logError, ErrorSeverity } from '@/lib/error-handling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Logger l'erreur
    const normalized = logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Appeler le callback si fourni
    this.props.onError?.(error, errorInfo);

    // Enregistrer dans l'état pour affichage
    this.setState({
      error,
      errorInfo,
    });

    // Envoyer à Sentry si configuré (déjà fait dans logger si Sentry est actif)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Utiliser le fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const normalized = this.state.error 
        ? normalizeError(this.state.error)
        : null;

      const isDev = import.meta.env.DEV;
      const showDetails = this.props.showDetails !== false && (isDev || normalized?.severity === ErrorSeverity.CRITICAL);

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Une erreur est survenue</CardTitle>
                  <CardDescription>
                    {normalized?.userMessage || 'Une erreur inattendue s\'est produite.'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showDetails && this.state.error && (
                <Alert variant="destructive">
                  <Bug className="h-4 w-4" />
                  <AlertTitle>Détails techniques</AlertTitle>
                  <AlertDescription className="font-mono text-xs">
                    <div className="space-y-2">
                      <div>
                        <strong>Message:</strong> {this.state.error.message}
                      </div>
                      {this.state.error.stack && (
                        <div>
                          <strong>Stack:</strong>
                          <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-48">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-48">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.handleReset} variant="default" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
                <Button onClick={this.handleReload} variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recharger la page
                </Button>
                <Button onClick={this.handleGoHome} variant="ghost" className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </div>

              {normalized?.retryable && (
                <p className="text-sm text-muted-foreground text-center">
                  Cette erreur peut être temporaire. Essayez de réessayer dans quelques instants.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook pour utiliser Error Boundary dans les composants fonctionnels
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    logError(error, {
      errorInfo,
      hook: 'useErrorHandler',
    });
  };
}

