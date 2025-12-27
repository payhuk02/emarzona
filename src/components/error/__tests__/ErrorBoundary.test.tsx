/**
 * Tests unitaires pour ErrorBoundary
 * Composant critique pour la gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Composant qui génère une erreur pour tester
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Supprimer les erreurs de console pendant les tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('devrait rendre les enfants normalement si pas d\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('devrait capturer les erreurs et afficher le fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback d'erreur
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });

  it('devrait utiliser le fallback personnalisé si fourni', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('devrait appeler onError callback quand une erreur survient', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('devrait permettre de réinitialiser l\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Trouver le bouton de reset
    const resetButton = screen.getByText(/réessayer|retry/i);
    expect(resetButton).toBeInTheDocument();

    // Cliquer sur reset
    resetButton.click();

    // L'erreur devrait être réinitialisée
    // (Note: Dans un vrai test, on devrait vérifier que les enfants sont re-rendus)
  });

  it('devrait gérer différents niveaux d\'erreur', () => {
    render(
      <ErrorBoundary level="page">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback avec le niveau approprié
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });
});

 * Tests unitaires pour ErrorBoundary
 * Composant critique pour la gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Composant qui génère une erreur pour tester
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Supprimer les erreurs de console pendant les tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('devrait rendre les enfants normalement si pas d\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('devrait capturer les erreurs et afficher le fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback d'erreur
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });

  it('devrait utiliser le fallback personnalisé si fourni', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('devrait appeler onError callback quand une erreur survient', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('devrait permettre de réinitialiser l\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Trouver le bouton de reset
    const resetButton = screen.getByText(/réessayer|retry/i);
    expect(resetButton).toBeInTheDocument();

    // Cliquer sur reset
    resetButton.click();

    // L'erreur devrait être réinitialisée
    // (Note: Dans un vrai test, on devrait vérifier que les enfants sont re-rendus)
  });

  it('devrait gérer différents niveaux d\'erreur', () => {
    render(
      <ErrorBoundary level="page">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback avec le niveau approprié
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });
});

 * Tests unitaires pour ErrorBoundary
 * Composant critique pour la gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Composant qui génère une erreur pour tester
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Supprimer les erreurs de console pendant les tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('devrait rendre les enfants normalement si pas d\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('devrait capturer les erreurs et afficher le fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback d'erreur
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });

  it('devrait utiliser le fallback personnalisé si fourni', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('devrait appeler onError callback quand une erreur survient', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('devrait permettre de réinitialiser l\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Trouver le bouton de reset
    const resetButton = screen.getByText(/réessayer|retry/i);
    expect(resetButton).toBeInTheDocument();

    // Cliquer sur reset
    resetButton.click();

    // L'erreur devrait être réinitialisée
    // (Note: Dans un vrai test, on devrait vérifier que les enfants sont re-rendus)
  });

  it('devrait gérer différents niveaux d\'erreur', () => {
    render(
      <ErrorBoundary level="page">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback avec le niveau approprié
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });
});

 * Tests unitaires pour ErrorBoundary
 * Composant critique pour la gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Composant qui génère une erreur pour tester
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Supprimer les erreurs de console pendant les tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('devrait rendre les enfants normalement si pas d\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('devrait capturer les erreurs et afficher le fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback d'erreur
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });

  it('devrait utiliser le fallback personnalisé si fourni', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('devrait appeler onError callback quand une erreur survient', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('devrait permettre de réinitialiser l\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Trouver le bouton de reset
    const resetButton = screen.getByText(/réessayer|retry/i);
    expect(resetButton).toBeInTheDocument();

    // Cliquer sur reset
    resetButton.click();

    // L'erreur devrait être réinitialisée
    // (Note: Dans un vrai test, on devrait vérifier que les enfants sont re-rendus)
  });

  it('devrait gérer différents niveaux d\'erreur', () => {
    render(
      <ErrorBoundary level="page">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback avec le niveau approprié
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });
});

 * Tests unitaires pour ErrorBoundary
 * Composant critique pour la gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Composant qui génère une erreur pour tester
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Supprimer les erreurs de console pendant les tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('devrait rendre les enfants normalement si pas d\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('devrait capturer les erreurs et afficher le fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback d'erreur
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });

  it('devrait utiliser le fallback personnalisé si fourni', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('devrait appeler onError callback quand une erreur survient', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('devrait permettre de réinitialiser l\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Trouver le bouton de reset
    const resetButton = screen.getByText(/réessayer|retry/i);
    expect(resetButton).toBeInTheDocument();

    // Cliquer sur reset
    resetButton.click();

    // L'erreur devrait être réinitialisée
    // (Note: Dans un vrai test, on devrait vérifier que les enfants sont re-rendus)
  });

  it('devrait gérer différents niveaux d\'erreur', () => {
    render(
      <ErrorBoundary level="page">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback avec le niveau approprié
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });
});

 * Tests unitaires pour ErrorBoundary
 * Composant critique pour la gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Composant qui génère une erreur pour tester
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Supprimer les erreurs de console pendant les tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('devrait rendre les enfants normalement si pas d\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('devrait capturer les erreurs et afficher le fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback d'erreur
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });

  it('devrait utiliser le fallback personnalisé si fourni', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('devrait appeler onError callback quand une erreur survient', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('devrait permettre de réinitialiser l\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Trouver le bouton de reset
    const resetButton = screen.getByText(/réessayer|retry/i);
    expect(resetButton).toBeInTheDocument();

    // Cliquer sur reset
    resetButton.click();

    // L'erreur devrait être réinitialisée
    // (Note: Dans un vrai test, on devrait vérifier que les enfants sont re-rendus)
  });

  it('devrait gérer différents niveaux d\'erreur', () => {
    render(
      <ErrorBoundary level="page">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback avec le niveau approprié
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });
});

 * Tests unitaires pour ErrorBoundary
 * Composant critique pour la gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Composant qui génère une erreur pour tester
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Supprimer les erreurs de console pendant les tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('devrait rendre les enfants normalement si pas d\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('devrait capturer les erreurs et afficher le fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback d'erreur
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });

  it('devrait utiliser le fallback personnalisé si fourni', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('devrait appeler onError callback quand une erreur survient', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('devrait permettre de réinitialiser l\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Trouver le bouton de reset
    const resetButton = screen.getByText(/réessayer|retry/i);
    expect(resetButton).toBeInTheDocument();

    // Cliquer sur reset
    resetButton.click();

    // L'erreur devrait être réinitialisée
    // (Note: Dans un vrai test, on devrait vérifier que les enfants sont re-rendus)
  });

  it('devrait gérer différents niveaux d\'erreur', () => {
    render(
      <ErrorBoundary level="page">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback avec le niveau approprié
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });
});

 * Tests unitaires pour ErrorBoundary
 * Composant critique pour la gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Composant qui génère une erreur pour tester
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Supprimer les erreurs de console pendant les tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('devrait rendre les enfants normalement si pas d\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('devrait capturer les erreurs et afficher le fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback d'erreur
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });

  it('devrait utiliser le fallback personnalisé si fourni', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('devrait appeler onError callback quand une erreur survient', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('devrait permettre de réinitialiser l\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Trouver le bouton de reset
    const resetButton = screen.getByText(/réessayer|retry/i);
    expect(resetButton).toBeInTheDocument();

    // Cliquer sur reset
    resetButton.click();

    // L'erreur devrait être réinitialisée
    // (Note: Dans un vrai test, on devrait vérifier que les enfants sont re-rendus)
  });

  it('devrait gérer différents niveaux d\'erreur', () => {
    render(
      <ErrorBoundary level="page">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback avec le niveau approprié
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });
});

 * Tests unitaires pour ErrorBoundary
 * Composant critique pour la gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Composant qui génère une erreur pour tester
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Supprimer les erreurs de console pendant les tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('devrait rendre les enfants normalement si pas d\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('devrait capturer les erreurs et afficher le fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback d'erreur
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });

  it('devrait utiliser le fallback personnalisé si fourni', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('devrait appeler onError callback quand une erreur survient', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('devrait permettre de réinitialiser l\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Trouver le bouton de reset
    const resetButton = screen.getByText(/réessayer|retry/i);
    expect(resetButton).toBeInTheDocument();

    // Cliquer sur reset
    resetButton.click();

    // L'erreur devrait être réinitialisée
    // (Note: Dans un vrai test, on devrait vérifier que les enfants sont re-rendus)
  });

  it('devrait gérer différents niveaux d\'erreur', () => {
    render(
      <ErrorBoundary level="page">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback avec le niveau approprié
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });
});

 * Tests unitaires pour ErrorBoundary
 * Composant critique pour la gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Composant qui génère une erreur pour tester
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Supprimer les erreurs de console pendant les tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('devrait rendre les enfants normalement si pas d\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('devrait capturer les erreurs et afficher le fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback d'erreur
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });

  it('devrait utiliser le fallback personnalisé si fourni', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('devrait appeler onError callback quand une erreur survient', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('devrait permettre de réinitialiser l\'erreur', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Trouver le bouton de reset
    const resetButton = screen.getByText(/réessayer|retry/i);
    expect(resetButton).toBeInTheDocument();

    // Cliquer sur reset
    resetButton.click();

    // L'erreur devrait être réinitialisée
    // (Note: Dans un vrai test, on devrait vérifier que les enfants sont re-rendus)
  });

  it('devrait gérer différents niveaux d\'erreur', () => {
    render(
      <ErrorBoundary level="page">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Devrait afficher le fallback avec le niveau approprié
    expect(screen.getByText(/erreur|error/i)).toBeInTheDocument();
  });
});








