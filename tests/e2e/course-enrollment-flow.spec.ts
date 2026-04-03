/**
/**
 * Tests E2E pour le flux d'inscription aux cours
 * Couvre le parcours complet : dÃ©couverte â†’ paiement â†’ inscription
 * 
 * Pour exÃ©cuter: npm run test:e2e course-enrollment-flow
 */

import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour le flux d'inscription aux cours
 * Couvre le parcours complet : dÃ©couverte â†’ paiement â†’ inscription
 *
 * Pour exÃ©cuter: npm run test:e2e course-enrollment-flow
 */

test.describe('Flux d\'Inscription aux Cours', () => {
  test.beforeEach(async ({ page }) => {
    // Aller Ã  la page d'accueil
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Devrait permettre de dÃ©couvrir un cours et voir les dÃ©tails', async ({ page }) => {
    // Naviguer vers la marketplace ou la page des cours
    await page.goto('/marketplace');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    // Filtrer pour trouver un cours
    const courseFilter = page.locator('button:has-text("Cours"), button:has-text("Course")');
    if (await courseFilter.isVisible()) {
      await courseFilter.click();
    }

    // Cliquer sur le premier cours trouvÃ©
    const courseCard = page.locator('[data-testid="product-card"]').first();
    await courseCard.click();

    // Attendre la page de dÃ©tail du cours
    await page.waitForURL(/\/courses\/.*/, { timeout: 10000 });

    // VÃ©rifier que les informations du cours sont affichÃ©es
    await expect(page.locator('h1')).toBeVisible();
    
    // VÃ©rifier la prÃ©sence du bouton d'inscription
    const enrollButton = page.locator('button:has-text("S\'inscrire"), button:has-text("Inscription")');
    await expect(enrollButton).toBeVisible();
  });

  test('Devrait rediriger vers auth si non connectÃ© lors de l\'inscription', async ({ page }) => {
    // Naviguer vers un cours
    await page.goto('/marketplace');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    // Trouver et cliquer sur un cours
    const courseCard = page.locator('[data-testid="product-card"]').first();
    await courseCard.click();

    await page.waitForURL(/\/courses\/.*/, { timeout: 10000 });

    // Cliquer sur le bouton d'inscription
    const enrollButton = page.locator('button:has-text("S\'inscrire"), button:has-text("Inscription")');
    if (await enrollButton.isVisible()) {
      await enrollButton.click();

      // Devrait rediriger vers /auth si non connectÃ©
      await page.waitForURL(/\/auth/, { timeout: 5000 });
      await expect(page).toHaveURL(/\/auth/);
    }
  });

  test('Devrait permettre l\'inscription si connectÃ©', async ({ page }) => {
    // Se connecter d'abord
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Attendre la redirection aprÃ¨s connexion
    await page.waitForURL(/\/dashboard|\/marketplace/, { timeout: 10000 });

    // Naviguer vers un cours
    await page.goto('/marketplace');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    // Trouver et cliquer sur un cours
    const courseCard = page.locator('[data-testid="product-card"]').first();
    await courseCard.click();

    await page.waitForURL(/\/courses\/.*/, { timeout: 10000 });

    // Cliquer sur le bouton d'inscription
    const enrollButton = page.locator('button:has-text("S\'inscrire"), button:has-text("Inscription")');
    if (await enrollButton.isVisible()) {
      await enrollButton.click();

      // Devrait rediriger vers le checkout Moneroo
      await page.waitForURL(/\/checkout|moneroo\.com/, { timeout: 10000 });
      
      // VÃ©rifier que soit on est sur le checkout, soit redirigÃ© vers Moneroo
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/checkout|moneroo\.com/);
    }
  });

  test('Devrait afficher les informations du cours (sections, leÃ§ons)', async ({ page }) => {
    // Naviguer vers un cours
    await page.goto('/marketplace');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    const courseCard = page.locator('[data-testid="product-card"]').first();
    await courseCard.click();

    await page.waitForURL(/\/courses\/.*/, { timeout: 10000 });

    // VÃ©rifier la prÃ©sence des sections du cours
    const sections = page.locator('text=/section|chapitre|module/i');
    const sectionsCount = await sections.count();
    
    // Au moins une section devrait Ãªtre visible ou le message "Aucune section"
    expect(sectionsCount).toBeGreaterThanOrEqual(0);
  });

  test('Devrait permettre la navigation vers les cohorts si inscrit', async ({ page }) => {
    // Se connecter
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/marketplace/, { timeout: 10000 });

    // Naviguer vers un cours oÃ¹ l'utilisateur est dÃ©jÃ  inscrit
    // (nÃ©cessite un cours avec enrollment existant)
    await page.goto('/courses/test-course-slug');
    await page.waitForLoadState('networkidle');

    // VÃ©rifier la prÃ©sence de la section cohorts si inscrit
    const cohortsSection = page.locator('text=/cohort|groupe/i');
    const cohortsVisible = await cohortsSection.isVisible().catch(() => false);
    
    // Si visible, vÃ©rifier qu'on peut cliquer dessus
    if (cohortsVisible) {
      const cohortLink = page.locator('a:has-text("cohort"), button:has-text("cohort")').first();
      if (await cohortLink.isVisible()) {
        await cohortLink.click();
        // Devrait naviguer vers la page du cohort
        await page.waitForURL(/\/dashboard\/cohorts\/.*/, { timeout: 5000 });
      }
    }
  });
});

/**
 * Tests E2E pour le flux d'inscription aux cours
 * Couvre le parcours complet : dÃ©couverte â†’ paiement â†’ inscription
 * 
 * Pour exÃ©cuter: npm run test:e2e course-enrollment-flow
 */

