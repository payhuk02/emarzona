import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { DownloadHistory, DownloadEvent } from './DownloadHistory';
import { BulkDigitalUpdate, BulkUpdateDigitalProduct } from './BulkDigitalUpdate';
import { logger } from '@/lib/logger';

/**
 * Données de démonstration - Événements de téléchargement
 */
const mockEvents: DownloadEvent[] = [
  // Aujourd'hui
  {
    id: 'evt-001',
    type: 'download_completed',
    timestamp: new Date(),
    productId: 'prod-001',
    productName: 'Ebook React Avancé',
    customerId: 'cust-001',
    customerName: 'Marie Dupont',
    customerEmail: 'marie@example.com',
    ipAddress: '192.168.1.1',
    location: 'Paris, France',
    device: 'Windows 11',
    browser: 'Chrome 118',
    fileSize: 25,
    duration: 45,
    status: 'success',
    message: 'Téléchargement réussi',
  },
  {
    id: 'evt-002',
    type: 'license_activated',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    productId: 'prod-002',
    productName: 'Template SaaS Pro',
    customerId: 'cust-002',
    customerName: 'Jean Martin',
    customerEmail: 'jean@example.com',
    ipAddress: '192.168.1.2',
    location: 'Lyon, France',
    device: 'macOS Sonoma',
    browser: 'Safari 17',
    status: 'success',
    message: 'Licence activée avec succès',
  },
  {
    id: 'evt-003',
    type: 'suspicious_activity',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    productId: 'prod-003',
    productName: 'Formation TypeScript',
    customerId: 'cust-003',
    customerName: 'Sophie Leblanc',
    customerEmail: 'sophie@example.com',
    ipAddress: '192.168.1.3',
    location: 'Inconnue',
    device: 'Linux',
    browser: 'Firefox 119',
    status: 'error',
    message: 'Tentative de téléchargement depuis 10 IP différentes',
  },
  {
    id: 'evt-004',
    type: 'download_started',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    productId: 'prod-004',
    productName: 'Plugin WordPress SEO',
    customerId: 'cust-004',
    customerName: 'Lucas Bernard',
    customerEmail: 'lucas@example.com',
    ipAddress: '192.168.1.4',
    location: 'Toulouse, France',
    status: 'success',
  },
  // Hier
  {
    id: 'evt-005',
    type: 'download_completed',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    productId: 'prod-001',
    productName: 'Ebook React Avancé',
    customerId: 'cust-005',
    customerName: 'Emma Rousseau',
    customerEmail: 'emma@example.com',
    ipAddress: '192.168.1.5',
    location: 'Marseille, France',
    fileSize: 25,
    duration: 38,
    status: 'success',
  },
  {
    id: 'evt-006',
    type: 'download_failed',
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000),
    productId: 'prod-002',
    productName: 'Template SaaS Pro',
    customerId: 'cust-006',
    customerName: 'Thomas Petit',
    customerEmail: 'thomas@example.com',
    ipAddress: '192.168.1.6',
    location: 'Nantes, France',
    status: 'error',
    message: 'Connexion interrompue',
  },
  {
    id: 'evt-007',
    type: 'license_revoked',
    timestamp: new Date(Date.now() - 28 * 60 * 60 * 1000),
    productId: 'prod-003',
    productName: 'Formation TypeScript',
    customerId: 'cust-007',
    customerName: 'Chloé Moreau',
    customerEmail: 'chloe@example.com',
    status: 'warning',
    message: 'Partage de licence détecté',
  },
  {
    id: 'evt-008',
    type: 'access_denied',
    timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000),
    productId: 'prod-005',
    productName: 'Thème Shopify Premium',
    customerId: 'cust-008',
    customerName: 'Alexandre Simon',
    customerEmail: 'alex@example.com',
    status: 'error',
    message: 'Limite de téléchargements atteinte',
  },
  // Il y a 3 jours
  {
    id: 'evt-009',
    type: 'download_completed',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    productId: 'prod-005',
    productName: 'Thème Shopify Premium',
    customerId: 'cust-009',
    customerName: 'Léa Laurent',
    customerEmail: 'lea@example.com',
    fileSize: 120,
    duration: 180,
    status: 'success',
  },
  {
    id: 'evt-010',
    type: 'access_granted',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000),
    productId: 'prod-006',
    productName: 'Pack Audio Meditation',
    customerId: 'cust-010',
    customerName: 'Hugo Fontaine',
    customerEmail: 'hugo@example.com',
    status: 'success',
  },
  // Il y a 5 jours
  {
    id: 'evt-011',
    type: 'license_activated',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    productId: 'prod-001',
    productName: 'Ebook React Avancé',
    customerId: 'cust-011',
    customerName: 'Camille Girard',
    customerEmail: 'camille@example.com',
    status: 'success',
  },
  {
    id: 'evt-012',
    type: 'download_failed',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000),
    productId: 'prod-007',
    productName: 'Cours Vidéo Photographie',
    customerId: 'cust-012',
    customerName: 'Nathan Blanc',
    customerEmail: 'nathan@example.com',
    status: 'error',
    message: 'Fichier corrompu',
  },
];

/**
 * Données de démonstration - Produits pour mise à jour groupée
 */
const mockProducts: BulkUpdateDigitalProduct[] = [
  {
    id: 'prod-001',
    name: 'Ebook React Avancé',
    price: 29,
    category: 'ebook',
    status: 'active',
    protectionLevel: 'advanced',
    tags: ['développement', 'react', 'formation'],
    maxLicenses: 1500,
    currentLicenses: 1150,
    thumbnail: 'https://ui-avatars.com/api/?name=React&background=61dafb&color=fff',
  },
  {
    id: 'prod-002',
    name: 'Template SaaS Pro',
    price: 149,
    category: 'template',
    status: 'published',
    protectionLevel: 'advanced',
    tags: ['template', 'saas', 'pro'],
    maxLicenses: 500,
    currentLicenses: 420,
    thumbnail: 'https://ui-avatars.com/api/?name=SaaS&background=8b5cf6&color=fff',
  },
  {
    id: 'prod-003',
    name: 'Formation TypeScript Complète',
    price: 99,
    category: 'course',
    status: 'active',
    protectionLevel: 'standard',
    tags: ['formation', 'typescript', 'vidéo'],
    maxLicenses: 1000,
    currentLicenses: 800,
    thumbnail: 'https://ui-avatars.com/api/?name=TypeScript&background=3178c6&color=fff',
  },
  {
    id: 'prod-004',
    name: 'Plugin WordPress SEO',
    price: 59,
    category: 'plugin',
    status: 'published',
    protectionLevel: 'standard',
    tags: ['wordpress', 'seo', 'plugin'],
    maxLicenses: 350,
    currentLicenses: 280,
    thumbnail: 'https://ui-avatars.com/api/?name=WP&background=21759b&color=fff',
  },
  {
    id: 'prod-005',
    name: 'Thème Shopify Premium',
    price: 79,
    category: 'theme',
    status: 'active',
    protectionLevel: 'advanced',
    tags: ['shopify', 'thème', 'e-commerce'],
    maxLicenses: 700,
    currentLicenses: 580,
    thumbnail: 'https://ui-avatars.com/api/?name=Shopify&background=96bf48&color=fff',
  },
  {
    id: 'prod-006',
    name: 'Pack Audio Meditation',
    price: 19,
    category: 'audio',
    status: 'published',
    protectionLevel: 'basic',
    tags: ['audio', 'meditation', 'relaxation'],
    maxLicenses: 600,
    currentLicenses: 550,
    thumbnail: 'https://ui-avatars.com/api/?name=Audio&background=f59e0b&color=fff',
  },
  {
    id: 'prod-007',
    name: 'Cours Vidéo Photographie',
    price: 129,
    category: 'video',
    status: 'draft',
    protectionLevel: 'basic',
    tags: ['vidéo', 'photographie', 'art'],
    maxLicenses: 500,
    currentLicenses: 0,
    thumbnail: 'https://ui-avatars.com/api/?name=Photo&background=ef4444&color=fff',
  },
  {
    id: 'prod-008',
    name: 'Logiciel Comptabilité Pro',
    price: 199,
    category: 'software',
    status: 'archived',
    protectionLevel: 'advanced',
    tags: ['logiciel', 'comptabilité', 'business'],
    maxLicenses: 500,
    currentLicenses: 150,
    thumbnail: 'https://ui-avatars.com/api/?name=Compta&background=10b981&color=fff',
  },
];

/**
 * Composant de démonstration pour les composants du Jour 3
 * - DownloadHistory
 * - BulkDigitalUpdate
 */
export const DigitalDay3Demo: React.FC = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Digital Products - Jour 3</h1>
        <p className="text-muted-foreground">
          Démonstration de DownloadHistory et BulkDigitalUpdate
        </p>
      </div>

      {/* ========== DOWNLOAD HISTORY ========== */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">1. DownloadHistory</h2>
          <p className="text-muted-foreground">
            Historique des téléchargements avec timeline, filtres et statistiques
          </p>
        </div>

        <DownloadHistory
          events={mockEvents}
          onEventClick={event => {
            logger.info('Event clicked', { eventId: event.id, eventType: event.type });
            alert(
              `Événement: ${event.type}\nProduit: ${event.productName}\nClient: ${event.customerName}`
            );
          }}
          showFilters={true}
          showSearch={true}
          variant="timeline"
          pageSize={20}
        />
      </div>

      {/* ========== BULK DIGITAL UPDATE ========== */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">2. BulkDigitalUpdate</h2>
          <p className="text-muted-foreground">
            Mise à jour groupée de produits digitaux avec aperçu en temps réel
          </p>
        </div>

        <BulkDigitalUpdate
          products={mockProducts}
          onSave={(productIds, changes) => {
            logger.info('Bulk update', { productIds, changesCount: changes.length });
            alert(
              `Mise à jour groupée appliquée!\n\n` +
                `Produits: ${productIds.length}\n` +
                `Changements: ${changes.length}\n\n` +
                `Détails: ${JSON.stringify(changes, null, 2)}`
            );
          }}
          onCancel={() => logger.info('Bulk update cancelled')}
        />
      </div>

      {/* ========== EXEMPLES D'UTILISATION ========== */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold mb-2">Cas d'usage pratiques</h3>
          <p className="text-muted-foreground">Exemples concrets d'utilisation des composants</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Exemple 1 */}
          <Card className="p-4">
            <div className="space-y-2">
              <h4 className="font-semibold">📊 Surveiller l'activité</h4>
              <p className="text-sm text-muted-foreground">Utilisez DownloadHistory pour :</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Détecter les activités suspectes</li>
                <li>• Analyser les téléchargements par période</li>
                <li>• Identifier les produits populaires</li>
                <li>• Suivre les erreurs de téléchargement</li>
              </ul>
            </div>
          </Card>

          {/* Exemple 2 */}
          <Card className="p-4">
            <div className="space-y-2">
              <h4 className="font-semibold">⚡ Mises à jour rapides</h4>
              <p className="text-sm text-muted-foreground">Utilisez BulkDigitalUpdate pour :</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Ajuster les prix (promotions, augmentations)</li>
                <li>• Changer le statut de plusieurs produits</li>
                <li>• Ajouter des tags pour organisation</li>
                <li>• Modifier le niveau de protection</li>
              </ul>
            </div>
          </Card>

          {/* Exemple 3 */}
          <Card className="p-4">
            <div className="space-y-2">
              <h4 className="font-semibold">🔍 Filtrage avancé</h4>
              <p className="text-sm text-muted-foreground">DownloadHistory offre :</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Filtres par période (aujourd'hui, semaine, mois)</li>
                <li>• Filtres par type d'événement</li>
                <li>• Filtres par statut (succès, erreur, warning)</li>
                <li>• Recherche par produit ou client</li>
              </ul>
            </div>
          </Card>

          {/* Exemple 4 */}
          <Card className="p-4">
            <div className="space-y-2">
              <h4 className="font-semibold">💰 Gestion des prix</h4>
              <p className="text-sm text-muted-foreground">BulkDigitalUpdate permet :</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Augmentation : +10 EUR ou +15%</li>
                <li>• Réduction : -5 EUR ou -20%</li>
                <li>• Définir nouveau prix fixe</li>
                <li>• Aperçu avant application</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <Card className="p-6 bg-muted/50">
        <div className="space-y-2">
          <h3 className="font-semibold">✅ Jour 3 Complet</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• DownloadHistory : 620 lignes (timeline, filtres, événements groupés par date)</p>
            <p>• BulkDigitalUpdate : 630 lignes (sélection, changements, aperçu en temps réel)</p>
            <p>• Total Jour 3 : ~1,250 lignes</p>
            <p className="mt-2 font-medium">📊 Cumul Jours 1+2+3 : ~3,805 lignes</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DigitalDay3Demo;
