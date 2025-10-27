/**
 * Error Boundary spécifique pour la section Reviews
 * Date : 27 octobre 2025
 */

import React, { Component, ErrorInfo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ReviewsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log vers Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        component: 'ReviewsErrorBoundary',
      },
    });

    // Callback personnalisé
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('Reviews Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur d'affichage des avis</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>
              Une erreur s'est produite lors du chargement des avis clients.
              Nous avons été notifiés du problème.
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

    return this.props.children;
  }
}

/**
 * Placeholder à afficher pendant le chargement ou en cas d'erreur
 */
export const ReviewsPlaceholder = () => (
  <div className="space-y-4 p-6 bg-muted/30 rounded-lg">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
        <div className="h-3 bg-muted rounded w-1/4 animate-pulse" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-muted rounded w-full animate-pulse" />
      <div className="h-3 bg-muted rounded w-5/6 animate-pulse" />
      <div className="h-3 bg-muted rounded w-4/6 animate-pulse" />
    </div>
  </div>
);

