/**
 * Error Boundary spécifique pour les formulaires
 * Date : 27 octobre 2025
 */

import React, { Component, ErrorInfo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/react';
import { logger } from '@/lib/logger';

interface Props {
  children: React.ReactNode;
  formName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export class FormErrorBoundary extends Component<Props, State> {
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

    // Log vers Sentry avec contexte du formulaire
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
        form: {
          name: this.props.formName || 'unknown',
          errorCount: this.state.errorCount + 1,
        },
      },
      tags: {
        component: 'FormErrorBoundary',
        formName: this.props.formName || 'unknown',
      },
    });

    // Callback personnalisé
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    logger.error(`Form Error (${this.props.formName})`, { error, errorInfo });
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
    const { children, formName } = this.props;

    if (hasError) {
      // Si trop d'erreurs consécutives, afficher un message différent
      if (errorCount >= 3) {
        return (
          <Alert variant="destructive" className="my-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Erreurs répétées détectées</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p>
                Le formulaire{formName && ` "${formName}"`} rencontre des erreurs
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

      return (
        <Alert variant="destructive" className="my-4">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Erreur du formulaire</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>
              Une erreur s'est produite{formName && ` dans le formulaire "${formName}"`}.
              Vos données n'ont pas été perdues.
            </p>
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

