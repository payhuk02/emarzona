/**
 * Tests unitaires pour ErrorDisplay
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorDisplay } from '../ErrorDisplay';
import { ErrorType, ErrorSeverity } from '@/lib/error-handling';

describe('ErrorDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher une erreur critique', () => {
    const criticalError = {
      type: ErrorType.CRITICAL_ERROR,
      severity: ErrorSeverity.CRITICAL,
      message: 'Erreur critique',
      userMessage: 'Une erreur critique est survenue',
      retryable: false,
      originalError: new Error('Critical error'),
    };

    render(<ErrorDisplay error={criticalError} />);

    expect(screen.getByText('Erreur critique')).toBeInTheDocument();
    expect(screen.getByText('Une erreur critique est survenue')).toBeInTheDocument();
  });

  it('devrait afficher une erreur haute sévérité', () => {
    const highError = {
      type: ErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.HIGH,
      message: 'Network error',
      userMessage: 'Erreur de connexion',
      retryable: true,
      originalError: new Error('Network error'),
    };

    render(<ErrorDisplay error={highError} />);

    expect(screen.getByText('Erreur')).toBeInTheDocument();
    expect(screen.getByText('Erreur de connexion')).toBeInTheDocument();
  });

  it('ne devrait pas afficher les erreurs non-critiques', () => {
    const lowError = {
      type: ErrorType.TABLE_NOT_EXISTS,
      severity: ErrorSeverity.LOW,
      message: 'Table does not exist',
      userMessage: 'Table non trouvée',
      retryable: false,
      originalError: new Error('Table not found'),
    };

    const { container } = render(<ErrorDisplay error={lowError} />);

    expect(container.firstChild).toBeNull();
  });

  it('devrait afficher un bouton retry si showRetry est true et erreur retryable', () => {
    const retryableError = {
      type: ErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.HIGH,
      message: 'Network error',
      userMessage: 'Erreur de connexion',
      retryable: true,
      originalError: new Error('Network error'),
    };

    const onRetry = vi.fn();

    render(
      <ErrorDisplay 
        error={retryableError} 
        showRetry={true}
        onRetry={onRetry}
      />
    );

    const retryButton = screen.getByText('Réessayer');
    expect(retryButton).toBeInTheDocument();

    retryButton.click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('ne devrait pas afficher le bouton retry si erreur non-retryable', () => {
    const nonRetryableError = {
      type: ErrorType.VALIDATION_ERROR,
      severity: ErrorSeverity.HIGH,
      message: 'Validation error',
      userMessage: 'Erreur de validation',
      retryable: false,
      originalError: new Error('Validation error'),
    };

    render(
      <ErrorDisplay 
        error={nonRetryableError} 
        showRetry={true}
        onRetry={vi.fn()}
      />
    );

    expect(screen.queryByText('Réessayer')).not.toBeInTheDocument();
  });

  it('devrait afficher un bouton dismiss si showDismiss est true', () => {
    const error = {
      type: ErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.HIGH,
      message: 'Network error',
      userMessage: 'Erreur de connexion',
      retryable: true,
      originalError: new Error('Network error'),
    };

    const onDismiss = vi.fn();

    render(
      <ErrorDisplay 
        error={error} 
        showDismiss={true}
        onDismiss={onDismiss}
      />
    );

    const dismissButton = screen.getByRole('button', { name: '' });
    expect(dismissButton).toBeInTheDocument();

    dismissButton.click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('devrait utiliser un titre personnalisé si fourni', () => {
    const error = {
      type: ErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.HIGH,
      message: 'Network error',
      userMessage: 'Erreur de connexion',
      retryable: true,
      originalError: new Error('Network error'),
    };

    render(<ErrorDisplay error={error} title="Titre personnalisé" />);

    expect(screen.getByText('Titre personnalisé')).toBeInTheDocument();
  });

  it('devrait accepter une classe CSS personnalisée', () => {
    const error = {
      type: ErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.HIGH,
      message: 'Network error',
      userMessage: 'Erreur de connexion',
      retryable: true,
      originalError: new Error('Network error'),
    };

    const { container } = render(
      <ErrorDisplay error={error} className="custom-class" />
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('devrait normaliser automatiquement une erreur brute', () => {
    const rawError = new Error('Raw error');

    render(<ErrorDisplay error={rawError} />);

    // L'erreur devrait être normalisée et affichée
    expect(screen.getByText(/Une erreur inattendue s'est produite/)).toBeInTheDocument();
  });
});


