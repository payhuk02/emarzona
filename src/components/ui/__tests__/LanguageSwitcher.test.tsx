/**
 * Tests unitaires pour le composant LanguageSwitcher
 * 
 * Couverture :
 * - Affichage de la langue actuelle
 * - Changement de langue
 * - Persistance dans localStorage
 * - Gestion du dropdown (desktop)
 * - Stabilité du menu sur mobile
 * - Accessibilité
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

// Mock du hook useIsMobile
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false), // Desktop par défaut
}));

// Mock de localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    localStorageMock.clear();
    i18n.changeLanguage('fr');
    document.documentElement.lang = 'fr';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithI18n = (component: React.ReactElement) => {
    return render(
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    );
  };

  it('should render the current language flag and name', () => {
    renderWithI18n(<LanguageSwitcher showLabel={true} />);
    
    // Vérifier que le drapeau français est affiché
    expect(screen.getByText('🇫🇷')).toBeInTheDocument();
    expect(screen.getByText('Français')).toBeInTheDocument();
  });

  it('should display language selector button', () => {
    renderWithI18n(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /change language/i });
    expect(button).toBeInTheDocument();
  });

  it('should open dropdown menu when clicked', async () => {
    const user = userEvent.setup();
    renderWithI18n(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /change language/i });
    await user.click(button);
    
    // Vérifier que le menu est ouvert (les langues sont visibles)
    await waitFor(() => {
      expect(screen.getByText('English')).toBeInTheDocument();
    });
  });

  it('should change language when a language is selected', async () => {
    const user = userEvent.setup();
    renderWithI18n(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /change language/i });
    await user.click(button);
    
    // Attendre que le menu soit ouvert
    await waitFor(() => {
      expect(screen.getByText('English')).toBeInTheDocument();
    });
    
    // Sélectionner l'anglais
    const englishOption = screen.getByText('English');
    await user.click(englishOption);
    
    // Vérifier que la langue a changé
    await waitFor(() => {
      expect(i18n.language).toBe('en');
      expect(localStorageMock.getItem('emarzona_language')).toBe('en');
      expect(document.documentElement.lang).toBe('en');
    });
  });

  it('should persist language selection in localStorage', async () => {
    const user = userEvent.setup();
    renderWithI18n(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /change language/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Español')).toBeInTheDocument();
    });
    
    const spanishOption = screen.getByText('Español');
    await user.click(spanishOption);
    
    await waitFor(() => {
      expect(localStorageMock.getItem('emarzona_language')).toBe('es');
    });
  });

  it('should highlight the current language in the menu', async () => {
    const user = userEvent.setup();
    i18n.changeLanguage('en');
    renderWithI18n(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /change language/i });
    await user.click(button);
    
    await waitFor(() => {
      const englishOption = screen.getByText('English').closest('[role="menuitem"]');
      expect(englishOption).toHaveClass('bg-accent');
    });
  });

  it('should close menu after language selection', async () => {
    const user = userEvent.setup();
    renderWithI18n(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /change language/i });
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('English')).toBeInTheDocument();
    });
    
    const englishOption = screen.getByText('English');
    await user.click(englishOption);
    
    // Le menu devrait se fermer
    await waitFor(() => {
      expect(screen.queryByText('English')).not.toBeVisible();
    });
  });

  it('should apply custom className', () => {
    renderWithI18n(<LanguageSwitcher className="custom-class" />);
    
    const button = screen.getByRole('button', { name: /change language/i });
    expect(button.closest('div')).toHaveClass('custom-class');
  });

  it('should apply custom buttonClassName', () => {
    renderWithI18n(<LanguageSwitcher buttonClassName="custom-button" />);
    
    const button = screen.getByRole('button', { name: /change language/i });
    expect(button).toHaveClass('custom-button');
  });

  it('should support different variants', () => {
    const { rerender } = renderWithI18n(
      <LanguageSwitcher variant="default" />
    );
    
    let button = screen.getByRole('button', { name: /change language/i });
    expect(button).toBeInTheDocument();
    
    rerender(
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher variant="outline" />
      </I18nextProvider>
    );
    
    button = screen.getByRole('button', { name: /change language/i });
    expect(button).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    renderWithI18n(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /change language/i });
    expect(button).toHaveAttribute('aria-label', 'Change language');
  });

  it('should show label only when showLabel is true', () => {
    const { rerender } = renderWithI18n(
      <LanguageSwitcher showLabel={false} />
    );
    
    // Le label ne devrait pas être visible sur mobile
    const button = screen.getByRole('button', { name: /change language/i });
    expect(button).not.toHaveTextContent('Français');
    
    rerender(
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher showLabel={true} />
      </I18nextProvider>
    );
    
    // Le label devrait être visible
    expect(screen.getByText('Français')).toBeInTheDocument();
  });

  it('should handle all available languages', async () => {
    const user = userEvent.setup();
    renderWithI18n(<LanguageSwitcher />);
    
    const button = screen.getByRole('button', { name: /change language/i });
    await user.click(button);
    
    await waitFor(() => {
      // Vérifier que toutes les langues sont présentes
      expect(screen.getByText('Français')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Español')).toBeInTheDocument();
      expect(screen.getByText('Deutsch')).toBeInTheDocument();
      expect(screen.getByText('Português')).toBeInTheDocument();
    });
  });
});

