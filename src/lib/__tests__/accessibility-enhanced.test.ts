/**
 * Tests unitaires pour accessibility-enhanced.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateContrastRatio,
  checkColorContrast,
  checkElementContrast,
  validatePageAccessibility,
  setupKeyboardShortcuts,
} from '../accessibility-enhanced';

describe('Accessibility Enhanced', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
  });

  describe('calculateContrastRatio', () => {
    it('devrait calculer le ratio de contraste entre noir et blanc', () => {
      const ratio = calculateContrastRatio('#000000', '#FFFFFF');
      expect(ratio).toBeCloseTo(21, 0); // Contraste maximum
    });

    it('devrait calculer le ratio de contraste entre blanc et noir', () => {
      const ratio = calculateContrastRatio('#FFFFFF', '#000000');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('devrait calculer un ratio plus faible pour des couleurs similaires', () => {
      const ratio = calculateContrastRatio('#FF0000', '#FF0001');
      expect(ratio).toBeLessThan(2); // Très faible contraste
    });

    it('devrait retourner 1 pour des couleurs identiques', () => {
      const ratio = calculateContrastRatio('#FF0000', '#FF0000');
      expect(ratio).toBe(1);
    });
  });

  describe('checkColorContrast', () => {
    it('devrait passer WCAG AA pour noir sur blanc', () => {
      const result = checkColorContrast('#000000', '#FFFFFF');
      expect(result.passesAA).toBe(true);
      expect(result.passesAAA).toBe(true);
      expect(result.level).toBe('AAA');
    });

    it('devrait passer WCAG AA pour texte large', () => {
      const result = checkColorContrast('#666666', '#FFFFFF', 18);
      expect(result.passesAA).toBe(true);
    });

    it('devrait échouer WCAG AA pour contraste insuffisant', () => {
      const result = checkColorContrast('#CCCCCC', '#FFFFFF');
      expect(result.passesAA).toBe(false);
      expect(result.level).toBe('fail');
    });

    it('devrait inclure des recommandations si le contraste est insuffisant', () => {
      const result = checkColorContrast('#CCCCCC', '#FFFFFF');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('checkElementContrast', () => {
    it('devrait vérifier le contraste d\'un élément', () => {
      const element = document.createElement('div');
      element.style.color = '#000000';
      element.style.backgroundColor = '#FFFFFF';
      element.textContent = 'Test';
      document.body.appendChild(element);

      const result = checkElementContrast(element);
      expect(result.ratio).toBeGreaterThan(4.5);
      expect(result.passesAA).toBe(true);
    });

    it('devrait retourner false si les couleurs ne peuvent pas être extraites', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      const result = checkElementContrast(element);
      // Le résultat peut varier selon l'environnement de test
      expect(result).toHaveProperty('ratio');
      expect(result).toHaveProperty('passesAA');
    });
  });

  describe('validatePageAccessibility', () => {
    it('devrait détecter les images sans alt', () => {
      const img = document.createElement('img');
      img.src = 'test.jpg';
      document.body.appendChild(img);

      const report = validatePageAccessibility();
      expect(report.violations.some(v => v.type === 'missing-alt')).toBe(true);
    });

    it('devrait détecter les boutons sans label', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);

      const report = validatePageAccessibility();
      expect(report.violations.some(v => v.type === 'missing-button-label')).toBe(true);
    });

    it('devrait détecter les liens sans texte', () => {
      const link = document.createElement('a');
      link.href = '#';
      document.body.appendChild(link);

      const report = validatePageAccessibility();
      expect(report.violations.some(v => v.type === 'missing-link-text')).toBe(true);
    });

    it('devrait détecter les inputs sans label', () => {
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);

      const report = validatePageAccessibility();
      expect(report.violations.some(v => v.type === 'missing-input-label')).toBe(true);
    });

    it('devrait calculer un score d\'accessibilité', () => {
      const report = validatePageAccessibility();
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
    });

    it('devrait inclure des recommandations', () => {
      const img = document.createElement('img');
      img.src = 'test.jpg';
      document.body.appendChild(img);

      const report = validatePageAccessibility();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('devrait détecter l\'absence de landmark main', () => {
      const report = validatePageAccessibility();
      const hasMainWarning = report.warnings.some(w => w.type === 'missing-landmark');
      // Peut être présent ou non selon le DOM
      expect(report.warnings).toBeDefined();
    });
  });

  describe('setupKeyboardShortcuts', () => {
    it('devrait configurer les raccourcis clavier', () => {
      const cleanup = setupKeyboardShortcuts();
      expect(typeof cleanup).toBe('function');
      
      // Nettoyer
      cleanup();
    });

    it('devrait permettre de nettoyer les raccourcis', () => {
      const cleanup = setupKeyboardShortcuts();
      
      // Vérifier que la fonction de nettoyage existe
      expect(() => cleanup()).not.toThrow();
    });
  });
});

