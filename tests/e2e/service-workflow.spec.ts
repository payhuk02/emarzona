/**
 * Test E2E - Workflow complet Service
 * Date: 28 octobre 2025
 * 
 * Scénario testé:
 * 1. Création service via wizard
 * 2. Configuration durée et disponibilités
 * 3. Configuration staff et ressources
 * 4. Configuration tarification
 * 5. Réservation d'un créneau
 * 6. Achat de la réservation
 * 7. Vérification booking créé
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
  
  // Utilisateur client
  clientEmail: 'client-test@payhuk.com',
  clientPassword: 'TestPassword123!',
  clientName: 'Test Client',
  clientPhone: '+33612345678',
  
  // Service à créer
  serviceName: `Consultation Test ${Date.now()}`,
  serviceDescription: 'Service de consultation pour tests automatisés',
  servicePrice: 25000,
  serviceDuration: 60, // minutes
  serviceType: 'consultation',
  
  // Staff
  staffName: 'Dr. Test',
  staffRole: 'Consultant',
  staffEmail: 'staff-test@payhuk.com',
  
  // Disponibilités
  availabilitySlots: [
    { day: 1, startTime: '09:00', endTime: '12:00' }, // Lundi matin
    { day: 1, startTime: '14:00', endTime: '18:00' }, // Lundi après-midi
    { day: 3, startTime: '09:00', endTime: '17:00' }, // Mercredi
  ],
  
  // Réservation
  bookingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
  numberOfParticipants: 2,
  bookingNotes: 'Première consultation - Urgente',
  
  // Test
  paymentTimeout: 30000,
};

test.describe('Workflow Service Complet', () => {
  let serviceId: string;
  let serviceSlug: string;
  let bookingId: string;
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000); // 2 minutes par test
  });

  /**
   * TEST 1: Création service - Étape 1 (Basic Info)
   */
  test('1. Créer service - Informations de base', async ({ page }) => {
    // Se connecter en tant que vendeur
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Naviguer vers création de service
    await page.goto('/dashboard/products/create');
    
    // Sélectionner "Service"
    await page.click('button:has-text("Service")');
    
    // Remplir le formulaire - Étape 1
    await page.selectOption('select[name="service_type"]', TEST_CONFIG.serviceType);
    await page.fill('input[name="name"]', TEST_CONFIG.serviceName);
    await page.fill('textarea[name="description"]', TEST_CONFIG.serviceDescription);
    await page.fill('input[name="price"]', TEST_CONFIG.servicePrice.toString());
    
    // Passer à l'étape suivante
    await page.click('button:has-text("Suivant")');
    
    // Vérifier que nous sommes à l'étape Durée & Disponibilité
    await expect(page.locator('text=Durée & Disponibilité')).toBeVisible();
  });

  /**
   * TEST 2: Configuration durée et disponibilité
   */
  test('2. Configurer durée et créneaux de disponibilité', async ({ page }) => {
    // Setup
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    await page.goto('/dashboard/products/create');
    await page.click('button:has-text("Service")');
    
    // Étape 1
    await page.selectOption('select[name="service_type"]', TEST_CONFIG.serviceType);
    await page.fill('input[name="name"]', TEST_CONFIG.serviceName);
    await page.fill('textarea[name="description"]', TEST_CONFIG.serviceDescription);
    await page.fill('input[name="price"]', TEST_CONFIG.servicePrice.toString());
    await page.click('button:has-text("Suivant")');
    
    // ===== ÉTAPE 2: Durée & Disponibilité =====
    await page.fill('input[name="duration_minutes"]', TEST_CONFIG.serviceDuration.toString());
    
    // Ajouter des créneaux de disponibilité
    for (const slot of TEST_CONFIG.availabilitySlots) {
      await page.click('button:has-text("Ajouter un créneau")');
      
      // Sélectionner le jour de la semaine
      await page.selectOption('select[name="day_of_week"]', slot.day.toString());
      await page.fill('input[name="start_time"]', slot.startTime);
      await page.fill('input[name="end_time"]', slot.endTime);
      
      await page.click('button:has-text("Sauvegarder créneau")');
    }
    
    // Vérifier que les créneaux sont ajoutés
    await expect(page.locator(`text=${TEST_CONFIG.availabilitySlots[0].startTime}`)).toBeVisible();
    
    // Passer à l'étape suivante
    await page.click('button:has-text("Suivant")');
    
    // Vérifier que nous sommes à l'étape Personnel & Ressources
    await expect(page.locator('text=Personnel & Ressources')).toBeVisible();
  });

  /**
   * TEST 3: Configuration du personnel
   */
  test('3. Configurer staff et ressources', async ({ page }) => {
    // Setup jusqu'à l'étape personnel
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    await page.goto('/dashboard/products/create');
    await page.click('button:has-text("Service")');
    
    // Étapes 1 et 2 (simplifiées)
    await page.fill('input[name="name"]', TEST_CONFIG.serviceName);
    await page.fill('input[name="price"]', TEST_CONFIG.servicePrice.toString());
    await page.click('button:has-text("Suivant")');
    await page.fill('input[name="duration_minutes"]', TEST_CONFIG.serviceDuration.toString());
    await page.click('button:has-text("Suivant")');
    
    // ===== ÉTAPE 3: Personnel & Ressources =====
    // Ajouter un membre du personnel
    await page.click('button:has-text("Ajouter un membre")');
    await page.fill('input[name="staff_name"]', TEST_CONFIG.staffName);
    await page.fill('input[name="staff_role"]', TEST_CONFIG.staffRole);
    await page.fill('input[name="staff_email"]', TEST_CONFIG.staffEmail);
    await page.click('button:has-text("Sauvegarder membre")');
    
    // Vérifier que le staff est ajouté
    await expect(page.locator(`text=${TEST_CONFIG.staffName}`)).toBeVisible();
    
    // Passer à l'étape suivante
    await page.click('button:has-text("Suivant")');
    
    // Vérifier que nous sommes à l'étape Tarification
    await expect(page.locator('text=Tarification & Options')).toBeVisible();
  });

  /**
   * TEST 4: Configuration de la tarification
   */
  test('4. Configurer tarification et options', async ({ page }) => {
    // Setup jusqu'à l'étape tarification
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    await page.goto('/dashboard/products/create');
    await page.click('button:has-text("Service")');
    
    // Étapes 1, 2, 3
    await page.fill('input[name="name"]', TEST_CONFIG.serviceName);
    await page.fill('input[name="price"]', TEST_CONFIG.servicePrice.toString());
    await page.click('button:has-text("Suivant")');
    await page.fill('input[name="duration_minutes"]', TEST_CONFIG.serviceDuration.toString());
    await page.click('button:has-text("Suivant")');
    await page.click('button:has-text("Suivant")'); // Skip staff pour ce test
    
    // ===== ÉTAPE 4: Tarification =====
    // Sélectionner le type de tarification
    await page.selectOption('select[name="pricing_type"]', 'fixed');
    
    // Configurer l'acompte (optionnel)
    await page.check('input[name="deposit_required"]');
    await page.fill('input[name="deposit_amount"]', '5000');
    
    // Configurer les options d'annulation
    await page.check('input[name="allow_booking_cancellation"]');
    await page.fill('input[name="cancellation_deadline_hours"]', '24');
    
    // Passer à l'aperçu
    await page.click('button:has-text("Suivant")');
    
    // Vérifier que nous sommes à l'étape Preview
    await expect(page.locator('text=Aperçu & Validation')).toBeVisible();
  });

  /**
   * TEST 5: Workflow complet de création et publication
   */
  test('5. Créer service complet et publier', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    await page.goto('/dashboard/products/create');
    await page.click('button:has-text("Service")');
    
    // Étape 1: Basic Info
    await page.selectOption('select[name="service_type"]', TEST_CONFIG.serviceType);
    await page.fill('input[name="name"]', TEST_CONFIG.serviceName);
    await page.fill('textarea[name="description"]', TEST_CONFIG.serviceDescription);
    await page.fill('input[name="price"]', TEST_CONFIG.servicePrice.toString());
    await page.click('button:has-text("Suivant")');
    
    // Étape 2: Durée & Disponibilité
    await page.fill('input[name="duration_minutes"]', TEST_CONFIG.serviceDuration.toString());
    await page.click('button:has-text("Suivant")');
    
    // Étape 3: Personnel (skip pour simplifier)
    await page.click('button:has-text("Suivant")');
    
    // Étape 4: Tarification (skip pour simplifier)
    await page.click('button:has-text("Suivant")');
    
    // Étape 5: Preview et Publication
    await expect(page.locator(`text=${TEST_CONFIG.serviceName}`)).toBeVisible();
    await page.click('button:has-text("Publier")');
    
    // Attendre confirmation
    await expect(page.locator('text=/publié|créé avec succès/i')).toBeVisible({ timeout: 10000 });
    
    // Sauvegarder l'URL pour les tests suivants
    const url = page.url();
    const match = url.match(/\/products\/([^/]+)/);
    if (match) {
      serviceSlug = match[1];
    }
  });

  /**
   * TEST 6: Réserver un créneau
   */
  test('6. Réserver un créneau pour le service', async ({ page }) => {
    // Se connecter en tant que client
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.clientEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.clientPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Aller sur le marketplace
    await page.goto('/marketplace');
    
    // Rechercher le service
    await page.fill('input[placeholder*="Rechercher"]', TEST_CONFIG.serviceName);
    await page.press('input[placeholder*="Rechercher"]', 'Enter');
    await page.waitForTimeout(2000);
    
    // Cliquer sur le service
    await page.click(`text=${TEST_CONFIG.serviceName}`);
    
    // Vérifier que nous sommes sur la page du service
    await expect(page.locator('h1')).toContainText(TEST_CONFIG.serviceName);
    
    // Sélectionner une date (calendrier)
    // Note: L'implémentation exacte dépend de votre composant calendrier
    const formattedDate = TEST_CONFIG.bookingDate.toISOString().split('T')[0];
    await page.fill('input[type="date"]', formattedDate);
    
    // Sélectionner un créneau horaire
    await page.click('button:has-text("09:00")'); // Premier créneau disponible
    
    // Sélectionner le nombre de participants
    await page.fill('input[name="numberOfParticipants"]', TEST_CONFIG.numberOfParticipants.toString());
    
    // Ajouter des notes
    await page.fill('textarea[name="notes"]', TEST_CONFIG.bookingNotes);
    
    // Cliquer sur "Réserver"
    await page.click('button:has-text("Réserver")');
    
    // Attendre la redirection vers Moneroo
    await page.waitForURL('**/checkout/**', { timeout: TEST_CONFIG.paymentTimeout });
  });

  /**
   * TEST 7: Vérifier le booking créé
   */
  test('7. Vérifier booking créé après réservation', async ({ page }) => {
    // Note: Ce test nécessite que la réservation précédente soit complétée
    
    // Se connecter en tant que client
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.clientEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.clientPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Aller à la page "Mes Réservations"
    await page.goto('/dashboard/my-bookings');
    
    // Vérifier qu'une réservation existe pour ce service
    await expect(page.locator(`text=${TEST_CONFIG.serviceName}`)).toBeVisible();
    
    // Vérifier les détails de la réservation
    await expect(page.locator(`text=${TEST_CONFIG.numberOfParticipants}`)).toBeVisible();
    await expect(page.locator('text=/En attente|Confirmé/i')).toBeVisible();
  });

  /**
   * TEST 8: Vérifier calendrier vendeur
   */
  test('8. Vérifier calendrier du vendeur avec les réservations', async ({ page }) => {
    // Se connecter en tant que vendeur
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Aller au calendrier des services
    await page.goto('/dashboard/services/calendar');
    
    // Vérifier que le service créé apparaît
    await expect(page.locator(`text=${TEST_CONFIG.serviceName}`)).toBeVisible();
    
    // Vérifier que les réservations sont visibles
    await expect(page.locator('text=/réservation|booking/i')).toBeVisible();
  });

  /**
   * TEST 9: Annuler une réservation
   */
  test('9. Annuler une réservation (si autorisé)', async ({ page }) => {
    // Se connecter en tant que client
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.clientEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.clientPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Aller à la page "Mes Réservations"
    await page.goto('/dashboard/my-bookings');
    
    // Trouver la réservation
    const bookingCard = page.locator(`text=${TEST_CONFIG.serviceName}`).first();
    
    if (await bookingCard.isVisible()) {
      // Cliquer sur "Annuler"
      await page.click('button:has-text("Annuler")');
      
      // Confirmer l'annulation
      await page.click('button:has-text("Confirmer")');
      
      // Vérifier que le statut a changé
      await expect(page.locator('text=Annulé')).toBeVisible({ timeout: 5000 });
    }
  });

  /**
   * TEST 10: Vérifier analytics pour le vendeur
   */
  test('10. Vérifier analytics service pour le vendeur', async ({ page }) => {
    // Se connecter en tant que vendeur
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    // Aller à la page de gestion des services
    await page.goto('/dashboard/services');
    
    // Vérifier que le service créé apparaît
    await expect(page.locator(`text=${TEST_CONFIG.serviceName}`)).toBeVisible();
    
    // Cliquer sur le service pour voir les détails
    await page.click(`text=${TEST_CONFIG.serviceName}`);
    
    // Vérifier que les statistiques sont affichées
    await expect(page.locator('text=Réservations')).toBeVisible();
    await expect(page.locator('text=/Chiffre d\'affaires|Revenus/i')).toBeVisible();
  });

  /**
   * Nettoyage - Supprimer le service de test
   */
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.vendorEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.vendorPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    
    await page.goto('/dashboard/services');
    
    const serviceCard = page.locator(`text=${TEST_CONFIG.serviceName}`).first();
    
    if (await serviceCard.isVisible()) {
      await serviceCard.locator('button[aria-label="Options"]').click();
      await page.click('text=Supprimer');
      await page.click('button:has-text("Confirmer")');
      
      await expect(page.locator(`text=${TEST_CONFIG.serviceName}`)).not.toBeVisible({ timeout: 5000 });
    }
    
    await page.close();
  });
});

/**
 * TESTS DE VALIDATION
 */
test.describe('Validations services', () => {
  
  test('Empêcher réservation sur créneau déjà pris', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Trouver un service
    await page.click('a[href*="/products/"]').first();
    
    // Essayer de réserver un créneau déjà réservé
    await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
    await page.click('button:has-text("09:00")');
    await page.click('button:has-text("Réserver")');
    
    // Si le créneau est pris, un message devrait apparaître
    await expect(
      page.locator('text=/créneau non disponible|slot unavailable/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('Validation nombre de participants max', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.clientEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.clientPassword);
    await page.click('button[type="submit"]');
    
    await page.goto('/marketplace');
    await page.click('a[href*="/products/"]').first();
    
    // Essayer de réserver avec trop de participants
    await page.fill('input[name="numberOfParticipants"]', '999');
    await page.click('button:has-text("Réserver")');
    
    // Vérifier qu'un message de validation apparaît
    await expect(
      page.locator('text=/nombre maximum|max participants/i')
    ).toBeVisible();
  });

  test('Vérifier délai d\'annulation respecté', async ({ page }) => {
    // Ce test vérifierait que l'annulation n'est pas possible
    // si le délai minimum n'est pas respecté
    
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_CONFIG.clientEmail);
    await page.fill('input[type="password"]', TEST_CONFIG.clientPassword);
    await page.click('button[type="submit"]');
    
    await page.goto('/dashboard/my-bookings');
    
    // Trouver une réservation proche (< 24h)
    // Le bouton "Annuler" devrait être désactivé ou absent
    const cancelButton = page.locator('button:has-text("Annuler")');
    
    if (await cancelButton.isVisible()) {
      const isDisabled = await cancelButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });
});

