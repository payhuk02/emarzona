/**
 * Script pour nettoyer les lignes vides excessives à la fin des fichiers
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Liste des fichiers modifiés récemment qui pourraient avoir ce problème
const filesToCheck = [
  'src/pages/admin/AdminUsers.tsx',
  'src/components/notifications/NotificationRulesManager.tsx',
  'src/pages/dashboard/AnalyticsDashboardsManagement.tsx',
  'src/pages/dashboard/LiveSessionsManagement.tsx',
  'src/pages/dashboard/TaxManagement.tsx',
  'src/pages/digital/DigitalProductsList.tsx',
  'src/components/payments/AdvancedPaymentsComponent.tsx',
  'src/components/digital/DigitalProductsBulkActions.tsx',
  'src/components/physical/VariantManager.tsx',
  'src/components/physical/PhysicalProductsList.tsx',
  'src/components/physical/suppliers/SupplierProducts.tsx',
  'src/components/orders/OrdersTable.tsx',
  'src/components/products/ProductBulkActions.tsx',
  'src/pages/admin/PlatformCustomization.tsx',
];

console.log('🧹 NETTOYAGE DES LIGNES VIDES EXCESSIVES\n');

let cleanedCount = 0;

for (const filePath of filesToCheck) {
  try {
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Diviser en lignes et nettoyer les lignes vides à la fin
    const lines = content.split('\n');

    // Trouver la dernière ligne non vide
    let lastNonEmptyIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() !== '') {
        lastNonEmptyIndex = i;
        break;
      }
    }

    // Garder seulement jusqu'à la dernière ligne non vide, plus une ligne vide à la fin max
    if (lastNonEmptyIndex >= 0) {
      const cleanedLines = lines.slice(0, lastNonEmptyIndex + 1);
      // Ajouter au maximum une ligne vide à la fin
      if (lastNonEmptyIndex < lines.length - 1) {
        cleanedLines.push('');
      }

      content = cleanedLines.join('\n');
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${filePath} nettoyé`);
      cleanedCount++;
    } else {
      console.log(`⚪ ${filePath} déjà propre`);
    }

  } catch (error) {
    console.error(`❌ Erreur avec ${filePath}:`, error.message);
  }
}

console.log(`\n🎯 NETTOYAGE TERMINÉ: ${cleanedCount} fichiers nettoyés`);

if (cleanedCount > 0) {
  console.log(`\n🚀 Prêt pour le commit !`);
}