/**
 * Tests unitaires pour le composant LanguageSwitcher
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

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

const renderWithI18n = (component: React.ReactElement) =>
  render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);

const getLanguageTrigger = () => screen.getByRole('combobox');

const openLanguageMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(getLanguageTrigger());
  await waitFor(() => {
    expect(screen.getByRole('option', { name: /English/i })).toBeInTheDocument();
  });
};

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    localStorageMock.clear();
    i18n.changeLanguage('fr');
    document.documentElement.lang = 'fr';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the current language flag and name', () => {
    renderWithI18n(<LanguageSwitcher showLabel={true} />);

    expect(screen.getByText('🇫🇷')).toBeInTheDocument();
    expect(screen.getByText('Français')).toBeInTheDocument();
  });

  it('should display language selector button', () => {
    renderWithI18n(<LanguageSwitcher />);

    expect(getLanguageTrigger()).toBeInTheDocument();
  });

  it('should open dropdown menu when clicked', async () => {
    const user = userEvent.setup();
    renderWithI18n(<LanguageSwitcher />);

    await openLanguageMenu(user);
  });

  it('should change language when a language is selected', async () => {
    const user = userEvent.setup();
    renderWithI18n(<LanguageSwitcher />);

    await openLanguageMenu(user);
    await user.click(screen.getByRole('option', { name: /English/i }));

    await waitFor(() => {
      expect(i18n.language).toBe('en');
      expect(localStorageMock.getItem('emarzona_language')).toBe('en');
      expect(document.documentElement.lang).toBe('en');
    });
  });

  it('should persist language selection in localStorage', async () => {
    const user = userEvent.setup();
    renderWithI18n(<LanguageSwitcher />);

    await openLanguageMenu(user);
    await user.click(screen.getByRole('option', { name: /Español/i }));

    await waitFor(() => {
      expect(localStorageMock.getItem('emarzona_language')).toBe('es');
    });
  });

  it('should highlight the current language in the menu', async () => {
    const user = userEvent.setup();
    i18n.changeLanguage('en');
    renderWithI18n(<LanguageSwitcher />);

    await openLanguageMenu(user);

    const englishOption = screen.getByRole('option', { name: /English/i });
    expect(englishOption).toHaveClass('bg-accent');
  });

  it('should close menu after language selection', async () => {
    const user = userEvent.setup();
    renderWithI18n(<LanguageSwitcher />);

    await openLanguageMenu(user);
    await user.click(screen.getByRole('option', { name: /English/i }));

    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /English/i })).not.toBeInTheDocument();
    });
  });

  it('should apply custom className', () => {
    renderWithI18n(<LanguageSwitcher className="custom-class" />);

    expect(getLanguageTrigger()).toHaveClass('custom-class');
  });

  it('should apply custom buttonClassName', () => {
    renderWithI18n(<LanguageSwitcher buttonClassName="custom-button" />);

    const trigger = getLanguageTrigger();
    expect(within(trigger).getByText('🇫🇷').parentElement).toHaveClass('custom-button');
  });

  it('should support different variants', () => {
    const { rerender } = renderWithI18n(<LanguageSwitcher variant="default" />);

    expect(getLanguageTrigger()).toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher variant="outline" />
      </I18nextProvider>
    );

    expect(getLanguageTrigger()).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    renderWithI18n(<LanguageSwitcher />);

    expect(getLanguageTrigger()).toHaveAttribute('role', 'combobox');
  });

  it('should show label only when showLabel is true', () => {
    const { rerender } = renderWithI18n(<LanguageSwitcher showLabel={false} />);

    expect(screen.queryByText('Français')).not.toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <LanguageSwitcher showLabel={true} />
      </I18nextProvider>
    );

    expect(screen.getByText('Français')).toBeInTheDocument();
  });

  it('should handle all available languages', async () => {
    const user = userEvent.setup();
    renderWithI18n(<LanguageSwitcher />);

    await openLanguageMenu(user);

    expect(screen.getByRole('option', { name: /Français/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /English/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Español/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Deutsch/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Português/i })).toBeInTheDocument();
  });
});
