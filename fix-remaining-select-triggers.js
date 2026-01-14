/**
 * Script pour corriger tous les SelectTrigger restants qui contiennent des Button
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Liste complète de tous les fichiers avec des SelectTrigger problématiques
const filesToFix = [
  'src/components/digital/files/FileVersionManager.tsx',
  'src/components/artist/PortfolioComments.tsx',
  'src/pages/admin/AdminReturnManagement.tsx',
  'src/pages/dashboard/LiveSessionsManagement.tsx',
  'src/components/team/StoreTaskCalendarExport.tsx',
  'src/components/physical/notifications/PriceAlertManager.tsx',
  'src/pages/dashboard/DigitalBundlesManagement.tsx',
  'src/components/physical/notifications/StockAlertManager.tsx',
  'src/pages/admin/AdminCommunity.tsx',
  'src/components/physical/suppliers/SupplierProducts.tsx',
  'src/pages/dashboard/TaxManagement.tsx',
  'src/components/digital/LicenseManagementDashboard.tsx',
  'src/pages/dashboard/AnalyticsDashboardsManagement.tsx',
  'src/pages/dashboard/AssignmentsManagement.tsx',
  'src/pages/digital/DigitalProductVersionsManagement.tsx',
  'src/pages/dashboard/CouponsManagement.tsx',
  'src/components/courses/CoursesList.tsx',
  'src/components/email/EmailCampaignManager.tsx',
  'src/components/physical/suppliers/SuppliersManagement.tsx',
  'src/components/physical/suppliers/AutoReorderRules.tsx',
  'src/components/email/EmailWorkflowManager.tsx',
  'src/components/digital/VersionManagementDashboard.tsx',
  'src/components/physical/PhysicalProductsList.tsx',
  'src/components/physical/VariantManager.tsx',
  'src/components/digital/DigitalAnalyticsDashboard.tsx',
  'src/components/physical/promotions/PromotionsManager.tsx',
  'src/components/digital/webhooks/WebhooksManager.tsx',
  'src/components/digital/LicenseTable.tsx',
  'src/components/service/recurring/RecurringBookingsManager.tsx',
  'src/components/digital/updates/UpdatesList.tsx',
  'src/components/physical/suppliers/SupplierOrders.tsx',
  'src/components/payments/PaymentBulkActions.tsx',
  'src/components/messaging/ConversationComponent.tsx',
  'src/components/physical/inventory/WarehouseManager.tsx',
  'src/pages/digital/DigitalProductsList.tsx',
  'src/pages/admin/PlatformCustomization.tsx',
  'src/components/reviews/ExportReviewsButton.tsx',
  'src/components/payments/AdvancedPaymentsComponent.tsx',
  'src/pages/admin/AdminWebhookManagement.tsx',
  'src/components/orders/OrdersTable.tsx',
  'src/components/products/ProductBulkActions.tsx',
  'src/components/digital/DigitalProductsBulkActions.tsx',
  'src/components/notifications/NotificationRulesManager.tsx',
  'src/components/seo/SEOPagesList.tsx',
  'src/components/pixels/PixelsTable.tsx',
  // Ajout des fichiers déjà corrigés pour s'assurer
  'src/pages/admin/AdminUsers.tsx',
];

console.log('🔧 CORRECTION FINALE DE TOUS LES SELECTTRIGGER RESTANTS\n');

let totalFixed = 0;

filesToFix.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`📝 Traitement de ${filePath}`);

      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // 1. Corriger SelectTrigger avec Button interne
      const selectTriggerPattern = /<SelectTrigger\s*\n?\s*<Button([^>]*)>(.*?)<\/Button>\s*\n?\s*<\/SelectTrigger>/gs;

      content = content.replace(selectTriggerPattern, (match, buttonAttrs, buttonContent) => {
        // Extraire les attributs importants du Button
        const classMatch = buttonAttrs.match(/className="([^"]*)"/);
        const variantMatch = buttonAttrs.match(/variant="([^"]*)"/);
        const sizeMatch = buttonAttrs.match(/size="([^"]*)"/);
        const disabledMatch = buttonAttrs.match(/disabled=\{([^}]*)\}/);
        const ariaLabelMatch = buttonAttrs.match(/aria-label="([^"]*)"/);

        // Construire les attributs pour SelectTrigger
        let selectTriggerAttrs = '';

        if (classMatch) {
          selectTriggerAttrs += ` className="${classMatch[1]}"`;
        }

        if (disabledMatch) {
          selectTriggerAttrs += ` disabled={${disabledMatch[1]}}`;
        }

        if (ariaLabelMatch) {
          selectTriggerAttrs += ` aria-label="${ariaLabelMatch[1]}"`;
        }

        return `<SelectTrigger${selectTriggerAttrs}>\n${buttonContent}\n</SelectTrigger>`;
      });

      // 2. Corriger les onSelect dupliqués dans SelectItem
      const duplicateOnSelectPattern = /<SelectItem[^>]*value="([^"]*)"[^>]*onSelect\s+onSelect=\{([^}]*)\}/g;
      content = content.replace(duplicateOnSelectPattern, '<SelectItem value="$1" onSelect={$2}');

      if (content !== fs.readFileSync(filePath, 'utf8')) {
        fs.writeFileSync(filePath, content, 'utf8');
        modified = true;
        totalFixed++;
      }

      if (modified) {
        console.log(`✅ ${filePath} corrigé`);
      } else {
        console.log(`⚪ ${filePath} inchangé`);
      }
    } else {
      console.log(`⚠️ Fichier non trouvé: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Erreur avec ${filePath}:`, error.message);
  }
});

console.log(`\n🎯 CORRECTION TERMINÉE`);
console.log(`📊 ${totalFixed} fichiers corrigés`);

if (totalFixed > 0) {
  console.log(`\n🚀 Prêt pour le commit et push !`);
}