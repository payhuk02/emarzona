/**
 * Tests d'intégration pour les calendriers externes
 * Date: 1 Février 2025
 * 
 * Tests E2E pour :
 * - Configuration d'intégrations calendriers
 * - Synchronisation avec Google Calendar
 * - Synchronisation avec Outlook
 * - Détection de conflits
 * - Gestion des erreurs
 */

import { test, expect } from '@playwright/test';

test.describe('Calendar Integrations', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter en tant que vendeur
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'vendor@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display calendar integrations page', async ({ page }) => {
    await page.goto('/dashboard/services/calendar-integrations');
    
    // Vérifier que la page s'affiche
    await expect(page.locator('text=Intégrations Calendriers Externes')).toBeVisible();
    await expect(page.locator('button:has-text("Nouvelle Intégration")')).toBeVisible();
  });

  test('should open create integration dialog', async ({ page }) => {
    await page.goto('/dashboard/services/calendar-integrations');
    
    // Cliquer sur "Nouvelle Intégration"
    await page.click('button:has-text("Nouvelle Intégration")');
    
    // Vérifier que le dialog s'ouvre
    await expect(page.locator('text=Nouvelle Intégration Calendrier')).toBeVisible();
  });

  test('should validate integration form', async ({ page }) => {
    await page.goto('/dashboard/services/calendar-integrations');
    await page.click('button:has-text("Nouvelle Intégration")');
    
    // Essayer de soumettre sans remplir
    await page.click('button[type="submit"]');
    
    // Vérifier les messages d'erreur
    await expect(page.locator('text=requis')).toBeVisible();
  });

  test('should create Google Calendar integration', async ({ page }) => {
    await page.goto('/dashboard/services/calendar-integrations');
    await page.click('button:has-text("Nouvelle Intégration")');
    
    // Remplir le formulaire
    await page.selectOption('select[name="calendar_type"]', 'google_calendar');
    await page.fill('input[name="calendar_id"]', 'primary');
    await page.fill('input[name="calendar_name"]', 'Mon Calendrier Google');
    
    // Configurer la synchronisation
    await page.check('input[name="auto_sync"]');
    await page.fill('input[name="sync_interval_minutes"]', '30');
    await page.selectOption('select[name="sync_direction"]', 'bidirectional');
    
    // Soumettre
    await page.click('button[type="submit"]');
    
    // Vérifier que l'intégration apparaît
    await expect(page.locator('text=Mon Calendrier Google')).toBeVisible();
    await expect(page.locator('text=Google Calendar')).toBeVisible();
  });

  test('should sync calendar manually', async ({ page }) => {
    await page.goto('/dashboard/services/calendar-integrations');
    
    // Attendre qu'une intégration existe
    const integrationRow = page.locator('table tbody tr').first();
    await integrationRow.waitFor();
    
    // Cliquer sur le bouton de synchronisation
    await integrationRow.locator('button:has-text("Synchroniser")').click();
    
    // Vérifier que la synchronisation démarre
    await expect(page.locator('text=Synchronisation en cours')).toBeVisible();
  });

  test('should display sync logs', async ({ page }) => {
    await page.goto('/dashboard/services/calendar-integrations');
    
    // Cliquer sur une intégration pour voir les détails
    const integrationRow = page.locator('table tbody tr').first();
    await integrationRow.click();
    
    // Aller à l'onglet "Logs"
    await page.click('button:has-text("Logs")');
    
    // Vérifier que les logs s'affichent
    await expect(page.locator('text=Historique de synchronisation')).toBeVisible();
  });

  test('should handle sync errors gracefully', async ({ page }) => {
    await page.goto('/dashboard/services/calendar-integrations');
    
    // Simuler une erreur de synchronisation
    // (nécessiterait un mock ou une configuration de test)
    
    // Vérifier que l'erreur s'affiche
    await expect(page.locator('text=Erreur')).toBeVisible();
  });

  test('should detect calendar conflicts', async ({ page }) => {
    await page.goto('/dashboard/services/calendar-integrations');
    
    // Créer une réservation qui entre en conflit avec le calendrier externe
    // (nécessiterait un setup de données de test)
    
    // Vérifier que le conflit est détecté
    await expect(page.locator('text=Conflit détecté')).toBeVisible();
  });

  test('should update integration settings', async ({ page }) => {
    await page.goto('/dashboard/services/calendar-integrations');
    
    // Cliquer sur le menu d'actions d'une intégration
    const integrationRow = page.locator('table tbody tr').first();
    await integrationRow.locator('button').last().click();
    
    // Cliquer sur "Modifier"
    await page.click('text=Modifier');
    
    // Modifier les paramètres
    await page.fill('input[name="sync_interval_minutes"]', '60');
    
    // Sauvegarder
    await page.click('button:has-text("Sauvegarder")');
    
    // Vérifier que les changements sont sauvegardés
    await expect(page.locator('text=60 minutes')).toBeVisible();
  });

  test('should delete integration', async ({ page }) => {
    await page.goto('/dashboard/services/calendar-integrations');
    
    // Cliquer sur le menu d'actions
    const integrationRow = page.locator('table tbody tr').first();
    await integrationRow.locator('button').last().click();
    
    // Cliquer sur "Supprimer"
    await page.click('text=Supprimer');
    
    // Confirmer la suppression
    page.on('dialog', dialog => dialog.accept());
    
    // Vérifier que l'intégration a disparu
    await expect(integrationRow).not.toBeVisible();
  });
});

test.describe('Calendar Sync Functionality', () => {
  test('should import events from external calendar', async ({ page }) => {
    // Test pour vérifier que les événements sont importés depuis le calendrier externe
    // Nécessite un setup avec un calendrier de test
  });

  test('should export bookings to external calendar', async ({ page }) => {
    // Test pour vérifier que les réservations sont exportées vers le calendrier externe
  });

  test('should handle bidirectional sync', async ({ page }) => {
    // Test pour vérifier la synchronisation bidirectionnelle
  });
});

