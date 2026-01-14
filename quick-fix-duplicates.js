/**
 * Script rapide pour corriger les importations dupliquées de Select
 */

import fs from 'fs';
import { execSync } from 'child_process';

// Liste des fichiers suspects basée sur les erreurs précédentes
const suspectFiles = [
  'src/components/digital/DigitalAnalyticsDashboard.tsx',
  'src/components/digital/DigitalProductsList.tsx',
  'src/components/digital/DigitalProductsBulkActions.tsx',
  'src/components/digital/LicenseTable.tsx',
  'src/components/digital/LicenseManagementDashboard.tsx',
  'src/components/digital/VersionManagementDashboard.tsx',
  'src/components/digital/files/FileVersionManager.tsx',
  'src/components/digital/updates/UpdatesList.tsx',
  'src/components/digital/webhooks/WebhooksManager.tsx',
  'src/components/orders/OrdersTable.tsx',
  'src/components/payments/PaymentBulkActions.tsx',
  'src/components/physical/inventory/WarehouseManager.tsx',
  'src/components/physical/PhysicalProductsList.tsx',
  'src/components/physical/promotions/PromotionsManager.tsx',
  'src/components/physical/suppliers/AutoReorderRules.tsx',
  'src/components/physical/suppliers/SupplierOrders.tsx',
  'src/components/physical/suppliers/SuppliersManagement.tsx',
  'src/components/physical/suppliers/SupplierProducts.tsx',
  'src/components/physical/VariantManager.tsx',
  'src/components/physical/webhooks/WebhooksManager.tsx',
  'src/components/pixels/PixelsTable.tsx',
  'src/components/products/ProductBulkActions.tsx',
  'src/components/reviews/ExportReviewsButton.tsx',
  'src/components/seo/SEOPagesList.tsx',
  'src/components/service/recurring/RecurringBookingsManager.tsx',
  'src/components/team/StoreTaskCalendarExport.tsx',
  'src/pages/admin/AdminCommunity.tsx',
  'src/pages/admin/AdminReturnManagement.tsx',
  'src/pages/admin/AdminUsers.tsx',
  'src/pages/admin/AdminWebhookManagement.tsx',
  'src/pages/admin/PlatformCustomization.tsx',
  'src/pages/dashboard/AnalyticsDashboardsManagement.tsx',
  'src/pages/dashboard/AssignmentsManagement.tsx',
  'src/pages/dashboard/CouponsManagement.tsx',
  'src/pages/dashboard/DigitalBundlesManagement.tsx',
  'src/pages/dashboard/LiveSessionsManagement.tsx',
  'src/pages/dashboard/TaxManagement.tsx',
  'src/pages/digital/DigitalProductVersionsManagement.tsx',
  'src/pages/digital/DigitalProductsList.tsx',
];

console.log('🔧 CORRECTION RAPIDE DES IMPORTATIONS DUPLIQUÉES\n');

let fixedCount = 0;

for (const filePath of suspectFiles) {
  try {
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Chercher les duplications
    const lines = content.split('\n');
    const selectImports = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('from') && line.includes('select') && line.includes('Select')) {
        selectImports.push({ index: i, line: line.trim() });
      }
    }

    if (selectImports.length > 1) {
      console.log(`❌ ${filePath}: ${selectImports.length} importations`);

      // Garder seulement la première et supprimer les autres
      const linesToRemove = selectImports.slice(1).map(imp => imp.index);
      linesToRemove.sort((a, b) => b - a); // Supprimer de la fin vers le début

      for (const lineIndex of linesToRemove) {
        lines.splice(lineIndex, 1);
      }

      content = lines.join('\n');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${filePath} corrigé`);
      fixedCount++;
    }

  } catch (error) {
    console.error(`❌ Erreur avec ${filePath}:`, error.message);
  }
}

console.log(`\n🎯 CORRECTION TERMINÉE: ${fixedCount} fichiers corrigés`);

if (fixedCount > 0) {
  console.log(`\n🚀 Prêt pour le commit et push !`);
}