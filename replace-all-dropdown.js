/**
 * Script complet pour remplacer TOUS les DropdownMenu par Select + SelectContent
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Liste complète des fichiers à traiter
const filesToProcess = [
  // Tables simples
  'src/components/physical/VariantManager.tsx',
  'src/components/digital/DigitalProductsBulkActions.tsx',
  'src/components/physical/PhysicalProductCard.tsx',
  'src/components/products/ProductBulkActions.tsx',
  'src/components/orders/OrdersTable.tsx',
  'src/components/service/ServiceCard.tsx',
  'src/components/physical/notifications/StockAlertManager.tsx',

  // Pages de gestion
  'src/pages/dashboard/DigitalBundlesManagement.tsx',
  'src/pages/admin/AdminReturnManagement.tsx',

  // Autres composants
  'src/pages/orders/OrderMessaging.tsx',
  'src/components/physical/webhooks/WebhooksManager.tsx',
  'src/components/service/BookingCard.tsx',
  'src/components/team/StoreTaskCalendarExport.tsx',
  'src/pages/admin/AdminWebhookManagement.tsx',
  'src/components/email/EmailWorkflowManager.tsx',
  'src/components/payments/AdvancedPaymentsComponent.tsx',
  'src/components/reviews/ExportReviewsButton.tsx',
  'src/components/team/StoreTaskCard.tsx',
  'src/pages/customer/CustomerMyWishlist.tsx',
  'src/pages/dashboard/TaxManagement.tsx',

  // Plus de composants
  'src/pages/admin/PlatformCustomization.tsx',
  'src/components/digital/VersionManagementDashboard.tsx',
  'src/pages/dashboard/AnalyticsDashboardsManagement.tsx',
  'src/components/digital/LicenseManagementDashboard.tsx',
  'src/pages/digital/DigitalProductsList.tsx',
  'src/components/physical/inventory/WarehouseManager.tsx',
  'src/components/messaging/ConversationComponent.tsx',
  'src/components/email/EmailCampaignManager.tsx',
  'src/components/physical/PhysicalProductsList.tsx',
  'src/pages/dashboard/LiveSessionsManagement.tsx',
  'src/components/digital/DigitalProductsList.tsx',
  'src/pages/admin/AdminCommunity.tsx',
  'src/pages/dashboard/AssignmentsManagement.tsx',
  'src/components/digital/files/FileVersionManager.tsx',
  'src/pages/service/RecurringBookingsManagement.tsx',
  'src/components/physical/notifications/PriceAlertManager.tsx',
  'src/components/payments/PaymentBulkActions.tsx',
  'src/pages/digital/DigitalProductVersionsManagement.tsx',
  'src/components/physical/suppliers/SupplierOrders.tsx',
  'src/components/digital/updates/UpdatesList.tsx',
  'src/pages/admin/AdminUsers.tsx',
  'src/components/service/recurring/RecurringBookingsManager.tsx',
  'src/components/team/StoreMembersList.tsx',
  'src/components/physical/suppliers/AutoReorderRules.tsx',
  'src/components/digital/LicenseTable.tsx',
  'src/components/courses/CoursesList.tsx',
  'src/components/digital/webhooks/WebhooksManager.tsx',
  'src/components/service/ServicesList.tsx',
  'src/components/physical/promotions/PromotionsManager.tsx',
  'src/pages/dashboard/CouponsManagement.tsx',
  'src/components/artist/PortfolioComments.tsx',
  'src/components/payments/PaymentCardDashboard.tsx',
  'src/components/physical/suppliers/SuppliersManagement.tsx',
  'src/components/physical/suppliers/SupplierProducts.tsx',
  'src/components/payments/PaymentListView.tsx',
  'src/components/reviews/ShareReviewButtons.tsx',
  'src/components/digital/DigitalAnalyticsDashboard.tsx',
  'src/components/admin/ReviewModerationTable.tsx',
  'src/pages/notifications/NotificationsManagement.tsx',
];

console.log('🔄 REMPLACEMENT COMPLET DE TOUS LES DROPDOWN MENU\n');

// Fonction pour traiter un fichier
function processFile(filePath) {
  try {
    console.log(`📝 Traitement de ${filePath}`);

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Remplacer les imports
    const importPatterns = [
      /import\s*\{\s*DropdownMenu[^}]*\}\s*from\s*['"`]@\/components\/ui\/dropdown-menu['"`];?/g,
      /import\s*\{\s*StableDropdownMenu[^}]*\}\s*from\s*['"`]@\/components\/ui\/dropdown-menu['"`];?/g
    ];

    importPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, `import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";`);
        modified = true;
      }
    });

    // 2. Remplacer les composants
    if (content.includes('DropdownMenu>') || content.includes('StableDropdownMenu>')) {
      // Remplacements simples
      content = content.replace(/<DropdownMenu>/g, '<Select>');
      content = content.replace(/<StableDropdownMenu>/g, '<Select>');
      content = content.replace(/<\/DropdownMenu>/g, '</Select>');
      content = content.replace(/<\/StableDropdownMenu>/g, '</Select>');

      content = content.replace(/<DropdownMenuTrigger\s+asChild>/g, '<SelectTrigger');
      content = content.replace(/<\/DropdownMenuTrigger>/g, '</SelectTrigger>');

      content = content.replace(/<DropdownMenuContent[^>]*>/g, '<SelectContent mobileVariant="sheet" className="min-w-[200px]">');
      content = content.replace(/<\/DropdownMenuContent>/g, '</SelectContent>');

      content = content.replace(/<DropdownMenuItem/g, '<SelectItem value="action" onSelect');
      content = content.replace(/<StableDropdownMenuItem/g, '<SelectItem value="action" onSelect');
      content = content.replace(/<\/DropdownMenuItem>/g, '</SelectItem>');
      content = content.replace(/<\/StableDropdownMenuItem>/g, '</SelectItem>');

      // Ajustements spécifiques
      content = content.replace(/onClick=\{/g, 'onSelect={');
      content = content.replace(/onClick=\(\)/g, 'onSelect={() => {}}');

      // Valeurs uniques pour SelectItem
      let itemCount = 0;
      content = content.replace(/value="action"/g, () => {
        const values = ['edit', 'delete', 'copy', 'view', 'export', 'duplicate', 'toggle', 'quickview', 'preview', 'copylink'];
        return `value="${values[itemCount++ % values.length]}"`;
      });

      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${filePath} modifié`);
    } else {
      console.log(`⚪ ${filePath} inchangé`);
    }

    return modified;

  } catch (error) {
    console.error(`❌ Erreur avec ${filePath}:`, error.message);
    return false;
  }
}

// Traiter tous les fichiers
let totalModified = 0;
let totalProcessed = 0;

filesToProcess.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    if (processFile(filePath)) {
      totalModified++;
    }
    totalProcessed++;
  } else {
    console.log(`⚠️ Fichier non trouvé: ${filePath}`);
  }
});

// Résumé final
console.log(`\n🎯 TRAITEMENT TERMINÉ`);
console.log(`📊 ${totalProcessed} fichiers traités`);
console.log(`✅ ${totalModified} fichiers modifiés`);

console.log('\n📋 PROCHAINES ÉTAPES:');
console.log('1. Tester les modifications');
console.log('2. Corriger manuellement les cas complexes restants');
console.log('3. Supprimer dropdown-menu.tsx si plus utilisé');
console.log('4. Mettre à jour les tests et la documentation');