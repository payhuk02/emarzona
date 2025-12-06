/**
 * Tests unitaires pour les composants Select
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../select';

// Mock du hook useIsMobile
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false, // Desktop par défaut
}));

// Mock du hook useMobileKeyboard
vi.mock('@/hooks/use-mobile-keyboard', () => ({
  useMobileKeyboard: () => ({
    isKeyboardOpen: false,
    keyboardHeight: 0,
    isVisualViewportSupported: false,
  }),
}));

describe('Select', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SelectTrigger', () => {
    it('devrait rendre le trigger avec le placeholder', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
        </Select>
      );

      expect(screen.getByText('Sélectionner...')).toBeInTheDocument();
    });

    it('devrait avoir les attributs ARIA corrects', () => {
      render(
        <Select>
          <SelectTrigger aria-label="Test select">
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-label', 'Test select');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('devrait être désactivé si disabled', () => {
      render(
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeDisabled();
    });
  });

  describe('SelectContent et SelectItem', () => {
    it('devrait afficher les options quand ouvert', async () => {
      const user = userEvent.setup();

      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // Attendre que le contenu soit rendu (Radix UI utilise Portal)
      await waitFor(
        () => {
          expect(screen.getByText('Option 1')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('devrait sélectionner une option', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      render(
        <Select onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(
        () => {
          expect(screen.getByText('Option 1')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const option1 = screen.getByText('Option 1');
      await user.click(option1);

      await waitFor(
        () => {
          expect(onValueChange).toHaveBeenCalledWith('option1');
        },
        { timeout: 2000 }
      );
    });

    it('devrait avoir le rôle "option" pour les items', async () => {
      const user = userEvent.setup();

      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(
        () => {
          const items = screen.getAllByRole('option');
          expect(items.length).toBeGreaterThanOrEqual(3);
        },
        { timeout: 3000 }
      );
    });

    it('devrait désactiver un item si disabled', async () => {
      const user = userEvent.setup();

      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1" disabled>
              Option 1 (disabled)
            </SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(
        () => {
          const disabledItem = screen.getByText('Option 1 (disabled)');
          // Radix UI utilise data-disabled ou aria-disabled
          expect(
            disabledItem.hasAttribute('data-disabled') ||
            disabledItem.getAttribute('aria-disabled') === 'true' ||
            disabledItem.closest('[data-disabled]')
          ).toBeTruthy();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Accessibilité', () => {
    it('devrait avoir les attributs ARIA corrects', async () => {
      const user = userEvent.setup();

      render(
        <Select>
          <SelectTrigger aria-label="Choisir une option">
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-label', 'Choisir une option');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');

      // Note: aria-expanded est géré par Radix UI et peut ne pas être présent initialement
      // On vérifie seulement les attributs de base qui sont toujours présents
    });
  });

  describe('Touch targets', () => {
    it('devrait avoir une hauteur minimale de 44px pour le trigger', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      // Vérifier que la classe min-h-[44px] est présente
      expect(trigger.className).toContain('min-h-[44px]');
      // Vérifier aussi la hauteur fixe h-11 (44px)
      expect(trigger.className).toContain('h-11');
    });

    it('devrait avoir une hauteur minimale de 44px pour les items', async () => {
      const user = userEvent.setup();

      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(
        () => {
          const items = screen.getAllByRole('option');
          expect(items.length).toBeGreaterThan(0);
          // Vérifier que la classe min-h-[44px] est présente
          items.forEach((item) => {
            expect(item.className).toContain('min-h-[44px]');
          });
        },
        { timeout: 3000 }
      );
    });
  });
});

