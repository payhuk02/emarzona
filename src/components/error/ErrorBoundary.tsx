/**
 * Error Boundary avancée avec logging et UI personnalisable
 */

import React, { Component, ReactNode, Suspense, lazy } from 'react';
import { logError } from '@/lib/error-logger';

// Lazy load ErrorFallback pour éviter les problèmes de bundling en production
const ErrorFallback = lazy(() => import('./ErrorFallback').then(module => ({ default: module.ErrorFallback })));

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'app' | 'page' | 'section' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch( _error: Error, errorInfo: React.ErrorInfo): void {
    // Log l'erreur
    logError(error, {
      componentStack: errorInfo.componentStack,
      level: this.props.level || 'component',
    });

    // Callback personnalisé
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Mettre à jour l'état
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Utiliser le fallback personnalisé ou le fallback par défaut
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback minimal en cas d'erreur de chargement du lazy component
      const FallbackMinimal = () => (
        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Erreur de chargement
              </p>
              <button
                onClick={this.handleReset}
                className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      );

      return (
        <Suspense fallback={<FallbackMinimal />}>
          <ErrorFallback
            error={this.state.error}
            resetError={this.handleReset}
            level={this.props.level || 'component'}
          />
        </Suspense>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC pour envelopper un composant avec une Error Boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
}







