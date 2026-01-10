/**
 * Script d'intégration automatique des événements de fidélisation
 * Ajoute automatiquement les appels de fidélisation dans les composants existants
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Patterns d'intégration pour différents types d'événements
 */
const INTEGRATION_PATTERNS = {
  // Intégration dans les composants de checkout/paiement
  purchase: {
    filePattern: /checkout|payment|order/i,
    codePattern: /success.*payment|payment.*success|order.*created/i,
    integrationCode: `
      // Intégration fidélisation automatique
      import { useAutoLoyaltyTracking } from '@/hooks/useAdvancedLoyalty';

      const { trackPurchase } = useAutoLoyaltyTracking(user?.id);

      // Après paiement réussi
      await trackPurchase({
        orderId: orderData.id,
        totalAmount: orderData.total_amount,
        items: orderData.items
      });`
  },

  // Intégration dans les composants de reviews
  review: {
    filePattern: /review/i,
    codePattern: /submit.*review|create.*review/i,
    integrationCode: `
      // Intégration fidélisation automatique
      import { useAutoLoyaltyTracking } from '@/hooks/useAdvancedLoyalty';

      const { trackReview } = useAutoLoyaltyTracking(user?.id);

      // Après soumission de review
      await trackReview({
        productId: productId,
        rating: rating,
        reviewId: reviewData.id
      });`
  },

  // Intégration dans les composants de parrainage
  referral: {
    filePattern: /referral|invite/i,
    codePattern: /send.*invite|create.*referral/i,
    integrationCode: `
      // Intégration fidélisation automatique
      import { useAutoLoyaltyTracking } from '@/hooks/useAdvancedLoyalty';

      const { trackReferral } = useAutoLoyaltyTracking(user?.id);

      // Après envoi d'invitation
      await trackReferral({
        refereeId: refereeId,
        refereeEmail: email
      });`
  },

  // Intégration dans les composants de partage social
  socialShare: {
    filePattern: /share|social/i,
    codePattern: /share.*product|social.*share/i,
    integrationCode: `
      // Intégration fidélisation automatique
      import { useAutoLoyaltyTracking } from '@/hooks/useAdvancedLoyalty';

      const { trackSocialShare } = useAutoLoyaltyTracking(user?.id);

      // Après partage social
      await trackSocialShare({
        platform: platform,
        contentType: 'product',
        contentId: productId
      });`
  }
};

/**
 * Trouve les fichiers à intégrer
 */
function findIntegrationTargets() {
  const srcDir = path.join(__dirname, '..', 'src');
  const targets = [];

  function scanDirectory(dirPath, relativePath = '') {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const relativeItemPath = path.join(relativePath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(itemPath, relativeItemPath);
      } else if (stats.isFile() && item.endsWith('.tsx') && !relativeItemPath.includes('/__tests__/')) {
        // Vérifier si le fichier correspond à un pattern d'intégration
        const content = fs.readFileSync(itemPath, 'utf-8');

        for (const [eventType, pattern] of Object.entries(INTEGRATION_PATTERNS)) {
          if (pattern.filePattern.test(relativeItemPath) && pattern.codePattern.test(content)) {
            targets.push({
              file: relativeItemPath,
              eventType,
              fullPath: itemPath,
              content
            });
            break; // Un fichier ne peut correspondre qu'à un type d'événement
          }
        }
      }
    }
  }

  scanDirectory(srcDir);
  return targets;
}

/**
 * Analyse un fichier pour déterminer où insérer l'intégration
 */
function analyzeFileForIntegration(fileInfo) {
  const { content, eventType } = fileInfo;
  const pattern = INTEGRATION_PATTERNS[eventType];

  // Chercher les endroits appropriés pour l'intégration
  const lines = content.split('\n');
  const integrationPoints = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Chercher les fonctions de succès ou de callback
    if (pattern.codePattern.test(line)) {
      // Trouver la fonction parente
      let braceCount = 0;
      let functionStart = i;

      // Remonter pour trouver le début de la fonction
      for (let j = i; j >= 0; j--) {
        if (lines[j].includes('const') && lines[j].includes('=') && lines[j].includes('=>')) {
          functionStart = j;
          break;
        }
        if (lines[j].includes('function') || lines[j].includes('async')) {
          functionStart = j;
          break;
        }
      }

      integrationPoints.push({
        lineIndex: i,
        functionStart,
        context: lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 3)).join('\n')
      });
    }
  }

  return integrationPoints;
}

/**
 * Génère un rapport d'intégration possible
 */
function generateIntegrationReport(targets) {
  console.log('🔍 ANALYSE D\'INTÉGRATION FIDÉLISATION\n');
  console.log(`📊 ${targets.length} fichiers identifiés pour l'intégration\n`);

  if (targets.length === 0) {
    console.log('❌ Aucun fichier cible trouvé pour l\'intégration automatique.');
    console.log('💡 Vous pouvez intégrer manuellement les événements de fidélisation dans vos composants.');
    return;
  }

  console.log('🎯 FICHIERS À INTÉGRER:\n');

  for (const target of targets) {
    console.log(`📄 ${target.file}`);
    console.log(`   Événement: ${target.eventType}`);

    const integrationPoints = analyzeFileForIntegration(target);
    console.log(`   Points d'intégration trouvés: ${integrationPoints.length}`);

    if (integrationPoints.length > 0) {
      console.log('   Contextes d\'intégration:');
      integrationPoints.slice(0, 2).forEach((point, index) => {
        console.log(`     ${index + 1}. Ligne ${point.lineIndex + 1}:`);
        console.log(`        ${point.context.replace(/\n/g, '\n        ')}`);
      });
    }

    console.log('');
  }

  console.log('💡 RECOMMANDATIONS:');
  console.log('  • Les intégrations peuvent être ajoutées manuellement dans les fonctions de succès');
  console.log('  • Utilisez le hook useAutoLoyaltyTracking pour une intégration propre');
  console.log('  • Testez chaque intégration pour éviter les régressions');
  console.log('  • Commencez par les événements de purchase et review pour maximum impact');

  console.log('\n📝 EXEMPLE D\'INTÉGRATION:');
  console.log(`
  // Dans un composant de checkout
  import { useAutoLoyaltyTracking } from '@/hooks/useAdvancedLoyalty';

  const { trackPurchase } = useAutoLoyaltyTracking(user?.id);

  // Après paiement réussi
  const handlePaymentSuccess = async (orderData) => {
    // Logique existante...

    // Intégration fidélisation
    await trackPurchase({
      orderId: orderData.id,
      totalAmount: orderData.total_amount,
      items: orderData.items
    });
  };
  `);
}

/**
 * Script principal
 */
async function integrateLoyaltyEvents() {
  console.log('🎖️ ANALYSEUR D\'INTÉGRATION FIDÉLISATION\n');

  const targets = findIntegrationTargets();
  generateIntegrationReport(targets);

  console.log('\n✅ Analyse terminée !');
  console.log('🔧 Utilisez les recommandations ci-dessus pour intégrer la fidélisation.');
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  integrateLoyaltyEvents().catch(console.error);
}

export { integrateLoyaltyEvents, findIntegrationTargets, analyzeFileForIntegration };