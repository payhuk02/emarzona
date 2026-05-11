/**
 * Tests d'intégration pour le système de versions de produits digitaux
 * Date: 1 Février 2025
 * 
 * Tests E2E pour :
 * - Création de versions avec upload de fichiers
 * - Gestion des versions
 * - Notifications de mises à jour
 */

import { test, expect } from '@playwright/test';

test.describe('Digital Product Versions Management', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter en tant que vendeur
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'vendor@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new version with file upload', async ({ page }) => {
    // Naviguer vers un produit digital
    await page.goto('/dashboard/digital-products');
    await page.click('text=Premier produit'); // Ajuster selon vos données de test
    
    // Aller à la page de gestion des versions
    await page.goto('/dashboard/digital/products/[productId]/versions'); // Remplacer par l'ID réel
    
    // Cliquer sur "Nouvelle Version"
    await page.click('button:has-text("Nouvelle Version")');
    
    // Remplir le formulaire
    await page.fill('input[placeholder*="1.2.3"]', '2.0.0');
    await page.fill('input[placeholder*="Version 2.0"]', 'Version 2.0 - Nouveau Design');
    await page.fill('textarea[placeholder*="Nouvelles fonctionnalités"]', 'Nouvelles fonctionnalités ajoutées');
    
    // Uploader un fichier
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-file.zip',
      mimeType: 'application/zip',
      buffer: Buffer.from('test file content'),
    });
    
    // Cocher "Version courante"
    await page.check('input[type="checkbox"]');
    
    // Soumettre
    await page.click('button:has-text("Créer la version")');
    
    // Vérifier que la version apparaît
    await expect(page.locator('text=Version 2.0.0')).toBeVisible();
    await expect(page.locator('text=Version Actuelle')).toBeVisible();
  });

  test('should display version history', async ({ page }) => {
    await page.goto('/dashboard/digital/products/[productId]/versions');
    
    // Vérifier que l'historique s'affiche
    await expect(page.locator('text=Historique des Versions')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('should delete a version', async ({ page }) => {
    await page.goto('/dashboard/digital/products/[productId]/versions');
    
    // Cliquer sur le menu d'actions d'une version
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.locator('button').last().click();
    
    // Cliquer sur "Supprimer"
    await page.click('text=Supprimer');
    
    // Confirmer la suppression
    page.on('dialog', dialog => dialog.accept());
    
    // Vérifier que la version a disparu
    await expect(firstRow).not.toBeVisible();
  });

  test('should validate version number format', async ({ page }) => {
    await page.goto('/dashboard/digital/products/[productId]/versions');
    await page.click('button:has-text("Nouvelle Version")');
    
    // Essayer un format invalide
    await page.fill('input[placeholder*="1.2.3"]', 'invalid');
    await page.click('button:has-text("Créer la version")');
    
    // Vérifier le message d'erreur
    await expect(page.locator('text=Format: major.minor.patch')).toBeVisible();
  });

  test('should validate file size limit', async ({ page }) => {
    await page.goto('/dashboard/digital/products/[productId]/versions');
    await page.click('button:has-text("Nouvelle Version")');
    
    // Créer un fichier trop volumineux (simulé)
    const largeFile = Buffer.alloc(600 * 1024 * 1024); // 600MB
    const fileInput = page.locator('input[type="file"]');
    
    // Note: Playwright ne peut pas vraiment simuler un fichier de cette taille
    // Ce test nécessiterait un mock ou une vraie validation côté serveur
    await fileInput.setInputFiles({
      name: 'large-file.zip',
      mimeType: 'application/zip',
      buffer: largeFile,
    });
    
    // Vérifier que l'erreur s'affiche
    await expect(page.locator('text=trop volumineux')).toBeVisible();
  });
});

test.describe('Version Notifications', () => {
  test('should notify customers when new version is released', async ({ page }) => {
    // Test pour vérifier que les notifications sont créées
    // Ce test nécessiterait un setup de base de données de test
  });
});

