import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { DigitalProductStatusIndicator } from './DigitalProductStatusIndicator';
import { DownloadInfoDisplay } from './DownloadInfoDisplay';

/**
 * Composant de démonstration pour les composants du Jour 1
 * - DigitalProductStatusIndicator
 * - DownloadInfoDisplay
 */
export const DigitalDay1Demo: React.FC = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Digital Products - Jour 1</h1>
        <p className="text-muted-foreground">
          Démonstration de DigitalProductStatusIndicator et DownloadInfoDisplay
        </p>
      </div>

      {/* ========== DIGITAL PRODUCT STATUS INDICATOR ========== */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">1. DigitalProductStatusIndicator</h2>
          <p className="text-muted-foreground">
            Indicateur de statut pour produits digitaux avec 3 variantes et tous les statuts
          </p>
        </div>

        <Tabs defaultValue="compact" className="w-full">
          <TabsList className="grid w-full max-w-xl grid-cols-3">
            <TabsTrigger value="compact">Compact</TabsTrigger>
            <TabsTrigger value="default">Default</TabsTrigger>
            <TabsTrigger value="detailed">Detailed</TabsTrigger>
          </TabsList>

          {/* COMPACT VARIANT */}
          <TabsContent value="compact" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Tous les statuts - Compact</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DigitalProductStatusIndicator
                  status="draft"
                  variant="compact"
                  totalDownloads={0}
                />
                <DigitalProductStatusIndicator
                  status="published"
                  variant="compact"
                  totalDownloads={45}
                />
                <DigitalProductStatusIndicator
                  status="active"
                  variant="compact"
                  totalDownloads={1250}
                />
                <DigitalProductStatusIndicator
                  status="archived"
                  variant="compact"
                  totalDownloads={850}
                />
                <DigitalProductStatusIndicator
                  status="suspended"
                  variant="compact"
                  totalDownloads={320}
                />
              </div>
            </Card>
          </TabsContent>

          {/* DEFAULT VARIANT */}
          <TabsContent value="default" className="space-y-4">
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold mb-4">Exemples Default</h3>
              
              {/* Published avec revenue */}
              <DigitalProductStatusIndicator
                status="published"
                variant="default"
                totalDownloads={450}
                showProgress={true}
                activeLicenses={120}
                totalLicenses={500}
                revenue={4250}
                currency="EUR"
                protectionLevel="standard"
              />

              {/* Active avec warning */}
              <DigitalProductStatusIndicator
                status="published"
                variant="default"
                totalDownloads={1250}
                showProgress={true}
                activeLicenses={480}
                totalLicenses={500}
                lowLicenseThreshold={20}
                revenue={12400}
                currency="EUR"
                protectionLevel="advanced"
              />

              {/* Draft sans données */}
              <DigitalProductStatusIndicator
                status="draft"
                variant="default"
                totalDownloads={0}
                protectionLevel="basic"
              />
            </Card>
          </TabsContent>

          {/* DETAILED VARIANT */}
          <TabsContent value="detailed" className="space-y-4">
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold mb-4">Exemples Detailed</h3>
              
              {/* Active avec toutes les métriques */}
              <DigitalProductStatusIndicator
                status="active"
                variant="detailed"
                totalDownloads={1250}
                recentDownloads={85}
                downloadTrend="up"
                showProgress={true}
                activeLicenses={320}
                totalLicenses={500}
                revenue={14250}
                currency="EUR"
                activeCustomers={280}
                protectionLevel="advanced"
              />

              {/* Archived avec tendance baisse */}
              <DigitalProductStatusIndicator
                status="archived"
                variant="detailed"
                totalDownloads={850}
                recentDownloads={12}
                downloadTrend="down"
                showProgress={true}
                activeLicenses={85}
                totalLicenses={200}
                revenue={2150}
                currency="EUR"
                activeCustomers={72}
                protectionLevel="standard"
              />

              {/* Suspended */}
              <DigitalProductStatusIndicator
                status="suspended"
                variant="detailed"
                totalDownloads={320}
                recentDownloads={0}
                downloadTrend="stable"
                showProgress={true}
                activeLicenses={0}
                totalLicenses={100}
                revenue={850}
                currency="EUR"
                activeCustomers={0}
                protectionLevel="basic"
              />

              {/* Published avec low license warning */}
              <DigitalProductStatusIndicator
                status="published"
                variant="detailed"
                totalDownloads={2800}
                recentDownloads={145}
                downloadTrend="up"
                showProgress={true}
                activeLicenses={980}
                totalLicenses={1000}
                lowLicenseThreshold={5}
                revenue={28500}
                currency="EUR"
                activeCustomers={845}
                protectionLevel="advanced"
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ========== DOWNLOAD INFO DISPLAY ========== */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">2. DownloadInfoDisplay</h2>
          <p className="text-muted-foreground">
            Affichage détaillé des informations de téléchargement avec 3 variantes
          </p>
        </div>

        <Tabs defaultValue="compact-dl" className="w-full">
          <TabsList className="grid w-full max-w-xl grid-cols-3">
            <TabsTrigger value="compact-dl">Compact</TabsTrigger>
            <TabsTrigger value="default-dl">Default</TabsTrigger>
            <TabsTrigger value="detailed-dl">Detailed</TabsTrigger>
          </TabsList>

          {/* COMPACT VARIANT */}
          <TabsContent value="compact-dl" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Downloads - Compact</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <DownloadInfoDisplay
                  downloadId="DL-001"
                  status="active"
                  variant="compact"
                  purchaseDate={new Date()}
                  customer={{
                    id: '1',
                    name: 'Marie Dupont',
                    email: 'marie.dupont@example.com',
                  }}
                  product={{
                    id: 'prod-1',
                    name: 'Ebook React Avancé',
                    version: '2.0',
                    fileSize: 25,
                    fileType: 'PDF',
                    price: 29,
                  }}
                  downloadCount={2}
                  downloadLimit={5}
                />

                <DownloadInfoDisplay
                  downloadId="DL-002"
                  status="completed"
                  variant="compact"
                  purchaseDate={new Date('2025-10-15')}
                  customer={{
                    id: '2',
                    name: 'Jean Martin',
                    email: 'jean.martin@example.com',
                  }}
                  product={{
                    id: 'prod-2',
                    name: 'Template SaaS Pro',
                    version: '1.5',
                    fileSize: 150,
                    fileType: 'ZIP',
                    price: 149,
                  }}
                  downloadCount={5}
                  downloadLimit={5}
                />

                <DownloadInfoDisplay
                  downloadId="DL-003"
                  status="pending"
                  variant="compact"
                  purchaseDate={new Date()}
                  customer={{
                    id: '3',
                    name: 'Sophie Leblanc',
                    email: 'sophie@example.com',
                  }}
                  product={{
                    id: 'prod-3',
                    name: 'Formation TypeScript',
                    fileSize: 800,
                    fileType: 'MP4',
                    price: 99,
                  }}
                  downloadCount={0}
                  downloadLimit={10}
                />

                <DownloadInfoDisplay
                  downloadId="DL-004"
                  status="expired"
                  variant="compact"
                  purchaseDate={new Date('2025-09-01')}
                  customer={{
                    id: '4',
                    name: 'Lucas Bernard',
                    email: 'lucas@example.com',
                  }}
                  product={{
                    id: 'prod-4',
                    name: 'Plugin WordPress',
                    version: '3.2',
                    fileSize: 45,
                    fileType: 'ZIP',
                    price: 59,
                  }}
                  downloadCount={1}
                  downloadLimit={3}
                />
              </div>
            </Card>
          </TabsContent>

          {/* DEFAULT VARIANT */}
          <TabsContent value="default-dl" className="space-y-4">
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold mb-4">Downloads - Default</h3>

              {/* Active avec license key */}
              <DownloadInfoDisplay
                downloadId="DL-12345"
                status="active"
                variant="default"
                purchaseDate={new Date('2025-10-20')}
                customer={{
                  id: 'cust-001',
                  name: 'Marie Dupont',
                  email: 'marie.dupont@example.com',
                }}
                product={{
                  id: 'prod-digital-01',
                  name: 'Ebook React Avancé',
                  version: '2.0',
                  fileSize: 25,
                  fileType: 'PDF',
                  price: 29,
                  currency: 'EUR',
                }}
                downloadCount={2}
                downloadLimit={5}
                licenseKey="REACT-2024-ABCD-1234-EFGH"
                protectionLevel="standard"
                showActions={true}
                onAction={(action) => console.log('Action:', action)}
              />

              {/* Completed */}
              <DownloadInfoDisplay
                downloadId="DL-67890"
                status="completed"
                variant="default"
                purchaseDate={new Date('2025-10-01')}
                customer={{
                  id: 'cust-002',
                  name: 'Jean Martin',
                  email: 'jean.martin@example.com',
                }}
                product={{
                  id: 'prod-digital-02',
                  name: 'Template SaaS Pro',
                  version: '1.5',
                  fileSize: 150,
                  fileType: 'ZIP',
                  price: 149,
                  currency: 'EUR',
                }}
                downloadCount={5}
                downloadLimit={5}
                protectionLevel="advanced"
              />

              {/* Pending payment */}
              <DownloadInfoDisplay
                downloadId="DL-11111"
                status="pending"
                variant="default"
                purchaseDate={new Date()}
                customer={{
                  id: 'cust-003',
                  name: 'Sophie Leblanc',
                  email: 'sophie@example.com',
                }}
                product={{
                  id: 'prod-digital-03',
                  name: 'Formation TypeScript Complète',
                  version: '1.0',
                  fileSize: 800,
                  fileType: 'MP4',
                  price: 99,
                  currency: 'EUR',
                }}
                downloadCount={0}
                downloadLimit={10}
                showActions={true}
                onAction={(action) => console.log('Action:', action)}
              />
            </Card>
          </TabsContent>

          {/* DETAILED VARIANT */}
          <TabsContent value="detailed-dl" className="space-y-4">
            <Card className="p-6 space-y-6">
              <h3 className="font-semibold mb-4">Downloads - Detailed</h3>

              {/* Active avec toutes les infos */}
              <DownloadInfoDisplay
                downloadId="DL-FULL-001"
                status="active"
                variant="detailed"
                purchaseDate={new Date('2025-10-20')}
                lastActivity={new Date('2025-10-28')}
                expiryDate={new Date('2026-10-20')}
                customer={{
                  id: 'cust-premium-001',
                  name: 'Marie Dupont',
                  email: 'marie.dupont@example.com',
                  avatar: 'https://ui-avatars.com/api/?name=Marie+Dupont&background=3b82f6&color=fff',
                  location: 'Paris, France',
                  ipAddress: '192.168.1.1',
                }}
                product={{
                  id: 'prod-premium-01',
                  name: 'Ebook React Avancé - Édition Premium',
                  version: '2.0',
                  fileSize: 25.5,
                  fileType: 'PDF',
                  price: 29,
                  currency: 'EUR',
                }}
                downloadCount={2}
                downloadLimit={5}
                licenseKey="REACT-2024-ABCD-1234-EFGH-5678"
                amountPaid={29}
                paymentMethod="Carte bancaire"
                protectionLevel="advanced"
                showActions={true}
                onAction={(action) => console.log('Action:', action)}
              />

              {/* Completed sans licence restante */}
              <DownloadInfoDisplay
                downloadId="DL-FULL-002"
                status="completed"
                variant="detailed"
                purchaseDate={new Date('2025-09-15')}
                lastActivity={new Date('2025-10-15')}
                customer={{
                  id: 'cust-002',
                  name: 'Jean Martin',
                  email: 'jean.martin@example.com',
                  avatar: 'https://ui-avatars.com/api/?name=Jean+Martin&background=10b981&color=fff',
                  location: 'Lyon, France',
                }}
                product={{
                  id: 'prod-template-01',
                  name: 'Template SaaS Pro',
                  version: '1.5',
                  fileSize: 150,
                  fileType: 'ZIP',
                  price: 149,
                  currency: 'EUR',
                }}
                downloadCount={5}
                downloadLimit={5}
                licenseKey="SAAS-TMPL-2024-WXYZ-9876"
                amountPaid={149}
                paymentMethod="PayPal"
                protectionLevel="standard"
              />

              {/* Revoked */}
              <DownloadInfoDisplay
                downloadId="DL-FULL-003"
                status="revoked"
                variant="detailed"
                purchaseDate={new Date('2025-08-01')}
                lastActivity={new Date('2025-08-15')}
                customer={{
                  id: 'cust-003',
                  name: 'Sophie Leblanc',
                  email: 'sophie@example.com',
                  avatar: 'https://ui-avatars.com/api/?name=Sophie+Leblanc&background=ef4444&color=fff',
                  location: 'Marseille, France',
                }}
                product={{
                  id: 'prod-course-01',
                  name: 'Formation TypeScript Complète',
                  version: '1.0',
                  fileSize: 800,
                  fileType: 'MP4',
                  price: 99,
                  currency: 'EUR',
                }}
                downloadCount={1}
                downloadLimit={10}
                amountPaid={99}
                paymentMethod="Stripe"
                protectionLevel="basic"
                showActions={true}
                onAction={(action) => console.log('Action:', action)}
              />

              {/* Suspended avec activité suspecte */}
              <DownloadInfoDisplay
                downloadId="DL-FULL-004"
                status="suspended"
                variant="detailed"
                purchaseDate={new Date('2025-10-15')}
                lastActivity={new Date('2025-10-25')}
                customer={{
                  id: 'cust-004',
                  name: 'Lucas Bernard',
                  email: 'lucas@example.com',
                  avatar: 'https://ui-avatars.com/api/?name=Lucas+Bernard&background=ec4899&color=fff',
                  location: 'Toulouse, France',
                }}
                product={{
                  id: 'prod-plugin-01',
                  name: 'Plugin WordPress Premium',
                  version: '3.2',
                  fileSize: 45,
                  fileType: 'ZIP',
                  price: 59,
                  currency: 'EUR',
                }}
                downloadCount={50}
                downloadLimit={3}
                licenseKey="WP-PLUGIN-2024-SUSP-1234"
                amountPaid={59}
                paymentMethod="Carte bancaire"
                protectionLevel="advanced"
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <Card className="p-6 bg-muted/50">
        <div className="space-y-2">
          <h3 className="font-semibold">✅ Jour 1 Complet</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• DigitalProductStatusIndicator : 320 lignes (3 variantes, 5 statuts)</p>
            <p>• DownloadInfoDisplay : 520 lignes (3 variantes, 6 statuts)</p>
            <p>• Total Jour 1 : ~840 lignes</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DigitalDay1Demo;

