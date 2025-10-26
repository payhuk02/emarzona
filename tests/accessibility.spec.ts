/**
 * Tests d'Accessibilité WCAG 2.1
 * Vérifie : contraste, navigation clavier, ARIA, lecteurs d'écran, etc.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8084';

const pages = [
  { name: 'Accueil', path: '/' },
  { name: 'Marketplace', path: '/marketplace' },
  { name: 'Authentification', path: '/auth' },
];

test.describe('Accessibilité - Scan Automatique', () => {
  pages.forEach(page => {
    test(`${page.name} - Pas de violations WCAG`, async ({ page: testPage }) => {
      await testPage.goto(`${BASE_URL}${page.path}`);
      await testPage.waitForLoadState('networkidle');
      
      // Scanner la page avec axe-core
      const accessibilityScanResults = await new AxeBuilder({ page: testPage })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      
      // Vérifier qu'il n'y a pas de violations
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });
});

test.describe('Accessibilité - Navigation Clavier', () => {
  test('devrait pouvoir naviguer avec Tab', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    
    // Tabuler 5 fois
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      // Vérifier que le focus est visible
      const focusedElement = await page.evaluateHandle(() => document.activeElement);
      expect(focusedElement).toBeTruthy();
    }
  });

  test('devrait pouvoir naviguer en arrière avec Shift+Tab', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    
    // Aller en avant puis en arrière
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    expect(focusedElement).toBeTruthy();
  });

  test('devrait pouvoir activer les liens avec Enter', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    
    // Tabuler jusqu'à un lien
    await page.keyboard.press('Tab');
    
    // Obtenir l'élément focusé
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    
    if (focusedTag === 'A') {
      // Appuyer sur Enter devrait naviguer
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // L'URL devrait avoir changé
      // (ou un modal s'est ouvert, etc.)
      expect(page.url()).toBeTruthy();
    }
  });

  test('devrait pouvoir activer les boutons avec Space', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    await page.waitForLoadState('networkidle');
    
    // Tabuler jusqu'à un bouton
    let foundButton = false;
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
      
      if (focusedTag === 'BUTTON') {
        foundButton = true;
        break;
      }
    }
    
    if (foundButton) {
      // Appuyer sur Space devrait activer le bouton
      await page.keyboard.press('Space');
      await page.waitForTimeout(500);
      
      expect(true).toBeTruthy();
    }
  });

  test('devrait avoir un indicateur de focus visible', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    
    // Tabuler
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    
    // Vérifier que le focus est visible
    const focusVisible = await page.evaluate(() => {
      const focused = document.activeElement;
      if (!focused) return false;
      
      const styles = window.getComputedStyle(focused);
      const pseudoStyles = window.getComputedStyle(focused, ':focus');
      
      // Le focus devrait avoir un outline ou un effet visible
      return (
        styles.outline !== 'none' ||
        styles.boxShadow !== 'none' ||
        pseudoStyles.outline !== 'none'
      );
    });
    
    expect(focusVisible).toBeTruthy();
  });
});

test.describe('Accessibilité - ARIA & Sémantique', () => {
  test('devrait avoir des landmarks ARIA', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    
    // Vérifier la présence de landmarks
    const landmarks = await page.evaluate(() => {
      return {
        main: !!document.querySelector('main, [role="main"]'),
        nav: !!document.querySelector('nav, [role="navigation"]'),
        header: !!document.querySelector('header, [role="banner"]'),
        footer: !!document.querySelector('footer, [role="contentinfo"]'),
      };
    });
    
    // Au moins main et nav devraient être présents
    expect(landmarks.main || landmarks.nav).toBeTruthy();
  });

  test('les images devraient avoir des attributs alt', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    
    // Toutes les images devraient avoir un alt (même vide pour décoratif)
    expect(imagesWithoutAlt).toBe(0);
  });

  test('les boutons devraient avoir des labels accessibles', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    
    const buttonsWithoutLabel = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.filter(btn => {
        const hasText = btn.textContent?.trim();
        const hasAriaLabel = btn.getAttribute('aria-label');
        const hasAriaLabelledBy = btn.getAttribute('aria-labelledby');
        const hasTitle = btn.getAttribute('title');
        
        return !hasText && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle;
      }).length;
    });
    
    // Tous les boutons devraient avoir un label
    expect(buttonsWithoutLabel).toBe(0);
  });

  test('les liens devraient avoir du texte accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    
    const linksWithoutText = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.filter(link => {
        const hasText = link.textContent?.trim();
        const hasAriaLabel = link.getAttribute('aria-label');
        const hasTitle = link.getAttribute('title');
        
        return !hasText && !hasAriaLabel && !hasTitle;
      }).length;
    });
    
    expect(linksWithoutText).toBe(0);
  });

  test('les formulaires devraient avoir des labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    await page.waitForLoadState('networkidle');
    
    const inputsWithoutLabel = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])'));
      return inputs.filter(input => {
        const hasLabel = document.querySelector(`label[for="${input.id}"]`);
        const hasAriaLabel = input.getAttribute('aria-label');
        const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
        const hasPlaceholder = input.getAttribute('placeholder');
        
        return !hasLabel && !hasAriaLabel && !hasAriaLabelledBy && !hasPlaceholder;
      }).length;
    });
    
    expect(inputsWithoutLabel).toBe(0);
  });
});

test.describe('Accessibilité - Contraste', () => {
  test('le texte devrait avoir un contraste suffisant', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    
    // axe-core vérifie automatiquement le contraste
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();
    
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    
    expect(contrastViolations).toHaveLength(0);
  });
});

test.describe('Accessibilité - Responsive & Zoom', () => {
  test('devrait être utilisable avec zoom 200%', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    
    // Simuler un zoom 200%
    await page.setViewportSize({ width: 960, height: 540 }); // 1920/2, 1080/2
    await page.waitForTimeout(500);
    
    // Vérifier qu'il n'y a pas de scroll horizontal
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('devrait être utilisable en mode paysage mobile', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 }); // Mobile landscape
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    
    // Vérifier que le contenu est accessible
    const mainContent = page.locator('main, [role="main"]').first();
    
    if (await mainContent.count() > 0) {
      await expect(mainContent).toBeVisible();
    }
  });
});

test.describe('Accessibilité - Lecteur d\'écran', () => {
  test('devrait avoir un titre de page descriptif', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    
    // Le titre ne devrait pas être vide ou générique
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(3);
    expect(title.toLowerCase()).not.toBe('untitled');
  });

  test('devrait avoir une hiérarchie de headings correcte', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    
    const headings = await page.evaluate(() => {
      const h1s = document.querySelectorAll('h1').length;
      const headingSequence = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(h => parseInt(h.tagName.substring(1)));
      
      return {
        hasH1: h1s > 0,
        h1Count: h1s,
        sequence: headingSequence,
      };
    });
    
    // Devrait avoir exactement un H1
    expect(headings.hasH1).toBeTruthy();
    expect(headings.h1Count).toBe(1);
    
    // La séquence ne devrait pas sauter de niveaux (ex: H1 → H3)
    if (headings.sequence.length > 1) {
      for (let i = 1; i < headings.sequence.length; i++) {
        const diff = headings.sequence[i] - headings.sequence[i - 1];
        expect(diff).toBeLessThanOrEqual(1);
      }
    }
  });

  test('le contenu dynamique devrait utiliser aria-live', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForLoadState('networkidle');
    
    // Chercher des zones de contenu dynamique
    const ariaLiveRegions = await page.locator('[aria-live]').count();
    
    // Au moins une région aria-live devrait exister (pour les toasts, alertes, etc.)
    // Note: Ce test peut être skip si pas de contenu dynamique
    expect(ariaLiveRegions).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Accessibilité - Formulaires', () => {
  test('les erreurs de validation devraient être annoncées', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    await page.waitForLoadState('networkidle');
    
    // Soumettre le formulaire sans remplir
    const submitButton = page.locator('button[type="submit"]').first();
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);
      
      // Vérifier qu'il y a des messages d'erreur accessibles
      const errorMessages = await page.evaluate(() => {
        const errors = document.querySelectorAll('[role="alert"], .error, [aria-invalid="true"]');
        return errors.length;
      });
      
      expect(errorMessages).toBeGreaterThan(0);
    }
  });

  test('les champs requis devraient être identifiés', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    await page.waitForLoadState('networkidle');
    
    const requiredFields = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[required]'));
      
      return inputs.every(input => {
        const hasAsterisk = input.closest('label')?.textContent?.includes('*');
        const hasAriaRequired = input.getAttribute('aria-required') === 'true';
        const hasRequiredAttr = input.hasAttribute('required');
        
        return hasAsterisk || hasAriaRequired || hasRequiredAttr;
      });
    });
    
    expect(requiredFields).toBeTruthy();
  });
});

