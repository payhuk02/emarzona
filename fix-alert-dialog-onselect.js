/**
 * Script pour corriger automatiquement les AlertDialogAction qui ont onSelect au lieu de onClick
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour corriger un fichier
function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Fichier non trouvé: ${filePath}`);
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remplacer onSelect par onClick dans AlertDialogAction
    const alertDialogPattern = /<AlertDialogAction([^>]*)onSelect=\{([^}]*)\}([^>]*>)/g;

    content = content.replace(alertDialogPattern, (match, before, handler, after) => {
      return `<AlertDialogAction${before}onClick={${handler}}${after}`;
    });

    if (content !== fs.readFileSync(filePath, 'utf8')) {
      fs.writeFileSync(filePath, content, 'utf8');
      modified = true;
    }

    return modified;

  } catch (error) {
    console.error(`❌ Erreur avec ${filePath}:`, error.message);
    return false;
  }
}

// Liste des fichiers à vérifier (ceux qui contiennent AlertDialogAction)
const filesToCheck = [
  'src/components/service/ServicePackageManager.tsx',
  'src/components/payments/AdvancedPaymentsComponent.tsx',
  'src/pages/dashboard/LiveSessionsManagement.tsx',
  'src/components/team/StoreMembersList.tsx',
  'src/pages/admin/AdminStores.tsx',
  'src/pages/service/ServicesList.tsx',
  'src/components/physical/suppliers/SupplierProducts.tsx',
  'src/components/physical/VariantManager.tsx',
  'src/components/email/EmailWorkflowManager.tsx',
  'src/pages/dashboard/AssignmentsManagement.tsx',
  'src/components/courses/BulkCourseUpdate.tsx',
  'src/components/physical/promotions/PromotionsManager.tsx',
  'src/components/physical/suppliers/AutoReorderRules.tsx',
  'src/components/physical/webhooks/WebhooksManager.tsx',
  'src/components/orders/OrderCard.tsx',
  'src/components/customers/CustomersTable.tsx',
  'src/pages/dashboard/CouponsManagement.tsx',
  'src/components/service/recurring/RecurringBookingsManager.tsx',
  'src/pages/dashboard/TaxManagement.tsx',
  'src/pages/admin/AdminStoreWithdrawals.tsx',
  'src/components/payments/PaymentBulkActions.tsx',
  'src/components/physical/VariantImageGallery.tsx',
  'src/components/products/ProductBulkActions.tsx',
  'src/components/orders/OrdersTable.tsx',
  'src/pages/admin/AdminProducts.tsx',
  'src/components/products/tabs/ProductInfoTab.tsx',
  'src/pages/Products.tsx',
  'src/components/physical/suppliers/SuppliersManagement.tsx',
  'src/pages/dashboard/AnalyticsDashboardsManagement.tsx',
  'src/components/digital/DigitalBundleManager.tsx',
  'src/components/email/EmailSequenceManager.tsx',
  'src/components/email/EmailSegmentManager.tsx',
  'src/components/physical/preorders/PreOrdersManager.tsx',
  'src/components/payments/PaymentsTable.tsx',
  'src/components/digital/DigitalProductsBulkActions.tsx',
  'src/components/store/DeleteStoreDialog.tsx',
  'src/components/store/RequireTermsConsent.tsx',
  'src/components/settings/DomainSettings.tsx',
  'src/components/store/StoreDetails.tsx',
  'src/pages/CartEnhanced.tsx',
  'src/components/digital/DigitalProductsBulkActions.tsx',
  'src/components/physical/backorders/BackordersManager.tsx',
  'src/components/email/SequenceStepsList.tsx',
  'src/components/pixels/PixelsTable.tsx',
  'src/components/ui/confirm-dialog.tsx',
  'src/components/service/BulkServiceUpdate.tsx',
  'src/pages/dashboard/ReviewsManagement.tsx',
  'src/components/physical/BulkInventoryUpdate.tsx',
  'src/pages/admin/PlatformCustomization.tsx',
  'src/components/digital/CustomerAccessManager.tsx',
  'src/pages/customer/PriceStockAlerts.tsx',
  'src/components/physical/inventory/WarehouseManager.tsx',
  'src/components/team/StoreTaskCard.tsx',
  'src/components/admin/customization/DesignBrandingSection.tsx',
  'src/pages/dashboard/ArtistPortfoliosManagement.tsx',
  'src/components/store/StoreDomainSettings.tsx',
  'src/pages/physical/PhysicalProductsList.tsx',
  // Fichiers déjà corrigés manuellement
  'src/pages/admin/AdminUsers.tsx',
  'src/components/artist/PortfolioComments.tsx',
];

console.log('🔧 CORRECTION DES ALERTDIALOGACTION AVEC onSelect\n');

let totalFixed = 0;

filesToCheck.forEach(filePath => {
  if (fixFile(filePath)) {
    console.log(`✅ ${filePath} corrigé`);
    totalFixed++;
  } else {
    console.log(`⚪ ${filePath} inchangé`);
  }
});

console.log(`\n🎯 CORRECTION TERMINÉE`);
console.log(`📊 ${totalFixed} fichiers corrigés`);

if (totalFixed > 0) {
  console.log(`\n🚀 Prêt pour le commit et push !`);
}