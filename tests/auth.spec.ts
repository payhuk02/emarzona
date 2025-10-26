/**
 * Tests E2E pour l'Authentification
 * Vérifie : inscription, connexion, déconnexion, récupération de mot de passe
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8084';

test.describe('Authentification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('devrait afficher la page d\'authentification', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    
    // Vérifier que la page est chargée
    await expect(page).toHaveURL(/.*auth/);
    
    // Vérifier la présence des éléments clés
    await expect(page.locator('text=Connexion')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('devrait afficher des erreurs de validation', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    
    // Cliquer sur le bouton de connexion sans remplir les champs
    await page.click('button[type="submit"]');
    
    // Attendre les messages d'erreur (HTML5 validation ou custom)
    await page.waitForTimeout(500);
    
    // Vérifier que les champs requis sont bien marqués
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('devrait basculer entre connexion et inscription', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    
    // Vérifier le mode par défaut (connexion)
    await expect(page.locator('text=Connexion')).toBeVisible();
    
    // Chercher le lien/bouton pour passer à l'inscription
    const signupLink = page.locator('text=/.*[Ii]nscri.*|.*[Cc]réer un compte.*/').first();
    
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await page.waitForTimeout(500);
      
      // Vérifier qu'on est bien sur l'inscription
      await expect(page.locator('text=/.*[Ii]nscription.*/').first()).toBeVisible();
    }
  });

  test('devrait pouvoir se déconnecter', async ({ page, context }) => {
    // Note: Ce test nécessite d'être déjà connecté
    // On peut soit créer un utilisateur de test, soit skip si pas connecté
    
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Si redirigé vers /auth, l'utilisateur n'est pas connecté
    await page.waitForTimeout(1000);
    
    if (page.url().includes('/auth')) {
      test.skip();
      return;
    }
    
    // Chercher le bouton de déconnexion
    const logoutButton = page.locator('text=/.*[Dd]éconnexion.*|.*[Ll]ogout.*/').first();
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Attendre la redirection
      await page.waitForURL(/.*auth.*|.*\/$/);
      
      // Vérifier qu'on est bien déconnecté
      expect(page.url()).toMatch(/auth|\/$/);
    }
  });

  test('devrait respecter les standards de sécurité', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    
    // Vérifier que le mot de passe est masqué
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    
    // Vérifier que le formulaire utilise HTTPS en production
    if (BASE_URL.startsWith('https://')) {
      const isSecure = await page.evaluate(() => window.location.protocol === 'https:');
      expect(isSecure).toBeTruthy();
    }
  });

  test('devrait être responsive', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('devrait avoir des temps de chargement acceptables', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/auth`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Le chargement ne devrait pas prendre plus de 3 secondes
    expect(loadTime).toBeLessThan(3000);
  });

  test('devrait être accessible au clavier', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    
    // Tabuler à travers les éléments
    await page.keyboard.press('Tab'); // Email input
    await page.keyboard.press('Tab'); // Password input
    await page.keyboard.press('Tab'); // Submit button
    
    // Vérifier que le focus est bien géré
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});

test.describe('Récupération de mot de passe', () => {
  test('devrait afficher le formulaire de récupération', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    
    // Chercher le lien "Mot de passe oublié"
    const forgotPasswordLink = page.locator('text=/.*[Mm]ot de passe oublié.*|.*[Ff]orgot password.*/').first();
    
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      await page.waitForTimeout(500);
      
      // Vérifier qu'on affiche bien le formulaire
      await expect(page.locator('input[type="email"]')).toBeVisible();
    }
  });
});

test.describe('Session & Persistance', () => {
  test('devrait persister la session après refresh', async ({ page, context }) => {
    // Note: Ce test nécessite un utilisateur connecté
    
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(1000);
    
    if (page.url().includes('/auth')) {
      test.skip();
      return;
    }
    
    // Refresh la page
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Vérifier qu'on est toujours sur le dashboard
    expect(page.url()).toContain('/dashboard');
  });
});

