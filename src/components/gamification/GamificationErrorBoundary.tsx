/**
 * Error Boundary simplifié et autonome pour la page Gamification
 * N'importe PAS ErrorFallback pour éviter les problèmes de bundling en production
 */

import React, { Component, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface GamificationErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface GamificationErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary simplifié spécifique pour Gamification
 * Ne dépend d'aucun composant externe pour éviter les problèmes de bundling
 */
export class GamificationErrorBoundary extends Component<
  GamificationErrorBoundaryProps,
  GamificationErrorBoundaryState
> {
  constructor(props: GamificationErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<GamificationErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log avec logger
    if (process.env.NODE_ENV === 'development') {
      logger.error('Gamification Error', { error, errorInfo });
    }

    // Callback personnalisé si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Mettre à jour l'état
    this.setState({
      error,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Si un fallback personnalisé est fourni, l'utiliser
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback minimal par défaut (ne devrait jamais être utilisé car on fournit toujours un fallback)
      return (
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
    }

    return this.props.children;
  }
}

