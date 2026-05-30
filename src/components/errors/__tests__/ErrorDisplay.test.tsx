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
    render(<ErrorDisplay error={new Error('Failed to fetch')} title="Erreur critique" />);

    expect(screen.getByText('Erreur critique')).toBeInTheDocument();
    expect(screen.getByText(/connexion internet/i)).toBeInTheDocument();
  });

  it('devrait afficher une erreur haute sévérité', () => {
    render(<ErrorDisplay error={new Error('Failed to fetch')} />);

    expect(screen.getByText('Erreur')).toBeInTheDocument();
    expect(screen.getByText(/connexion internet/i)).toBeInTheDocument();
  });

  it('ne devrait pas afficher les erreurs non-critiques', () => {
    const lowError = {
      type: ErrorType.TABLE_NOT_EXISTS,
      severity: ErrorSeverity.LOW,
      message: 'relation "foo" does not exist',
      userMessage: 'Table non trouvée',
      retryable: false,
      originalError: new Error('relation "foo" does not exist'),
    };

    const { container } = render(<ErrorDisplay error={lowError} />);

    expect(container.firstChild).toBeNull();
  });

  it('devrait afficher un bouton retry si showRetry est true et erreur retryable', () => {
    const onRetry = vi.fn();

    render(
      <ErrorDisplay error={new Error('Failed to fetch')} showRetry={true} onRetry={onRetry} />
    );

    const retryButton = screen.getByRole('button', { name: /réessayer/i });
    expect(retryButton).toBeInTheDocument();

    retryButton.click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('ne devrait pas afficher le bouton retry si erreur non-retryable', () => {
    render(
      <ErrorDisplay
        error={Object.assign(new Error('permission denied'), { code: '42501' })}
        showRetry={true}
        onRetry={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /réessayer/i })).not.toBeInTheDocument();
  });

  it('devrait afficher un bouton dismiss si showDismiss est true', () => {
    const onDismiss = vi.fn();

    render(
      <ErrorDisplay error={new Error('Failed to fetch')} showDismiss={true} onDismiss={onDismiss} />
    );

    const dismissButton = screen.getByRole('button', { name: /fermer l'erreur/i });
    dismissButton.click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('devrait utiliser un titre personnalisé si fourni', () => {
    render(<ErrorDisplay error={new Error('Failed to fetch')} title="Titre personnalisé" />);

    expect(screen.getByText('Titre personnalisé')).toBeInTheDocument();
  });

  it('devrait accepter une classe CSS personnalisée', () => {
    const { container } = render(
      <ErrorDisplay error={new Error('Failed to fetch')} className="custom-class" />
    );

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('devrait normaliser automatiquement une erreur brute', () => {
    render(<ErrorDisplay error={new Error('Something unexpected')} />);

    expect(screen.getByText(/Une erreur inattendue s'est produite/i)).toBeInTheDocument();
  });
});
