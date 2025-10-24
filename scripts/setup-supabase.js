/**
 * Script de vérification et d'aide pour la configuration Supabase
 * Payhuk - Boutique Analytics & Storage Setup
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Charger les variables d'environnement
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variables d\'environnement manquantes!');
  console.error('Assurez-vous que VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY sont définis.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ========================================
// Couleurs pour le terminal
// ========================================
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n`),
};

// ========================================
// Vérification des tables
// ========================================
async function checkTables() {
  log.title('📊 Vérification des tables...');

  const tables = [
    'stores',
    'products',
    'orders',
    'customers',
    'store_analytics_events',
    'store_daily_stats',
  ];

  let allTablesExist = true;

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          log.error(`Table "${table}" n'existe pas`);
          allTablesExist = false;
        } else {
          log.warning(`Table "${table}" - Erreur: ${error.message}`);
        }
      } else {
        log.success(`Table "${table}" existe`);
      }
    } catch (err) {
      log.error(`Table "${table}" - Erreur: ${err.message}`);
      allTablesExist = false;
    }
  }

  return allTablesExist;
}

// ========================================
// Vérification du bucket Storage
// ========================================
async function checkStorageBucket() {
  log.title('🗄️  Vérification du bucket Storage...');

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      log.error(`Impossible de lister les buckets: ${error.message}`);
      return false;
    }

    const storeImagesBucket = buckets?.find((b) => b.name === 'store-images');

    if (storeImagesBucket) {
      log.success('Bucket "store-images" existe');
      log.info(`  - Public: ${storeImagesBucket.public ? 'Oui' : 'Non'}`);
      log.info(`  - ID: ${storeImagesBucket.id}`);
      return true;
    } else {
      log.error('Bucket "store-images" n\'existe pas');
      return false;
    }
  } catch (err) {
    log.error(`Erreur lors de la vérification: ${err.message}`);
    return false;
  }
}

// ========================================
// Test d'upload dans le bucket
// ========================================
async function testUpload() {
  log.title('📤 Test d\'upload...');

  try {
    // Créer un fichier de test
    const testFileName = `test_${Date.now()}.txt`;
    const testContent = 'Test upload Payhuk';

    const { data, error } = await supabase.storage
      .from('store-images')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
      });

    if (error) {
      log.error(`Échec de l'upload: ${error.message}`);
      return false;
    }

    log.success('Upload réussi!');
    log.info(`  - Fichier: ${testFileName}`);

    // Nettoyer le fichier de test
    await supabase.storage.from('store-images').remove([testFileName]);
    log.info('  - Fichier de test supprimé');

    return true;
  } catch (err) {
    log.error(`Erreur lors du test: ${err.message}`);
    return false;
  }
}

// ========================================
// Vérification de l'authentification
// ========================================
async function checkAuth() {
  log.title('🔐 Vérification de l\'authentification...');

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      log.warning('Aucune session active (normal si pas connecté)');
      return true;
    }

    if (data.session) {
      log.success('Session active trouvée');
      log.info(`  - User: ${data.session.user.email}`);
    } else {
      log.info('Aucune session active');
    }

    return true;
  } catch (err) {
    log.error(`Erreur: ${err.message}`);
    return false;
  }
}

// ========================================
// Instructions de configuration
// ========================================
function printSetupInstructions(tablesOk, storageOk) {
  console.log('\n' + '='.repeat(60));
  log.title('📋 INSTRUCTIONS DE CONFIGURATION');

  if (!tablesOk) {
    console.log(`${colors.yellow}Tables Analytics manquantes:${colors.reset}\n`);
    console.log('1. Allez sur: https://supabase.com/dashboard/project/' + process.env.VITE_SUPABASE_PROJECT_ID);
    console.log('2. Cliquez sur "SQL Editor" dans le menu de gauche');
    console.log('3. Cliquez sur "New Query"');
    console.log('4. Copiez-collez le contenu du fichier: supabase_analytics_tables.sql');
    console.log('5. Cliquez sur "Run" (ou appuyez sur Ctrl+Enter)');
    console.log('6. Vérifiez que les tables sont créées sans erreur\n');
  }

  if (!storageOk) {
    console.log(`${colors.yellow}Bucket Storage manquant:${colors.reset}\n`);
    console.log('1. Allez sur: https://supabase.com/dashboard/project/' + process.env.VITE_SUPABASE_PROJECT_ID + '/storage/buckets');
    console.log('2. Cliquez sur "New bucket"');
    console.log('3. Configurez:');
    console.log('   - Name: store-images');
    console.log('   - Public bucket: ✓ (coché)');
    console.log('   - File size limit: 5 MB');
    console.log('4. Cliquez sur "Create bucket"');
    console.log('5. Configurez les politiques RLS (voir SUPABASE_STORAGE_SETUP.md)\n');
  }

  if (tablesOk && storageOk) {
    console.log(`${colors.green}${colors.bright}✨ Tout est configuré correctement!${colors.reset}\n`);
    console.log('Vous pouvez maintenant:');
    console.log('  - Uploader des images de boutique');
    console.log('  - Tracker les analytics');
    console.log('  - Utiliser toutes les fonctionnalités de la page Boutique\n');
  }

  console.log('='.repeat(60) + '\n');
}

// ========================================
// Fonction principale
// ========================================
async function main() {
  console.clear();
  
  log.title('🚀 PAYHUK - Configuration Supabase');
  log.info('Projet: ' + process.env.VITE_SUPABASE_PROJECT_ID);
  log.info('URL: ' + process.env.VITE_SUPABASE_URL);

  // Vérifications
  const authOk = await checkAuth();
  const tablesOk = await checkTables();
  const storageOk = await checkStorageBucket();

  // Test d'upload si le bucket existe
  let uploadOk = false;
  if (storageOk) {
    uploadOk = await testUpload();
  }

  // Résumé
  log.title('📊 RÉSUMÉ');
  console.log(`Authentification: ${authOk ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`Tables: ${tablesOk ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`Bucket Storage: ${storageOk ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  if (storageOk) {
    console.log(`Upload Test: ${uploadOk ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  }

  // Instructions si nécessaire
  if (!tablesOk || !storageOk) {
    printSetupInstructions(tablesOk, storageOk);
  } else {
    printSetupInstructions(true, true);
  }
}

// Exécuter
main().catch((err) => {
  log.error('Erreur fatale: ' + err.message);
  process.exit(1);
});

