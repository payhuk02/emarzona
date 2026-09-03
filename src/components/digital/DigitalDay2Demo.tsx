import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { DigitalProductsList, DigitalProductListItem } from './DigitalProductsList';
import { DigitalBundleManager, BundleDigitalProduct, DigitalBundle } from './DigitalBundleManager';
import { logger } from '@/lib/logger';

/**
 * Données de démonstration - Produits digitaux
 */
const mockProducts: DigitalProductListItem[] = [
  {
    id: 'prod-001',
    name: 'Ebook React Avancé',
    description: 'Guide complet pour maîtriser React',
    category: 'ebook',
    status: 'active',
    price: 29,
    currency: 'EUR',
    totalDownloads: 1250,
    recentDownloads: 85,
    revenue: 36250,
    activeLicenses: 1150,
    totalLicenses: 1500,
    protectionLevel: 'advanced',
    version: '2.0',
    fileSize: 25,
    fileType: 'PDF',
    createdAt: new Date('2025-01-15'),
    thumbnail: 'https://ui-avatars.com/api/?name=React&background=61dafb&color=fff',
  },
  {
    id: 'prod-002',
    name: 'Template SaaS Pro',
    description: 'Template complet pour application SaaS',
    category: 'template',
    status: 'published',
    price: 149,
    currency: 'EUR',
    totalDownloads: 450,
    recentDownloads: 12,
    revenue: 67050,
    activeLicenses: 420,
    totalLicenses: 500,
    protectionLevel: 'advanced',
    version: '1.5',
    fileSize: 150,
    fileType: 'ZIP',
    createdAt: new Date('2025-02-20'),
    thumbnail: 'https://ui-avatars.com/api/?name=SaaS&background=8b5cf6&color=fff',
  },
  {
    id: 'prod-003',
    name: 'Formation TypeScript Complète',
    description: 'Formation vidéo de 40 heures',
    category: 'course',
    status: 'active',
    price: 99,
    currency: 'EUR',
    totalDownloads: 850,
    recentDownloads: 45,
    revenue: 84150,
    activeLicenses: 800,
    totalLicenses: 1000,
    protectionLevel: 'standard',
    version: '1.0',
    fileSize: 800,
    fileType: 'MP4',
    createdAt: new Date('2025-03-10'),
    thumbnail: 'https://ui-avatars.com/api/?name=TypeScript&background=3178c6&color=fff',
  },
  {
    id: 'prod-004',
    name: 'Plugin WordPress SEO',
    description: "Plugin d'optimisation SEO",
    category: 'plugin',
    status: 'published',
    price: 59,
    currency: 'EUR',
    totalDownloads: 320,
    recentDownloads: 8,
    revenue: 18880,
    activeLicenses: 280,
    totalLicenses: 350,
    protectionLevel: 'standard',
    version: '3.2',
    fileSize: 45,
    fileType: 'ZIP',
    createdAt: new Date('2025-04-05'),
    thumbnail: 'https://ui-avatars.com/api/?name=WP&background=21759b&color=fff',
  },
  {
    id: 'prod-005',
    name: 'Thème Shopify Premium',
    description: 'Thème e-commerce moderne',
    category: 'theme',
    status: 'active',
    price: 79,
    currency: 'EUR',
    totalDownloads: 620,
    recentDownloads: 28,
    revenue: 48980,
    activeLicenses: 580,
    totalLicenses: 700,
    protectionLevel: 'advanced',
    version: '2.1',
    fileSize: 120,
    fileType: 'ZIP',
    createdAt: new Date('2025-05-12'),
    thumbnail: 'https://ui-avatars.com/api/?name=Shopify&background=96bf48&color=fff',
  },
  {
    id: 'prod-006',
    name: 'Pack Audio Meditation',
    description: 'Collection de pistes de méditation',
    category: 'audio',
    status: 'published',
    price: 19,
    currency: 'EUR',
    totalDownloads: 580,
    recentDownloads: 22,
    revenue: 11020,
    activeLicenses: 550,
    totalLicenses: 600,
    protectionLevel: 'basic',
    fileSize: 350,
    fileType: 'MP3',
    createdAt: new Date('2025-06-01'),
    thumbnail: 'https://ui-avatars.com/api/?name=Audio&background=f59e0b&color=fff',
  },
  {
    id: 'prod-007',
    name: 'Cours Vidéo Photographie',
    description: 'Formation complète photographie',
    category: 'video',
    status: 'draft',
    price: 129,
    currency: 'EUR',
    totalDownloads: 0,
    revenue: 0,
    activeLicenses: 0,
    totalLicenses: 500,
    protectionLevel: 'basic',
    fileSize: 1200,
    fileType: 'MP4',
    createdAt: new Date('2025-07-15'),
    thumbnail: 'https://ui-avatars.com/api/?name=Photo&background=ef4444&color=fff',
  },
  {
    id: 'prod-008',
    name: 'Logiciel Comptabilité Pro',
    description: 'Logiciel de gestion comptable',
    category: 'software',
    status: 'archived',
    price: 199,
    currency: 'EUR',
    totalDownloads: 420,
    revenue: 83580,
    activeLicenses: 150,
    totalLicenses: 500,
    protectionLevel: 'advanced',
    version: '4.0',
    fileSize: 250,
    fileType: 'EXE',
    createdAt: new Date('2024-12-10'),
    thumbnail: 'https://ui-avatars.com/api/?name=Compta&background=10b981&color=fff',
  },
];

/**
 * Produits disponibles pour les bundles
 */
const availableProductsForBundles: BundleDigitalProduct[] = mockProducts.map(p => ({
  id: p.id,
  name: p.name,
  description: p.description,
  price: p.price,
  currency: p.currency,
  category: p.category,
  thumbnail: p.thumbnail,
  isAvailable: p.status === 'active' || p.status === 'published',
}));

/**
 * Bundle exemple pour le mode édition
 */
const existingBundle: Partial<DigitalBundle> = {
  id: 'bundle-001',
  name: 'Pack Développeur Full-Stack',
  description: "Tout ce qu'il faut pour devenir développeur full-stack",
  productIds: ['prod-001', 'prod-002', 'prod-003'],
  discountType: 'percentage',
  discountValue: 25,
  isActive: true,
  currentUses: 145,
  maxUses: 1000,
  tags: ['développement', 'formation', 'complet'],
};

/**
 * Composant de démonstration pour les composants du Jour 2
 * - DigitalProductsList
 * - DigitalBundleManager
 */
export const DigitalDay2Demo: React.FC = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Digital Products - Jour 2</h1>
        <p className="text-muted-foreground">
          Démonstration de DigitalProductsList et DigitalBundleManager
        </p>
      </div>

      {/* ========== DIGITAL PRODUCTS LIST ========== */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">1. DigitalProductsList</h2>
          <p className="text-muted-foreground">
            Liste complète de produits digitaux avec recherche, filtres, tri et actions
          </p>
        </div>

        <DigitalProductsList
          products={mockProducts}
          onSelect={ids => logger.info('Selected products', { count: ids.length, ids })}
          onEdit={id => logger.info('Edit product', { productId: id })}
          onDelete={id => logger.info('Delete product', { productId: id })}
          onDuplicate={id => logger.info('Duplicate product', { productId: id })}
          onArchive={id => logger.info('Archive product', { productId: id })}
          onView={id => logger.info('View product', { productId: id })}
          showBulkActions={true}
          showFilters={true}
          showSearch={true}
          pageSize={10}
        />
      </div>

      {/* ========== DIGITAL BUNDLE MANAGER ========== */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">2. DigitalBundleManager</h2>
          <p className="text-muted-foreground">
            Gestionnaire de création et d'édition de bundles de produits digitaux
          </p>
        </div>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="create">Mode Création</TabsTrigger>
            <TabsTrigger value="edit">Mode Édition</TabsTrigger>
          </TabsList>

          {/* MODE CRÉATION */}
          <TabsContent value="create" className="space-y-4">
            <Card className="p-6">
              <DigitalBundleManager
                availableProducts={availableProductsForBundles}
                onSave={bundle => {
                  logger.info('Bundle created', { bundleId: bundle.id, bundleName: bundle.name });
                  alert(`Bundle "${bundle.name}" créé avec succès !`);
                }}
                onCancel={() => logger.info('Bundle creation cancelled')}
                mode="create"
              />
            </Card>
          </TabsContent>

          {/* MODE ÉDITION */}
          <TabsContent value="edit" className="space-y-4">
            <Card className="p-6">
              <DigitalBundleManager
                bundle={existingBundle}
                availableProducts={availableProductsForBundles}
                onSave={bundle => {
                  logger.info('Bundle updated', { bundleId: bundle.id });
                  alert(`Bundle "${bundle.name}" mis à jour !`);
                }}
                onCancel={() => logger.info('Bundle edit cancelled')}
                mode="edit"
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ========== EXEMPLES DE BUNDLES ========== */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold mb-2">Exemples de Bundles</h3>
          <p className="text-muted-foreground">
            Différents types de bundles avec différentes configurations
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Bundle pourcentage */}
          <Card className="p-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Pack Développeur (-25%)</h4>
              <p className="text-sm text-muted-foreground">3 produits • Économie de 25%</p>
              <div className="flex items-center justify-between">
                <span className="text-sm line-through text-muted-foreground">277 EUR</span>
                <span className="text-xl font-bold text-green-600">207.75 EUR</span>
              </div>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Ebook React Avancé (29 EUR)</li>
                <li>• Template SaaS Pro (149 EUR)</li>
                <li>• Formation TypeScript (99 EUR)</li>
              </ul>
            </div>
          </Card>

          {/* Bundle montant fixe */}
          <Card className="p-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Pack Starter (-50 EUR)</h4>
              <p className="text-sm text-muted-foreground">2 produits • Économie fixe</p>
              <div className="flex items-center justify-between">
                <span className="text-sm line-through text-muted-foreground">108 EUR</span>
                <span className="text-xl font-bold text-green-600">58 EUR</span>
              </div>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Ebook React Avancé (29 EUR)</li>
                <li>• Thème Shopify Premium (79 EUR)</li>
              </ul>
            </div>
          </Card>

          {/* Bundle complexe */}
          <Card className="p-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Pack E-commerce Complet (-30%)</h4>
              <p className="text-sm text-muted-foreground">4 produits • Économie de 30%</p>
              <div className="flex items-center justify-between">
                <span className="text-sm line-through text-muted-foreground">436 EUR</span>
                <span className="text-xl font-bold text-green-600">305.20 EUR</span>
              </div>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Template SaaS Pro (149 EUR)</li>
                <li>• Thème Shopify Premium (79 EUR)</li>
                <li>• Formation TypeScript (99 EUR)</li>
                <li>• Logiciel Comptabilité Pro (199 EUR - Archivé)</li>
              </ul>
            </div>
          </Card>

          {/* Bundle sans réduction */}
          <Card className="p-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Pack Multimédia</h4>
              <p className="text-sm text-muted-foreground">2 produits • Aucune réduction</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">148 EUR</span>
              </div>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Cours Vidéo Photographie (129 EUR)</li>
                <li>• Pack Audio Meditation (19 EUR)</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <Card className="p-6 bg-muted/50">
        <div className="space-y-2">
          <h3 className="font-semibold">✅ Jour 2 Complet</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• DigitalProductsList : 680 lignes (recherche, filtres, tri, pagination, actions)</p>
            <p>• DigitalBundleManager : 680 lignes (création, édition, validation, résumé)</p>
            <p>• Total Jour 2 : ~1,360 lignes</p>
            <p className="mt-2 font-medium">📊 Cumul Jours 1+2 : ~2,555 lignes</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DigitalDay2Demo;
