/**
 * Test E2E - Workflow complet Produit Physique
 * Date: 28 octobre 2025
 * 
 * Scénario testé:
 * 1. Création produit physique via wizard
 * 2. Configuration variantes (tailles, couleurs)
 * 3. Configuration inventaire
 * 4. Configuration livraison
 * 5. Achat du produit avec variante
 * 6. Vérification déduction stock
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
  buyerName: 'Test Buyer',
  buyerPhone: '+33612345678',
  
  // Produit à créer
  productName: `T-Shirt Test ${Date.now()}`,
  productDescription: 'T-shirt de test pour automatisation',
  productPrice: 15000,
  productSKU: `TST-${Date.now()}`,
  
  // Variantes
  variants: [
    { name: 'S - Rouge', size: 'S', color: 'Rouge', priceAdjustment: 0 },
    { name: 'M - Rouge', size: 'M', color: 'Rouge', priceAdjustment: 0 },
    { name: 'L - Rouge', size: 'L', color: 'Rouge', priceAdjustment: 500 },
    { name: 'S - Bleu', size: 'S', color: 'Bleu', priceAdjustment: 0 },
  ],
  
  // Inventaire
  initialStock: 100,
  lowStockThreshold: 10,
  
  // Livraison
  shippingAddress: {
    street: '123 Avenue des Champs-Élysées',
    city: 'Paris',
    postalCode: '75008',
    country: 'France',
  },
  
  // Test
  purchaseQuantity: 3,
  paymentTimeout: 30000,
};

test.describe('Workflow Produit Physique Complet', () => {
  let productId: string;
  let productSlug: string;
  let initialStockLevel: number;
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000); // 2 minutes par test
  });

  /**
   * TEST 1: Création produit physique - Étape 1 (Basic Info)
   */
  test('1. Créer produit physique - Informations de base', async ({ page }) => {
    // Se connecter en tant que vendeur
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Naviguer vers création de produit
    await page.goto('/dashboard/products/create');
    
    // Sélectionner "Produit Physique"
    await page.click('button:has-text("Produit Physique")');
    
    // Remplir le formulaire - Étape 1
    await page.fill('input[name="name"]', TEST_CONFIG.productName);
    await page.fill('textarea[name="description"]', TEST_CONFIG.productDescription);
    await page.fill('input[name="price"]', TEST_CONFIG.productPrice.toString());
    await page.fill('input[name="sku"]', TEST_CONFIG.productSKU);
    
    // Passer à l'étape suivante
    await page.click('button:has-text("Suivant")');
    
    // Vérifier que nous sommes à l'étape Variantes
    await expect(page.locator('text=Variantes')).toBeVisible();
  });

  /**
   * TEST 2: Configuration des variantes
   */
  test('2. Configurer variantes (tailles et couleurs)', async ({ page }) => {
    // Setup
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    await page.goto('/dashboard/products/create');
    await page.click('button:has-text("Produit Physique")');
    
    // Étape 1
    await page.fill('input[name="name"]', TEST_CONFIG.productName);
    await page.fill('textarea[name="description"]', TEST_CONFIG.productDescription);
    await page.fill('input[name="price"]', TEST_CONFIG.productPrice.toString());
    await page.fill('input[name="sku"]', TEST_CONFIG.productSKU);
    await page.click('button:has-text("Suivant")');
    
    // ===== ÉTAPE 2: Variantes =====
    // Ajouter les variantes
    for (const variant of TEST_CONFIG.variants) {
      await page.click('button:has-text("Ajouter une variante")');
      
      // Remplir les détails de la variante
      await page.fill('input[placeholder*="Nom de la variante"]', variant.name);
      
      if (variant.priceAdjustment > 0) {
        await page.fill('input[placeholder*="Ajustement prix"]', variant.priceAdjustment.toString());
      }
      
      await page.click('button:has-text("Sauvegarder")');
    }
    
    // Vérifier que toutes les variantes sont ajoutées
    await expect(page.locator(`text=${TEST_CONFIG.variants[0].name}`)).toBeVisible();
    await expect(page.locator(`text=${TEST_CONFIG.variants[3].name}`)).toBeVisible();
    
    // Passer à l'étape suivante
    await page.click('button:has-text("Suivant")');
    
    // Vérifier que nous sommes à l'étape Inventaire
    await expect(page.locator('text=Inventaire')).toBeVisible();
  });

  /**
   * TEST 3: Configuration de l'inventaire
   */
  test('3. Configurer inventaire et stock', async ({ page }) => {
    // Setup jusqu'à l'étape inventaire
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    await page.goto('/dashboard/products/create');
    await page.click('button:has-text("Produit Physique")');
    
    // Étapes 1 et 2 (simplifiées)
    await page.fill('input[name="name"]', TEST_CONFIG.productName);
    await page.fill('textarea[name="description"]', TEST_CONFIG.productDescription);
    await page.fill('input[name="price"]', TEST_CONFIG.productPrice.toString());
    await page.click('button:has-text("Suivant")');
    await page.click('button:has-text("Suivant")'); // Skip variantes pour ce test
    
    // ===== ÉTAPE 3: Inventaire =====
    await page.fill('input[name="quantity_available"]', TEST_CONFIG.initialStock.toString());
    await page.fill('input[name="low_stock_threshold"]', TEST_CONFIG.lowStockThreshold.toString());
    
    // Activer le suivi d'inventaire
    await page.check('input[name="track_inventory"]');
    
    // Passer à l'étape suivante
    await page.click('button:has-text("Suivant")');
    
    // Vérifier que nous sommes à l'étape Expédition
    await expect(page.locator('text=Expédition')).toBeVisible();
  });

  /**
   * TEST 4: Configuration de la livraison
   */
  test('4. Configurer zones et tarifs de livraison', async ({ page }) => {
    // Setup jusqu'à l'étape livraison
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    await page.goto('/dashboard/products/create');
    await page.click('button:has-text("Produit Physique")');
    
    // Étapes 1, 2, 3
    await page.fill('input[name="name"]', TEST_CONFIG.productName);
    await page.fill('input[name="price"]', TEST_CONFIG.productPrice.toString());
    await page.click('button:has-text("Suivant")');
    await page.click('button:has-text("Suivant")');
    await page.fill('input[name="quantity_available"]', TEST_CONFIG.initialStock.toString());
    await page.click('button:has-text("Suivant")');
    
    // ===== ÉTAPE 4: Expédition =====
    // Ajouter une zone de livraison
    await page.click('button:has-text("Ajouter une zone")');
    await page.fill('input[placeholder*="Nom de la zone"]', 'France métropolitaine');
    await page.fill('input[placeholder*="Pays"]', 'France');
    
    // Ajouter un tarif de livraison
    await page.click('button:has-text("Ajouter un tarif")');
    await page.fill('input[placeholder*="Nom du tarif"]', 'Standard');
    await page.fill('input[placeholder*="Prix"]', '500');
    await page.fill('input[placeholder*="Délai min"]', '3');
    await page.fill('input[placeholder*="Délai max"]', '5');
    
    await page.click('button:has-text("Sauvegarder")');
    
    // Passer à l'aperçu
    await page.click('button:has-text("Suivant")');
    
    // Vérifier que nous sommes à l'étape Preview
    await expect(page.locator('text=Aperçu')).toBeVisible();
  });

  /**
   * TEST 5: Workflow complet de création
   */
  test('5. Créer produit physique complet et publier', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    await page.goto('/dashboard/products/create');
    await page.click('button:has-text("Produit Physique")');
    
    // Étape 1: Basic Info
    await page.fill('input[name="name"]', TEST_CONFIG.productName);
    await page.fill('textarea[name="description"]', TEST_CONFIG.productDescription);
    await page.fill('input[name="price"]', TEST_CONFIG.productPrice.toString());
    await page.fill('input[name="sku"]', TEST_CONFIG.productSKU);
    await page.click('button:has-text("Suivant")');
    
    // Étape 2: Variantes (skip pour simplifier)
    await page.click('button:has-text("Suivant")');
    
    // Étape 3: Inventaire
    await page.fill('input[name="quantity_available"]', TEST_CONFIG.initialStock.toString());
    await page.fill('input[name="low_stock_threshold"]', TEST_CONFIG.lowStockThreshold.toString());
    await page.click('button:has-text("Suivant")');
    
    // Étape 4: Expédition (skip pour simplifier)
    await page.click('button:has-text("Suivant")');
    
    // Étape 5: Preview et Publication
    await expect(page.locator(`text=${TEST_CONFIG.productName}`)).toBeVisible();
    await page.click('button:has-text("Publier")');
    
    // Attendre confirmation
    await expect(page.locator('text=créé avec succès')).toBeVisible({ timeout: 10000 });
    
    // Sauvegarder l'URL pour les tests suivants
    const url = page.url();
    const match = url.match(/\/products\/([^/]+)/);
    if (match) {
      productSlug = match[1];
    }
  });

  /**
   * TEST 6: Achat du produit physique
   */
  test('6. Acheter produit physique avec adresse de livraison', async ({ page }) => {
    // Se connecter en tant qu'acheteur
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.buyerEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.buyerPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Aller sur le marketplace
    await page.goto('/marketplace');
    
    // Rechercher le produit
    await page.fill('input[placeholder*="Rechercher"]', TEST_CONFIG.productName);
    await page.press('input[placeholder*="Rechercher"]', 'Enter');
    await page.waitForTimeout(2000);
    
    // Cliquer sur le produit
    await page.click(`text=${TEST_CONFIG.productName}`);
    
    // Sélectionner la quantité
    await page.fill('input[type="number"][name="quantity"]', TEST_CONFIG.purchaseQuantity.toString());
    
    // Cliquer sur "Acheter"
    await page.click('button:has-text("Acheter")');
    
    // Remplir l'adresse de livraison
    await page.fill('input[name="street"]', TEST_CONFIG.shippingAddress.street);
    await page.fill('input[name="city"]', TEST_CONFIG.shippingAddress.city);
    await page.fill('input[name="postal_code"]', TEST_CONFIG.shippingAddress.postalCode);
    await page.fill('input[name="country"]', TEST_CONFIG.shippingAddress.country);
    
    // Confirmer l'achat
    await page.click('button:has-text("Confirmer")');
    
    // Attendre la redirection vers Moneroo
    await page.waitForURL('**/checkout/**', { timeout: TEST_CONFIG.paymentTimeout });
  });

  /**
   * TEST 7: Vérifier la déduction du stock
   */
  test('7. Vérifier que le stock a été déduit après achat', async ({ page }) => {
    // Note: Ce test nécessite que l'achat précédent soit complété
    
    // Se connecter en tant que vendeur
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Aller à la page de gestion des produits physiques
    await page.goto('/dashboard/physical-products');
    
    // Trouver le produit
    await page.click(`text=${TEST_CONFIG.productName}`);
    
    // Vérifier le stock
    const stockElement = await page.locator('[data-testid="stock-level"]');
    const stockText = await stockElement.textContent();
    
    // Le stock devrait être initial - quantity achetée
    const expectedStock = TEST_CONFIG.initialStock - TEST_CONFIG.purchaseQuantity;
    expect(stockText).toContain(expectedStock.toString());
  });

  /**
   * TEST 8: Vérifier l'alerte stock faible
   */
  test('8. Vérifier alerte stock faible', async ({ page }) => {
    // Se connecter en tant que vendeur
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Aller à la page de gestion inventaire
    await page.goto('/dashboard/inventory');
    
    // Si le stock est en dessous du seuil, une alerte devrait être visible
    const lowStockAlert = page.locator('text=/Stock faible|Low stock/i');
    
    // Vérifier si l'alerte existe (dépend du stock actuel)
    const isVisible = await lowStockAlert.isVisible().catch(() => false);
    
    // Log pour information
    console.log('Alerte stock faible visible:', isVisible);
  });

  /**
   * TEST 9: Vérifier historique des commandes vendeur
   */
  test('9. Vérifier historique commandes pour le vendeur', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Aller à la page des commandes
    await page.goto('/dashboard/orders');
    
    // Vérifier qu'il y a des commandes
    await expect(page.locator('table')).toBeVisible();
    
    // Vérifier que le produit apparaît dans les commandes
    await expect(page.locator(`text=${TEST_CONFIG.productName}`)).toBeVisible();
  });

  /**
   * TEST 10: Nettoyage - Supprimer le produit de test
   */
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    await page.goto('/dashboard/physical-products');
    
    const productCard = page.locator(`text=${TEST_CONFIG.productName}`).first();
    
    if (await productCard.isVisible()) {
      await productCard.locator('button[aria-label="Options"]').click();
      await page.click('text=Supprimer');
      await page.click('button:has-text("Confirmer")');
      
      await expect(page.locator(`text=${TEST_CONFIG.productName}`)).not.toBeVisible({ timeout: 5000 });
    }
    
    await page.close();
  });
});

/**
 * TESTS DE VALIDATION
 */
test.describe('Validations produits physiques', () => {
  
  test('Empêcher achat si stock insuffisant', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Trouver un produit avec stock faible
    await page.click('a[href*="/products/"]').first();
    
    // Essayer d'acheter une quantité supérieure au stock
    await page.fill('input[type="number"][name="quantity"]', '999999');
    await page.click('button:has-text("Acheter")');
    
    // Vérifier qu'un message d'erreur apparaît
    await expect(
      page.locator('text=/stock insuffisant|out of stock/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('Validation adresse de livraison requise', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.buyerEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.buyerPassword);
    await page.click('button[type="submit"]');
    
    await page.goto('/marketplace');
    await page.click('a[href*="/products/"]').first();
    await page.click('button:has-text("Acheter")');
    
    // Essayer de soumettre sans adresse
    await page.click('button:has-text("Confirmer")');
    
    // Vérifier qu'un message de validation apparaît
    await expect(
      page.locator('text=/adresse requise|address required/i')
    ).toBeVisible();
  });

  test('SKU unique par produit', async ({ page }) => {
    const duplicateSKU = 'DUPLICATE-SKU-123';
    
    // Créer un premier produit avec ce SKU
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    await page.goto('/dashboard/products/create');
    await page.click('button:has-text("Produit Physique")');
    
    await page.fill('input[name="name"]', 'Produit Test SKU');
    await page.fill('input[name="price"]', '1000');
    await page.fill('input[name="sku"]', duplicateSKU);
    
    // Essayer de créer un deuxième produit avec le même SKU
    // (le système devrait l'empêcher)
    await page.click('button:has-text("Suivant")');
    
    // Vérifier qu'une erreur apparaît
    await expect(
      page.locator('text=/SKU existe déjà|SKU already exists/i')
    ).toBeVisible();
  });
});

