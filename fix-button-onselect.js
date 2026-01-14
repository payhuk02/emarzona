/**
 * Script pour corriger automatiquement les Button qui ont onSelect au lieu de onClick
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Liste des fichiers à corriger (ceux qui contiennent Button onSelect)
const filesToFix = [
  'src/components/physical/VariantManager.tsx',
  'src/components/service/ServiceCard.tsx',
  'src/pages/admin/AdminUsers.tsx',
  'src/components/physical/PhysicalProductsList.tsx',
  'src/components/digital/VersionManagementDashboard.tsx',
  'src/components/email/EmailWorkflowManager.tsx',
  'src/components/physical/suppliers/AutoReorderRules.tsx',
  'src/components/physical/suppliers/SuppliersManagement.tsx',
  'src/components/email/EmailCampaignManager.tsx',
  'src/components/courses/CoursesList.tsx',
  'src/pages/dashboard/CouponsManagement.tsx',
  'src/pages/digital/DigitalProductVersionsManagement.tsx',
  'src/pages/dashboard/AssignmentsManagement.tsx',
  'src/pages/dashboard/AnalyticsDashboardsManagement.tsx',
  'src/components/digital/LicenseManagementDashboard.tsx',
  'src/components/service/ServicesList.tsx',
  'src/pages/dashboard/TaxManagement.tsx',
  'src/components/physical/suppliers/SupplierProducts.tsx',
  'src/pages/admin/AdminCommunity.tsx',
  'src/pages/notifications/NotificationsManagement.tsx',
  'src/components/physical/notifications/StockAlertManager.tsx',
  'src/pages/dashboard/DigitalBundlesManagement.tsx',
  'src/pages/service/RecurringBookingsManagement.tsx',
  'src/components/team/StoreMembersList.tsx',
  'src/components/physical/notifications/PriceAlertManager.tsx',
  'src/components/team/StoreTaskCalendarExport.tsx',
  'src/pages/dashboard/LiveSessionsManagement.tsx',
  'src/pages/admin/AdminReturnManagement.tsx',
  'src/pages/orders/OrderMessaging.tsx',
  'src/components/payments/PaymentCardDashboard.tsx',
  'src/components/artist/PortfolioComments.tsx',
  'src/components/digital/files/FileVersionManager.tsx',
];

console.log('🔧 CORRECTION DES BUTTON AVEC onSelect\n');

let totalFixed = 0;

filesToFix.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`📝 Traitement de ${filePath}`);

      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // Remplacer onSelect par onClick dans les Button
      // Pattern spécifique pour éviter les SelectItem
      const buttonOnSelectPattern = /<Button([^>]*)onSelect=\{([^}]*)\}([^>]*>)/g;

      content = content.replace(buttonOnSelectPattern, (match, before, handler, after) => {
        // Vérifier que ce n'est pas un SelectItem (qui peut avoir onSelect)
        if (match.includes('SelectItem')) {
          return match; // Ne pas modifier les SelectItem
        }
        return `<Button${before}onClick={${handler}}${after}`;
      });

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