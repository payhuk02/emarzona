/**
 * Test E2E - Workflow complet Produit Digital
 * Date: 28 octobre 2025
 * 
 * Scénario testé:
 * 1. Création produit digital via wizard
 * 2. Achat du produit
 * 3. Génération de licence
 * 4. Téléchargement du fichier
 * 
 * Prérequis:
 * - Base de données de test configurée
 * - Compte vendeur test existant
 * - Moneroo en mode sandbox
 */

import { test, expect } from '@playwright/test';

// Configuration du test
const TEST_CONFIG = {
  // Utilisateur vendeur
  vendorEmail: 'vendor-test@payhuk.com',
  vendorPassword: 'TestPassword123!',
  
  // Utilisateur acheteur
  buyerEmail: 'buyer-test@payhuk.com',
  buyerPassword: 'TestPassword123!',
  
  // Produit à créer
  productName: `E-Book Test ${Date.now()}`,
  productDescription: 'E-book de test pour automatisation',
  productPrice: 5000,
  
  // Timeout pour les opérations longues
  paymentTimeout: 30000,
};

test.describe('Workflow Produit Digital Complet', () => {
  let productId: string;
  let productSlug: string;
  
  test.beforeEach(async ({ page }) => {
    // Configurer timeout global
    test.setTimeout(120000); // 2 minutes par test
  });

  /**
   * TEST 1: Connexion vendeur
   */
  test('1. Connexion en tant que vendeur', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Remplir formulaire de connexion
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    
    // Attendre redirection vers dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    // Vérifier que nous sommes connectés
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  /**
   * TEST 2: Navigation vers création de produit
   */
  test('2. Naviguer vers la création de produit digital', async ({ page }) => {
    // Se connecter d'abord
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Aller à la page de création de produit
    await page.goto('/dashboard/products/create');
    
    // Vérifier que le sélecteur de type est visible
    await expect(page.locator('text=Type de produit')).toBeVisible();
    
    // Sélectionner "Produit Digital"
    await page.click('button:has-text("Produit Digital")');
    
    // Vérifier que le wizard s'affiche
    await expect(page.locator('text=Informations')).toBeVisible();
  });

  /**
   * TEST 3: Remplir le wizard - Étape 1 (Basic Info)
   */
  test('3. Créer produit digital - Étape 1 (Informations)', async ({ page }) => {
    // Se connecter et naviguer
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    await page.goto('/dashboard/products/create');
    await page.click('button:has-text("Produit Digital")');
    
    // Remplir le formulaire
    await page.fill('input[name="name"]', TEST_CONFIG.productName);
    await page.fill('textarea[name="description"]', TEST_CONFIG.productDescription);
    await page.fill('input[name="price"]', TEST_CONFIG.productPrice.toString());
    
    // Note: Upload d'image peut être simulé ou skip pour test
    // await page.setInputFiles('input[type="file"]', './test-image.jpg');
    
    // Cliquer sur "Suivant"
    await page.click('button:has-text("Suivant")');
    
    // Vérifier que nous sommes passés à l'étape 2
    await expect(page.locator('text=Fichiers')).toBeVisible();
  });

  /**
   * TEST 4: Workflow complet de création
   */
  test('4. Créer produit digital complet (tous les steps)', async ({ page }) => {
    // Se connecter
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Naviguer vers création
    await page.goto('/dashboard/products/create');
    await page.click('button:has-text("Produit Digital")');
    
    // ===== ÉTAPE 1: Basic Info =====
    await page.fill('input[name="name"]', TEST_CONFIG.productName);
    await page.fill('textarea[name="description"]', TEST_CONFIG.productDescription);
    await page.fill('input[name="price"]', TEST_CONFIG.productPrice.toString());
    await page.click('button:has-text("Suivant")');
    
    // ===== ÉTAPE 2: Fichiers =====
    // Note: Pour un vrai test, il faudrait uploader un fichier
    // Pour ce test de démo, on peut skip ou utiliser un mock
    await page.click('button:has-text("Suivant")');
    
    // ===== ÉTAPE 3: Configuration =====
    // Sélectionner type de licence
    await page.selectOption('select[name="license_type"]', 'single');
    await page.click('button:has-text("Suivant")');
    
    // ===== ÉTAPE 4: Prévisualisation =====
    await expect(page.locator(`text=${TEST_CONFIG.productName}`)).toBeVisible();
    
    // Publier le produit
    await page.click('button:has-text("Publier")');
    
    // Attendre la confirmation
    await expect(page.locator('text=créé avec succès')).toBeVisible({ timeout: 10000 });
    
    // Extraire l'URL du produit pour les tests suivants
    const url = page.url();
    const match = url.match(/\/products\/([^/]+)/);
    if (match) {
      productSlug = match[1];
    }
  });

  /**
   * TEST 5: Vérifier que le produit est visible sur le marketplace
   */
  test('5. Vérifier produit visible sur marketplace', async ({ page }) => {
    // Aller sur le marketplace
    await page.goto('/marketplace');
    
    // Rechercher le produit
    await page.fill('input[placeholder*="Rechercher"]', TEST_CONFIG.productName);
    await page.press('input[placeholder*="Rechercher"]', 'Enter');
    
    // Attendre les résultats
    await page.waitForTimeout(2000);
    
    // Vérifier que le produit apparaît
    await expect(page.locator(`text=${TEST_CONFIG.productName}`)).toBeVisible();
  });

  /**
   * TEST 6: Achat du produit digital
   */
  test('6. Acheter le produit digital', async ({ page }) => {
    // Se connecter en tant qu'acheteur
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.buyerEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.buyerPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Aller sur le marketplace
    await page.goto('/marketplace');
    
    // Rechercher et cliquer sur le produit
    await page.fill('input[placeholder*="Rechercher"]', TEST_CONFIG.productName);
    await page.press('input[placeholder*="Rechercher"]', 'Enter');
    await page.waitForTimeout(2000);
    
    // Cliquer sur le produit
    await page.click(`text=${TEST_CONFIG.productName}`);
    
    // Vérifier que nous sommes sur la page du produit
    await expect(page.locator('h1')).toContainText(TEST_CONFIG.productName);
    
    // Cliquer sur "Acheter"
    await page.click('button:has-text("Acheter")');
    
    // Attendre la redirection vers Moneroo (ou page de paiement)
    // Note: En environnement de test, Moneroo devrait être en mode sandbox
    await page.waitForURL('**/checkout/**', { timeout: TEST_CONFIG.paymentTimeout });
  });

  /**
   * TEST 7: Vérifier la licence générée
   */
  test('7. Vérifier licence générée après achat', async ({ page, context }) => {
    // Note: Ce test nécessite que le paiement soit complété
    // En environnement de test, on pourrait simuler un webhook Moneroo
    
    // Se connecter en tant qu'acheteur
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.buyerEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.buyerPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Aller à la page "Mes Licences"
    await page.goto('/dashboard/my-licenses');
    
    // Vérifier qu'une licence existe pour ce produit
    // Note: Ceci nécessite que l'achat précédent soit complété
    await expect(page.locator(`text=${TEST_CONFIG.productName}`)).toBeVisible();
    
    // Vérifier que la clé de licence est affichée
    await expect(page.locator('text=/[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/')).toBeVisible();
  });

  /**
   * TEST 8: Télécharger le fichier digital
   */
  test('8. Télécharger le fichier après achat', async ({ page }) => {
    // Se connecter en tant qu'acheteur
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.buyerEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.buyerPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Aller à la page "Mes Téléchargements"
    await page.goto('/dashboard/my-downloads');
    
    // Vérifier que le produit est disponible au téléchargement
    await expect(page.locator(`text=${TEST_CONFIG.productName}`)).toBeVisible();
    
    // Commencer le téléchargement
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Télécharger")'),
    ]);
    
    // Vérifier que le téléchargement a démarré
    expect(download).toBeTruthy();
    
    // Vérifier le nom du fichier (optionnel)
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toBeTruthy();
  });

  /**
   * TEST 9: Vérifier analytics vendeur
   */
  test('9. Vérifier analytics pour le vendeur', async ({ page }) => {
    // Se connecter en tant que vendeur
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Aller à la page de gestion des produits digitaux
    await page.goto('/dashboard/digital-products');
    
    // Vérifier que le produit créé apparaît
    await expect(page.locator(`text=${TEST_CONFIG.productName}`)).toBeVisible();
    
    // Cliquer sur le produit pour voir les détails
    await page.click(`text=${TEST_CONFIG.productName}`);
    
    // Vérifier que les statistiques sont affichées
    await expect(page.locator('text=Téléchargements')).toBeVisible();
    await expect(page.locator('text=Licences')).toBeVisible();
  });

  /**
   * TEST 10: Nettoyage - Supprimer le produit de test
   */
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    
    // Se connecter en tant que vendeur
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Aller à la liste des produits
    await page.goto('/dashboard/digital-products');
    
    // Trouver et supprimer le produit de test
    const productCard = page.locator(`text=${TEST_CONFIG.productName}`).first();
    
    if (await productCard.isVisible()) {
      // Cliquer sur le menu options
      await productCard.locator('button[aria-label="Options"]').click();
      
      // Cliquer sur "Supprimer"
      await page.click('text=Supprimer');
      
      // Confirmer la suppression
      await page.click('button:has-text("Confirmer")');
      
      // Vérifier que le produit a été supprimé
      await expect(page.locator(`text=${TEST_CONFIG.productName}`)).not.toBeVisible({ timeout: 5000 });
    }
    
    await page.close();
  });
});

/**
 * TESTS UNITAIRES COMPLÉMENTAIRES
 */
test.describe('Validations et cas d\'erreur', () => {
  
  test('Empêcher achat sans connexion', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Trouver un produit digital
    await page.click('a[href*="/products/"]').first();
    
    // Essayer d'acheter sans être connecté
    await page.click('button:has-text("Acheter")');
    
    // Vérifier qu'un message d'erreur ou redirection vers login apparaît
    await expect(
      page.locator('text=/connexion|login|authentification/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('Empêcher téléchargement sans achat', async ({ page }) => {
    // Se connecter avec un utilisateur qui n'a pas acheté
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'no-purchase@test.com');
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    
    // Essayer d'accéder directement à un fichier (URL devinée)
    await page.goto('/download/some-product-id');
    
    // Vérifier qu'un message d'erreur apparaît
    await expect(
      page.locator('text=/accès refusé|non autorisé|access denied/i')
    ).toBeVisible();
  });

  test('Licence valide après génération', async ({ page }) => {
    // Ce test vérifierait la validité de la licence
    // Format attendu: XXXX-XXXX-XXXX-XXXX
    
    await page.goto('/dashboard/my-licenses');
    
    // Récupérer une clé de licence
    const licenseKey = await page.locator('[data-testid="license-key"]').first().textContent();
    
    // Vérifier le format
    expect(licenseKey).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });
});

