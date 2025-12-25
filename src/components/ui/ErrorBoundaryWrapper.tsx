/**
 * ErrorBoundaryWrapper Component
 * Date: 28 Janvier 2025
 * 
 * Wrapper pour ajouter facilement des error boundaries aux composants
 * Améliore la résilience de l'application
 */

import { Component, ReactNode, ErrorInfo } from 'react';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'app' | 'page' | 'section' | 'component';
  componentName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryWrapperState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary simple pour wrapper des composants
 */
class SimpleErrorBoundary extends Component<
  ErrorBoundaryWrapperProps,
  ErrorBoundaryWrapperState
> {
  constructor(props: ErrorBoundaryWrapperProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryWrapperState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`Error in ${this.props.componentName || 'component'}`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.props.onError?.(error, errorInfo);
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
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Erreur de chargement
            </CardTitle>
            <CardDescription>
              {this.props.componentName
                ? `Une erreur est survenue dans ${this.props.componentName}`
                : 'Une erreur est survenue'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {import.meta.env.DEV && this.state.error && (
                <div className="p-3 bg-muted rounded-md text-sm font-mono text-destructive">
                  {this.state.error.message}
                </div>
              )}
              <Button onClick={this.handleReset} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper pour ajouter une error boundary à un composant
 */
export function ErrorBoundaryWrapper({
  children,
  fallback,
  level = 'component',
  componentName,
  onError,
}: ErrorBoundaryWrapperProps) {
  // Utiliser l'ErrorBoundary avancée si disponible, sinon utiliser la simple
  return (
    <ErrorBoundary
      level={level}
      fallback={fallback}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * HOC pour wrapper un composant avec une error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    level?: 'app' | 'page' | 'section' | 'component';
    componentName?: string;
    fallback?: ReactNode;
  }
) {
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundaryWrapper
        level={options?.level || 'component'}
        componentName={options?.componentName || Component.displayName || Component.name}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </ErrorBoundaryWrapper>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

