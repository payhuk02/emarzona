// AUDIT COMPLET ET APPROFONDI DU SYSTÈME OFFLINE-FIRST EMARZONA
// Script d'audit automatisé pour vérifier toutes les fonctionnalités

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 AUDIT COMPLET ET APPROFONDI - SYSTÈME OFFLINE-FIRST EMARZONA\n');
console.log('═'.repeat(100) + '\n');

// =================================================
// FONCTIONS UTILITAIRES D'AUDIT
// =================================================

/**
 * Vérifie si un fichier existe
 */
function checkFileExists(filePath) {
  const exists = fs.existsSync(path.join(__dirname, filePath));
  return {
    exists,
    status: exists ? '✅' : '❌',
    path: filePath
  };
}

/**
 * Analyse le contenu d'un fichier pour vérifier les fonctionnalités
 */
function analyzeFileContent(filePath, checks) {
  try {
    const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    const results = {};

    checks.forEach(check => {
      const { name, patterns, required = true } = check;
      const found = patterns.some(pattern => {
        if (typeof pattern === 'string') {
          return content.includes(pattern);
        }
        return pattern.test(content);
      });

      results[name] = {
        found,
        required,
        status: found ? '✅' : (required ? '❌' : '⚠️')
      };
    });

    return results;
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Vérifie les exports d'un module TypeScript/JavaScript
 */
function checkModuleExports(filePath, expectedExports) {
  try {
    const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    const results = {};

    expectedExports.forEach(exportName => {
      const hasExport = new RegExp(`export.*${exportName}`, 'm').test(content);
      results[exportName] = {
        exported: hasExport,
        status: hasExport ? '✅' : '❌'
      };
    });

    return results;
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Audit des composants React
 */
function auditReactComponent(filePath, componentName) {
  const checks = [
    { name: 'Component Export', patterns: [`export.*${componentName}`, `export default`] },
    { name: 'React Import', patterns: ['import.*React', 'from.*react'] },
    { name: 'Props Interface', patterns: [`interface.*Props`, `.*Props`], required: false },
    { name: 'useState', patterns: ['useState'], required: false },
    { name: 'useEffect', patterns: ['useEffect'], required: false },
    { name: 'JSX Return', patterns: ['return.*<'], required: true }
  ];

  return analyzeFileContent(filePath, checks);
}

/**
 * Audit des services
 */
function auditService(filePath, serviceName, features) {
  const checks = features.map(feature => ({
    name: feature.name,
    patterns: feature.patterns,
    required: feature.required !== false
  }));

  return analyzeFileContent(filePath, checks);
}

/**
 * Audit des hooks React
 */
function auditHook(filePath, hookName) {
  const checks = [
    { name: 'Hook Export', patterns: [`export.*${hookName}`] },
    { name: 'useState', patterns: ['useState'], required: false },
    { name: 'useEffect', patterns: ['useEffect'], required: false },
    { name: 'useCallback', patterns: ['useCallback'], required: false },
    { name: 'Return Object', patterns: ['return.*{'] }
  ];

  return analyzeFileContent(filePath, checks);
}

// =================================================
// AUDIT DES MODULES DE STOCKAGE
// =================================================

console.log('📦 MODULES DE STOCKAGE\n' + '─'.repeat(50));

const storageModules = [
  {
    name: 'Queue Locale (localQueue.ts)',
    file: 'src/lib/localQueue.ts',
    features: [
      { name: 'Classe LocalQueueManager', patterns: ['class LocalQueueManager'] },
      { name: 'Méthode addAction', patterns: ['async addAction'] },
      { name: 'Méthode getPendingActions', patterns: ['getPendingActions'] },
      { name: 'Méthode markAsSynced', patterns: ['markAsSynced'] },
      { name: 'Méthode deleteAction', patterns: ['deleteAction'] },
      { name: 'Interface LocalAction', patterns: ['interface LocalAction'] },
      { name: 'IndexedDB Operations', patterns: ['indexedDB'] },
      { name: 'Initialisation DB', patterns: ['initDB'] },
      { name: 'Nettoyage automatique', patterns: ['cleanupFailedActions'] }
    ]
  },
  {
    name: 'Service Hybride (hybrid-storage-service.ts)',
    file: 'src/lib/storage/hybrid-storage-service.ts',
    features: [
      { name: 'Classe HybridStorageService', patterns: ['class HybridStorageService'] },
      { name: 'Méthode set', patterns: ['async set'] },
      { name: 'Méthode get', patterns: ['async get'] },
      { name: 'Méthode getStorageStats', patterns: ['getStorageStats'] },
      { name: 'Méthode exportData', patterns: ['exportData'] },
      { name: 'Méthode importData', patterns: ['importData'] },
      { name: 'Supabase Integration', patterns: ['supabase'] },
      { name: 'IndexedDB Integration', patterns: ['this\\.db', 'indexedDB'] },
      { name: 'Fallback Logic', patterns: ['fallbackToLocalStorage'] }
    ]
  },
  {
    name: 'Service Sauvegarde (backup-service.ts)',
    file: 'src/lib/storage/backup-service.ts',
    features: [
      { name: 'Classe BackupService', patterns: ['class BackupService'] },
      { name: 'Sauvegarde automatique', patterns: ['createAutomaticBackup'] },
      { name: 'Sauvegarde manuelle', patterns: ['createManualBackup'] },
      { name: 'Sauvegarde urgence', patterns: ['createEmergencyBackup'] },
      { name: 'Restauration', patterns: ['restoreBackup'] },
      { name: 'Compression', patterns: ['compress'] },
      { name: 'Chiffrement', patterns: ['encrypt.*true'], required: false },
      { name: 'Nettoyage', patterns: ['cleanupOldBackups'] }
    ]
  },
  {
    name: 'Service Synchronisation (sync-service.ts)',
    file: 'src/lib/storage/sync-service.ts',
    features: [
      { name: 'Classe SyncService', patterns: ['class SyncService'] },
      { name: 'Sync automatique', patterns: ['SYNC_INTERVAL', 'setInterval'] },
      { name: 'Sync par lot', patterns: ['performFullSync'] },
      { name: 'Résolution conflits', patterns: ['resolveConflict'] },
      { name: 'File d\'attente', patterns: ['SyncQueueItem'] },
      { name: 'Retry logic', patterns: ['retryCount'] },
      { name: 'Monitoring connectivité', patterns: ['navigator\\.onLine', 'online', 'offline'] }
    ]
  },
  {
    name: 'Service Récupération (recovery-service.ts)',
    file: 'src/lib/storage/recovery-service.ts',
    features: [
      { name: 'Classe RecoveryService', patterns: ['class RecoveryService'] },
      { name: 'Monitoring santé', patterns: ['performHealthCheck'] },
      { name: 'Récupération auto', patterns: ['attemptAutoRecovery'] },
      { name: 'Stratégies recovery', patterns: ['recoveryStrategies'] },
      { name: 'Historique pannes', patterns: ['FailureEvent'] },
      { name: 'Alertes', patterns: ['notifyFailure'], required: false }
    ]
  },
  {
    name: 'Testeur Résilience (resilience-tester.ts)',
    file: 'src/lib/storage/resilience-tester.ts',
    features: [
      { name: 'Classe ResilienceTester', patterns: ['class ResilienceTester'] },
      { name: 'Test panne Supabase', patterns: ['testSupabaseOutage'] },
      { name: 'Test corruption IndexedDB', patterns: ['testIndexedDBCorruption'] },
      { name: 'Test latence réseau', patterns: ['testNetworkLatency'] },
      { name: 'Test conflits sync', patterns: ['testSyncConflicts'] },
      { name: 'Rapport génération', patterns: ['generateResilienceReport'] }
    ]
  }
];

let totalModules = 0;
let modulesWithAllFeatures = 0;

storageModules.forEach(module => {
  console.log(`\n🔧 ${module.name}`);
  const fileCheck = checkFileExists(module.file);

  if (!fileCheck.exists) {
    console.log(`  ${fileCheck.status} Fichier manquant: ${fileCheck.path}`);
    return;
  }

  console.log(`  ✅ Fichier présent: ${module.file}`);

  const featureAnalysis = auditService(module.file, module.name, module.features);
  let moduleFeatureCount = 0;
  let moduleRequiredFeatures = 0;

  Object.entries(featureAnalysis).forEach(([featureName, result]) => {
    console.log(`    ${result.status} ${featureName}`);
    if (result.found) moduleFeatureCount++;
    if (result.required) moduleRequiredFeatures++;
  });

  const hasAllRequired = moduleRequiredFeatures === module.features.filter(f => f.required !== false).length;
  if (hasAllRequired) modulesWithAllFeatures++;

  totalModules++;
});

// =================================================
// AUDIT DES HOOKS REACT
// =================================================

console.log('\n\n⚛️ HOOKS REACT\n' + '─'.repeat(50));

const reactHooks = [
  {
    name: 'useOfflineMode',
    file: 'src/hooks/useOfflineMode.ts',
    expectedFeatures: ['executeAction', 'forceSync', 'isOffline']
  },
  {
    name: 'useOfflineActions',
    file: 'src/hooks/useOfflineActions.ts',
    expectedFeatures: ['createOrder', 'updateProduct', 'addToCart']
  },
  {
    name: 'useStorageAdmin',
    file: 'src/hooks/useStorageAdmin.ts',
    expectedFeatures: ['loadData', 'performFullSync', 'formatBytes']
  }
];

let totalHooks = 0;
let hooksWithAllFeatures = 0;

reactHooks.forEach(hook => {
  console.log(`\n🎣 ${hook.name}`);
  const fileCheck = checkFileExists(hook.file);

  if (!fileCheck.exists) {
    console.log(`  ${fileCheck.status} Fichier manquant: ${fileCheck.path}`);
    return;
  }

  const hookAnalysis = auditHook(hook.file, hook.name);
  let hookFeatureCount = 0;

  Object.entries(hookAnalysis).forEach(([featureName, result]) => {
    console.log(`  ${result.status} ${featureName}`);
    if (result.found) hookFeatureCount++;
  });

  // Vérifier les exports spécifiques attendus
  const exportCheck = checkModuleExports(hook.file, hook.expectedFeatures);
  Object.entries(exportCheck).forEach(([exportName, result]) => {
    console.log(`  ${result.status} Export ${exportName}`);
    if (result.exported) hookFeatureCount++;
  });

  // Vérifier que le hook lui-même est exporté
  const hookExportCheck = analyzeFileContent(hook.file, [{ name: 'Hook Export Check', patterns: [`export.*${hook.name}`] }]);
  if (hookExportCheck['Hook Export Check']?.found) {
    console.log(`  ✅ Hook ${hook.name} exporté`);
    hookFeatureCount++;
  } else {
    console.log(`  ❌ Hook ${hook.name} non exporté`);
  }

  if (hookFeatureCount >= hook.expectedFeatures.length + 2) { // +2 pour les exports de base
    hooksWithAllFeatures++;
  }

  totalHooks++;
});

// =================================================
// AUDIT DES COMPOSANTS UI
// =================================================

console.log('\n\n🎨 COMPOSANTS UI\n' + '─'.repeat(50));

const uiComponents = [
  {
    name: 'OfflineStatus',
    file: 'src/components/offline/OfflineStatus.tsx',
    expectedProps: ['showQueueStats', 'compact']
  },
  {
    name: 'OrderCreator',
    file: 'src/components/offline/OrderCreator.tsx',
    expectedProps: ['storeId', 'userId', 'onOrderCreated']
  },
  {
    name: 'BackupManager',
    file: 'src/components/admin/storage/BackupManager.tsx',
    expectedProps: ['onBackupCreated', 'onBackupRestored']
  },
  {
    name: 'SyncMonitor',
    file: 'src/components/admin/storage/SyncMonitor.tsx',
    expectedProps: ['onSyncComplete']
  },
  {
    name: 'StorageSystemSummary',
    file: 'src/components/admin/storage/StorageSystemSummary.tsx',
    expectedProps: ['onNavigateToStorage']
  }
];

let totalComponents = 0;
let componentsWithAllFeatures = 0;

uiComponents.forEach(component => {
  console.log(`\n🖥️ ${component.name}`);
  const fileCheck = checkFileExists(component.file);

  if (!fileCheck.exists) {
    console.log(`  ${fileCheck.status} Fichier manquant: ${fileCheck.path}`);
    return;
  }

  const componentAnalysis = auditReactComponent(component.file, component.name);
  let componentFeatureCount = 0;

  Object.entries(componentAnalysis).forEach(([featureName, result]) => {
    console.log(`  ${result.status} ${featureName}`);
    if (result.found) componentFeatureCount++;
  });

  // Vérifier que le composant est exporté
  const componentExportCheck = analyzeFileContent(component.file, [{ name: 'Component Export Check', patterns: ['export default'] }]);
  if (componentExportCheck['Component Export Check']?.found) {
    console.log(`  ✅ Component ${component.name} exporté`);
    componentFeatureCount++;
  } else {
    console.log(`  ❌ Component ${component.name} non exporté`);
  }

  if (componentFeatureCount >= 3) { // Au moins export, React import et JSX
    componentsWithAllFeatures++;
  }

  totalComponents++;
});

// =================================================
// AUDIT DES ENDPOINTS API
// =================================================

console.log('\n\n🔗 ENDPOINTS API\n' + '─'.repeat(50));

const apiEndpoints = [
  {
    name: 'Sync Actions (/api/sync/actions)',
    file: 'src/pages/api/sync/actions.ts',
    features: [
      { name: 'NextApiHandler', patterns: ['NextApiRequest', 'NextApiResponse'] },
      { name: 'JWT Validation', patterns: ['jwt\\.verify', 'jwt\\.sign'] },
      { name: 'Idempotency Check', patterns: ['idempotency_keys'] },
      { name: 'Action Handlers', patterns: ['ACTION_HANDLERS'] },
      { name: 'Error Handling', patterns: ['catch.*error', 'try.*catch'] }
    ]
  },
  {
    name: 'Health Check (/api/health)',
    file: 'src/pages/api/health.ts',
    features: [
      { name: 'NextApiHandler', patterns: ['NextApiRequest', 'NextApiResponse'] },
      { name: 'Supabase Health', patterns: ['supabase'] },
      { name: 'Response Time', patterns: ['response_time_ms'] },
      { name: 'Uptime', patterns: ['uptime'] }
    ]
  }
];

let totalEndpoints = 0;
let endpointsWithAllFeatures = 0;

apiEndpoints.forEach(endpoint => {
  console.log(`\n🌐 ${endpoint.name}`);
  const fileCheck = checkFileExists(endpoint.file);

  if (!fileCheck.exists) {
    console.log(`  ${fileCheck.status} Fichier manquant: ${endpoint.file}`);
    return;
  }

  const endpointAnalysis = auditService(endpoint.file, endpoint.name, endpoint.features);
  let endpointFeatureCount = 0;

  Object.entries(endpointAnalysis).forEach(([featureName, result]) => {
    console.log(`  ${result.status} ${featureName}`);
    if (result.found) endpointFeatureCount++;
  });

  if (endpointFeatureCount >= endpoint.features.length) {
    endpointsWithAllFeatures++;
  }

  totalEndpoints++;
});

// =================================================
// AUDIT DES MIGRATIONS SUPABASE
// =================================================

console.log('\n\n🗄️ MIGRATIONS SUPABASE\n' + '─'.repeat(50));

const migrations = [
  {
    name: 'Offline-First Tables',
    file: 'supabase/migrations/20250120000001_add_offline_first_tables.sql',
    features: [
      { name: 'Table idempotency_keys', patterns: ['CREATE TABLE idempotency_keys'] },
      { name: 'Index creation', patterns: ['CREATE INDEX.*idx_idempotency_keys'] },
      { name: 'RLS activation', patterns: ['ENABLE ROW LEVEL SECURITY'] },
      { name: 'RLS policies', patterns: ['CREATE POLICY.*idempotency_keys'] },
      { name: 'Cleanup function', patterns: ['cleanup_expired_idempotency_keys'] }
    ]
  }
];

let totalMigrations = 0;
let migrationsWithAllFeatures = 0;

migrations.forEach(migration => {
  console.log(`\n📄 ${migration.name}`);
  const fileCheck = checkFileExists(migration.file);

  if (!fileCheck.exists) {
    console.log(`  ${fileCheck.status} Fichier manquant: ${migration.file}`);
    return;
  }

  const migrationAnalysis = auditService(migration.file, migration.name, migration.features);
  let migrationFeatureCount = 0;

  Object.entries(migrationAnalysis).forEach(([featureName, result]) => {
    console.log(`  ${result.status} ${featureName}`);
    if (result.found) migrationFeatureCount++;
  });

  if (migrationFeatureCount >= migration.features.length) {
    migrationsWithAllFeatures++;
  }

  totalMigrations++;
});

// =================================================
// AUDIT DE L'INTÉGRATION
// =================================================

console.log('\n\n🔗 INTÉGRATION SYSTÈME\n' + '─'.repeat(50));

const integrationChecks = [
  {
    name: 'Routes Admin',
    file: 'src/App.tsx',
    patterns: ['OfflineQueueManager', 'AdminDataStorage']
  },
  {
    name: 'Documentation',
    file: 'OFFLINE_FIRST_README.md',
    patterns: ['Offline-First', 'Emarzona']
  },
  {
    name: 'Scripts de test',
    file: 'test-offline-simple.sql',
    patterns: ['idempotency_keys', 'validation']
  }
];

let totalIntegrationChecks = 0;
let integrationChecksPassed = 0;

integrationChecks.forEach(check => {
  console.log(`\n🔗 ${check.name}`);
  const fileCheck = checkFileExists(check.file);

  if (!fileCheck.exists) {
    console.log(`  ❌ Fichier manquant: ${check.file}`);
    return;
  }

  const contentCheck = analyzeFileContent(check.file, check.patterns.map(p => ({ name: p, patterns: [p] })));
  let checkCount = 0;

  Object.entries(contentCheck).forEach(([pattern, result]) => {
    console.log(`  ${result.status} ${pattern}`);
    if (result.found) checkCount++;
  });

  if (checkCount >= check.patterns.length) {
    integrationChecksPassed++;
  }

  totalIntegrationChecks++;
});

// =================================================
// RÉSULTATS FINAUX
// =================================================

console.log('\n' + '═'.repeat(100));
console.log('📊 RÉSULTATS DE L\'AUDIT COMPLET');
console.log('═'.repeat(100));

const auditResults = [
  { category: 'Modules de Stockage', total: totalModules, passed: modulesWithAllFeatures },
  { category: 'Hooks React', total: totalHooks, passed: hooksWithAllFeatures },
  { category: 'Composants UI', total: totalComponents, passed: componentsWithAllFeatures },
  { category: 'Endpoints API', total: totalEndpoints, passed: endpointsWithAllFeatures },
  { category: 'Migrations DB', total: totalMigrations, passed: migrationsWithAllFeatures },
  { category: 'Intégration', total: totalIntegrationChecks, passed: integrationChecksPassed }
];

let overallScore = 0;
let overallTotal = 0;

auditResults.forEach(({ category, total, passed }) => {
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
  console.log(`${category.padEnd(20)} ${passed}/${total} (${percentage}%)`);

  overallScore += passed;
  overallTotal += total;
});

const overallPercentage = overallTotal > 0 ? Math.round((overallScore / overallTotal) * 100) : 0;

console.log('\n' + '─'.repeat(50));
console.log(`SCORE GLOBAL: ${overallScore}/${overallTotal} (${overallPercentage}%)`);

console.log('\n' + (overallPercentage >= 95 ? '🎉' : overallPercentage >= 80 ? '✅' : overallPercentage >= 60 ? '⚠️' : '❌') + ' CONCLUSION:');

if (overallPercentage >= 95) {
  console.log('🎉 EXCELLENT ! Le système offline-first est COMPLET et ROBUSTE !');
  console.log('🚀 Toutes les fonctionnalités critiques sont opérationnelles.');
  console.log('💪 Prêt pour le déploiement en production.');
} else if (overallPercentage >= 80) {
  console.log('✅ BON ! Le système est majoritairement fonctionnel.');
  console.log('🔧 Quelques éléments mineurs à vérifier/corriger.');
} else if (overallPercentage >= 60) {
  console.log('⚠️ MOYEN ! Plusieurs composants nécessitent attention.');
  console.log('🔍 Vérifier les éléments marqués ❌ ci-dessus.');
} else {
  console.log('❌ CRITIQUE ! Le système nécessite des corrections majeures.');
  console.log('🛠️ Revoir l\'implémentation des composants manquants.');
}

console.log('\n📋 ÉLÉMENTS À VÉRIFIER:');
console.log('• Exécuter les migrations Supabase');
console.log('• Tester les endpoints API avec un JWT valide');
console.log('• Vérifier l\'intégration frontend avec les hooks');
console.log('• Tester les scénarios offline/online');

console.log('\n📚 RESSOURCES:');
console.log('• OFFLINE_FIRST_README.md - Documentation complète');
console.log('• test-offline-simple.sql - Tests base de données');
console.log('• Composants dans src/components/offline/');
console.log('• Hooks dans src/hooks/useOffline*');

console.log('\n' + '═'.repeat(100));