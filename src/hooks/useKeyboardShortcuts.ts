/**
 * Hook useKeyboardShortcuts - Gestion réutilisable des raccourcis clavier
 * Simplifie l'ajout de raccourcis clavier dans les composants
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   'Ctrl+K': () => focusSearch(),
 *   'Escape': () => closeModal(),
 *   'Ctrl+N': () => createNew(),
 * });
 * ```
 */

import { useEffect, useRef } from 'react';

export type KeyboardShortcut = string;
export type KeyboardHandler = (event: KeyboardEvent) => void;

export interface KeyboardShortcutOptions {
  /**
   * Raccourcis clavier et leurs handlers
   */
  shortcuts: Record<KeyboardShortcut, KeyboardHandler>;
  /**
   * Éléments à ignorer (par défaut: input, textarea, select, contenteditable)
   * @default true
   */
  ignoreInputs?: boolean;
  /**
   * Éléments personnalisés à ignorer (sélecteurs CSS)
   */
  ignoreSelectors?: string[];
  /**
   * Activer les raccourcis seulement si l'élément est focus
   */
  enabled?: boolean;
}

/**
 * Normalise une touche de raccourci
 */
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/meta/i, 'meta')
    .replace(/cmd/i, 'meta')
    .replace(/ctrl/i, 'control')
    .replace(/alt/i, 'alt')
    .replace(/shift/i, 'shift');
}

/**
 * Vérifie si un élément doit être ignoré
 */
function shouldIgnoreElement(
  element: HTMLElement,
  ignoreInputs: boolean,
  ignoreSelectors: string[]
): boolean {
  if (ignoreInputs) {
    const tagName = element.tagName.toLowerCase();
    if (['input', 'textarea', 'select'].includes(tagName)) {
      return true;
    }
    if (element.isContentEditable) {
      return true;
    }
  }

  if (ignoreSelectors.length > 0) {
    return ignoreSelectors.some((selector) => element.matches(selector));
  }

  return false;
}

/**
 * Vérifie si un raccourci correspond à l'événement
 */
function matchesShortcut(shortcut: string, event: KeyboardEvent): boolean {
  const parts = shortcut.split('+').map((p) => normalizeKey(p.trim()));
  const key = normalizeKey(event.key);

  // Vérifier les modificateurs
  const hasMeta = parts.includes('meta');
  const hasCtrl = parts.includes('control') || parts.includes('ctrl');
  const hasAlt = parts.includes('alt');
  const hasShift = parts.includes('shift');

  if (hasMeta && !event.metaKey) return false;
  if (hasCtrl && !event.ctrlKey) return false;
  if (hasAlt && !event.altKey) return false;
  if (hasShift && !event.shiftKey) return false;

  // Vérifier la touche principale
  const mainKey = parts.find((p) => !['meta', 'control', 'ctrl', 'alt', 'shift'].includes(p));
  if (mainKey && mainKey !== key) return false;

  return true;
}

/**
 * Hook pour gérer les raccourcis clavier
 */
export function useKeyboardShortcuts(options: KeyboardShortcutOptions) {
  const {
    shortcuts,
    ignoreInputs = true,
    ignoreSelectors = [],
    enabled = true,
  } = options;

  const shortcutsRef = useRef(shortcuts);
  const enabledRef = useRef(enabled);

  // Mettre à jour les références
  useEffect(() => {
    shortcutsRef.current = shortcuts;
    enabledRef.current = enabled;
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Vérifier si l'élément doit être ignoré
      const target = event.target as HTMLElement;
      if (shouldIgnoreElement(target, ignoreInputs, ignoreSelectors)) {
        return;
      }

      // Vérifier chaque raccourci
      for (const [shortcut, handler] of Object.entries(shortcutsRef.current)) {
        if (matchesShortcut(shortcut, event)) {
          event.preventDefault();
          handler(event);
          break; // Arrêter après le premier match
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, ignoreInputs, ignoreSelectors]);
}

/**
 * Hook pour les raccourcis clavier communs
 */
export function useCommonKeyboardShortcuts(options: {
  onSearch?: () => void;
  onNew?: () => void;
  onClose?: () => void;
  onRefresh?: () => void;
  onSelectAll?: () => void;
  enabled?: boolean;
}) {
  const { onSearch, onNew, onClose, onRefresh, onSelectAll, enabled = true } = options;

  useKeyboardShortcuts({
    shortcuts: {
      'Ctrl+K': (e) => {
        e.preventDefault();
        onSearch?.();
      },
      'Meta+K': (e) => {
        e.preventDefault();
        onSearch?.();
      },
      'Ctrl+N': (e) => {
        e.preventDefault();
        onNew?.();
      },
      'Meta+N': (e) => {
        e.preventDefault();
        onNew?.();
      },
      'Escape': () => {
        onClose?.();
      },
      'Ctrl+R': (e) => {
        e.preventDefault();
        onRefresh?.();
      },
      'Meta+R': (e) => {
        e.preventDefault();
        onRefresh?.();
      },
      'Ctrl+A': (e) => {
        e.preventDefault();
        onSelectAll?.();
      },
      'Meta+A': (e) => {
        e.preventDefault();
        onSelectAll?.();
      },
    },
    enabled,
  });
}

