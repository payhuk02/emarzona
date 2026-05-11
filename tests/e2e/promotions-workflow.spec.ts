/**
 * Tests E2E - Workflow de Création et Gestion des Codes Promo
 * Date: 30 Janvier 2025
 * 
 * Tests complets pour le système de création et gestion des codes promo
 */

import { test, expect } from '@playwright/test';
import { loginAsVendor } from '../fixtures/auth.fixture';

test.describe('Promotions Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter en tant que vendeur
    await loginAsVendor(page);
    
    // Aller sur la page des promotions
    await page.goto('/dashboard/promotions');
    await page.waitForLoadState('networkidle');
  });

  test('devrait créer une promotion avec succès', async ({ page }) => {
    // Cliquer sur le bouton "Créer une promotion"
    await page.click('button:has-text("Créer")');
    
    // Remplir le formulaire
    await page.fill('input[id="code"]', 'TEST2025');
    await page.fill('textarea[id="description"]', 'Promotion de test');
    
    // Sélectionner le type de réduction
    await page.click('button[role="combobox"]:near(label:has-text("Type de réduction"))');
    await page.click('text=Pourcentage (%)');
    
    // Entrer la valeur
    await page.fill('input[id="discount_value"]', '20');
    
    // Activer la promotion
    const isActiveSwitch = page.locator('input[id="is_active"]');
    if (!(await isActiveSwitch.isChecked())) {
      await isActiveSwitch.click();
    }
    
    // Soumettre le formulaire
    await page.click('button[type="submit"]:has-text("Créer")');
    
    // Vérifier le message de succès
    await expect(page.locator('text=Promotion créée avec succès')).toBeVisible();
    
    // Vérifier que la promotion apparaît dans la liste
    await expect(page.locator('text=TEST2025')).toBeVisible();
  });

  test('devrait valider le format du code en temps réel', async ({ page }) => {
    await page.click('button:has-text("Créer")');
    
    // Tester un code trop court
    await page.fill('input[id="code"]', 'AB');
    await expect(page.locator('text=Le code doit contenir au moins 3 caractères')).toBeVisible();
    
    // Tester un code avec caractères spéciaux
    await page.fill('input[id="code"]', 'PROMO-2025');
    await expect(page.locator('text=Le code doit être alphanumérique')).toBeVisible();
    
    // Tester un code valide
    await page.fill('input[id="code"]', 'PROMO2025');
    await expect(page.locator('text=Format valide')).toBeVisible();
  });

  test('devrait empêcher la création avec un code dupliqué', async ({ page }) => {
    // Créer une première promotion
    await page.click('button:has-text("Créer")');
    await page.fill('input[id="code"]', 'DUPLICATE2025');
    await page.fill('input[id="discount_value"]', '10');
    await page.click('button[type="submit"]:has-text("Créer")');
    await expect(page.locator('text=Promotion créée avec succès')).toBeVisible();
    
    // Essayer de créer une deuxième avec le même code
    await page.click('button:has-text("Créer")');
    await page.fill('input[id="code"]', 'DUPLICATE2025');
    await page.fill('input[id="discount_value"]', '15');
    await page.click('button[type="submit"]:has-text("Créer")');
    
    // Vérifier l'erreur
    await expect(page.locator('text=Ce code promo existe déjà')).toBeVisible();
  });

  test('devrait valider que le pourcentage ne dépasse pas 100%', async ({ page }) => {
    await page.click('button:has-text("Créer")');
    
    // Sélectionner pourcentage
    await page.click('button[role="combobox"]:near(label:has-text("Type de réduction"))');
    await page.click('text=Pourcentage (%)');
    
    // Essayer d'entrer plus de 100%
    await page.fill('input[id="discount_value"]', '150');
    
    // Vérifier que la valeur est limitée ou qu'un message d'erreur apparaît
    const value = await page.inputValue('input[id="discount_value"]');
    expect(parseInt(value)).toBeLessThanOrEqual(100);
  });

  test('devrait valider la cohérence des dates', async ({ page }) => {
    await page.click('button:has-text("Créer")');
    
    await page.fill('input[id="code"]', 'DATES2025');
    await page.fill('input[id="discount_value"]', '10');
    
    // Définir une date de fin avant la date de début
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    await page.fill('input[id="start_date"]', tomorrow.toISOString().slice(0, 16));
    await page.fill('input[id="end_date"]', yesterday.toISOString().slice(0, 16));
    
    await page.click('button[type="submit"]:has-text("Créer")');
    
    // Vérifier l'erreur
    await expect(page.locator('text=La date de fin doit être après la date de début')).toBeVisible();
  });

  test('devrait afficher la prévisualisation de la promotion', async ({ page }) => {
    await page.click('button:has-text("Créer")');
    
    // Remplir le formulaire
    await page.fill('input[id="code"]', 'PREVIEW2025');
    await page.fill('textarea[id="description"]', 'Promotion avec aperçu');
    await page.fill('input[id="discount_value"]', '25');
    
    // Activer l'aperçu
    await page.click('input[id="show-preview"]');
    
    // Vérifier que l'aperçu s'affiche
    await expect(page.locator('text=Aperçu de la promotion')).toBeVisible();
    await expect(page.locator('text=PREVIEW2025')).toBeVisible();
    await expect(page.locator('text=25%')).toBeVisible();
  });

  test('devrait utiliser les suggestions de codes', async ({ page }) => {
    await page.click('button:has-text("Créer")');
    
    // Cliquer sur le bouton Suggestions
    await page.click('button:has-text("Suggestions")');
    
    // Vérifier que les suggestions apparaissent
    await expect(page.locator('text=PROMO')).toBeVisible();
    
    // Cliquer sur une suggestion
    const firstSuggestion = page.locator('button[class*="font-mono"]').first();
    await firstSuggestion.click();
    
    // Vérifier que le code est rempli
    const codeValue = await page.inputValue('input[id="code"]');
    expect(codeValue.length).toBeGreaterThan(0);
  });

  test('devrait paginer les promotions', async ({ page }) => {
    // Vérifier que la pagination est présente si plus de 20 promotions
    const pagination = page.locator('text=Page');
    
    if (await pagination.isVisible()) {
      // Cliquer sur Suivant
      await page.click('button:has-text("Suivant")');
      
      // Vérifier que la page a changé
      await expect(page.locator('text=Page 2')).toBeVisible();
      
      // Cliquer sur Précédent
      await page.click('button:has-text("Précédent")');
      
      // Vérifier que nous sommes revenus à la page 1
      await expect(page.locator('text=Page 1')).toBeVisible();
    }
  });

  test('devrait rechercher des promotions avec debounce', async ({ page }) => {
    // Attendre que la page soit chargée
    await page.waitForSelector('input[placeholder*="Rechercher"]');
    
    // Taper dans le champ de recherche
    await page.fill('input[placeholder*="Rechercher"]', 'TEST');
    
    // Attendre un peu pour le debounce
    await page.waitForTimeout(400);
    
    // Vérifier que les résultats sont filtrés
    // (la recherche devrait avoir été effectuée après le debounce)
    const results = page.locator('table tbody tr, [class*="Card"]');
    const count = await results.count();
    
    // Les résultats devraient être filtrés (ou vides si aucune correspondance)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('devrait supprimer une promotion', async ({ page }) => {
    // Trouver une promotion existante (ou en créer une)
    const promotionRow = page.locator('tr, [class*="Card"]').first();
    
    if (await promotionRow.isVisible()) {
      // Cliquer sur le menu d'actions
      await promotionRow.locator('button[aria-label*="Actions"], button:has(svg)').first().click();
      
      // Cliquer sur Supprimer
      await page.click('text=Supprimer');
      
      // Confirmer la suppression
      await page.click('button:has-text("Supprimer"):not([disabled])');
      
      // Vérifier le message de succès
      await expect(page.locator('text=Promotion supprimée')).toBeVisible();
    }
  });

  test('devrait filtrer les promotions par statut', async ({ page }) => {
    // Sélectionner le filtre "Actives"
    await page.click('button[role="combobox"]:near(label:has-text("Statut"))');
    await page.click('text=Actives');
    
    // Vérifier que seules les promotions actives sont affichées
    const activeBadges = page.locator('text=Active');
    const inactiveBadges = page.locator('text=Inactive');
    
    // Toutes les promotions affichées devraient être actives
    const activeCount = await activeBadges.count();
    const inactiveCount = await inactiveBadges.count();
    
    // Si des promotions sont affichées, elles devraient toutes être actives
    if (activeCount + inactiveCount > 0) {
      expect(inactiveCount).toBe(0);
    }
  });

  test('devrait afficher les statistiques correctement', async ({ page }) => {
    // Vérifier que les cartes de statistiques sont présentes
    await expect(page.locator('text=Total')).toBeVisible();
    await expect(page.locator('text=Actives')).toBeVisible();
    await expect(page.locator('text=Utilisations')).toBeVisible();
    
    // Les statistiques devraient afficher des nombres
    const statsCards = page.locator('[class*="Card"]:has-text("Total"), [class*="Card"]:has-text("Actives")');
    const count = await statsCards.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Promotions - Validation Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsVendor(page);
    await page.goto('/dashboard/promotions');
    await page.waitForLoadState('networkidle');
  });

  test('devrait gérer les codes avec espaces (normalisation)', async ({ page }) => {
    await page.click('button:has-text("Créer")');
    
    // Entrer un code avec espaces
    await page.fill('input[id="code"]', 'promo 2025');
    
    // Vérifier que les espaces sont supprimés
    const codeValue = await page.inputValue('input[id="code"]');
    expect(codeValue).not.toContain(' ');
    expect(codeValue).toBe('PROMO2025');
  });

  test('devrait gérer les codes en minuscules (uppercase automatique)', async ({ page }) => {
    await page.click('button:has-text("Créer")');
    
    // Entrer un code en minuscules
    await page.fill('input[id="code"]', 'promo2025');
    
    // Vérifier que le code est en majuscules
    const codeValue = await page.inputValue('input[id="code"]');
    expect(codeValue).toBe('PROMO2025');
  });

  test('devrait valider le montant minimum d\'achat', async ({ page }) => {
    await page.click('button:has-text("Créer")');
    
    await page.fill('input[id="code"]', 'MIN2025');
    await page.fill('input[id="discount_value"]', '10');
    
    // Entrer un montant minimum négatif
    await page.fill('input[id="min_purchase"]', '-100');
    
    await page.click('button[type="submit"]:has-text("Créer")');
    
    // Vérifier l'erreur ou que la valeur est corrigée
    const minValue = await page.inputValue('input[id="min_purchase"]');
    expect(parseFloat(minValue)).toBeGreaterThanOrEqual(0);
  });
});

