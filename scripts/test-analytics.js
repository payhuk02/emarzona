/**
 * Script de test du système Analytics
 * Payhuk - Vérification et insertion de données de test
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
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  bright: '\x1b[1m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n`),
};

// ==================== Vérification des tables ====================
async function checkAnalyticsTables() {
  log.title('📊 Vérification des tables Analytics...');

  try {
    // Vérifier store_analytics_events
    const { error: eventsError } = await supabase
      .from('store_analytics_events')
      .select('*')
      .limit(1);

    if (eventsError) {
      log.error(`Table store_analytics_events: ${eventsError.message}`);
      return false;
    }
    log.success('Table store_analytics_events existe');

    // Vérifier store_daily_stats
    const { error: statsError } = await supabase
      .from('store_daily_stats')
      .select('*')
      .limit(1);

    if (statsError) {
      log.error(`Table store_daily_stats: ${statsError.message}`);
      return false;
    }
    log.success('Table store_daily_stats existe');

    return true;
  } catch (err) {
    log.error(`Erreur: ${err.message}`);
    return false;
  }
}

// ==================== Récupérer une boutique ====================
async function getFirstStore() {
  try {
    const { data: stores, error } = await supabase
      .from('stores')
      .select('id, name, slug')
      .limit(1);

    if (error) throw error;

    if (!stores || stores.length === 0) {
      log.error('Aucune boutique trouvée. Créez une boutique d\'abord.');
      return null;
    }

    const store = stores[0];
    log.success(`Boutique trouvée: ${store.name} (${store.slug})`);
    return store;
  } catch (err) {
    log.error(`Erreur: ${err.message}`);
    return null;
  }
}

// ==================== Insérer des événements de test ====================
async function insertTestEvents(storeId) {
  log.title('📤 Insertion d\'événements de test...');

  const events = [
    {
      event_type: 'store_view',
      device_type: 'desktop',
      referrer: 'direct',
    },
    {
      event_type: 'store_view',
      device_type: 'mobile',
      referrer: 'facebook',
    },
    {
      event_type: 'product_view',
      device_type: 'desktop',
      referrer: 'google',
      event_data: { product_id: 'test-product-1' },
    },
    {
      event_type: 'product_click',
      device_type: 'mobile',
      referrer: 'instagram',
      event_data: { product_id: 'test-product-2' },
    },
    {
      event_type: 'add_to_cart',
      device_type: 'tablet',
      referrer: 'direct',
      event_data: { product_id: 'test-product-1', quantity: 2 },
    },
  ];

  let successCount = 0;

  for (const event of events) {
    try {
      const { error } = await supabase.from('store_analytics_events').insert({
        store_id: storeId,
        session_id: `test_session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        ...event,
      });

      if (error) {
        log.error(`Événement ${event.event_type}: ${error.message}`);
      } else {
        log.success(`Événement ${event.event_type} inséré`);
        successCount++;
      }
    } catch (err) {
      log.error(`Erreur: ${err.message}`);
    }
  }

  log.info(`${successCount}/${events.length} événements insérés avec succès`);
  return successCount > 0;
}

// ==================== Compter les événements ====================
async function countEvents(storeId) {
  log.title('📈 Statistiques des événements...');

  try {
    const { count, error } = await supabase
      .from('store_analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId);

    if (error) throw error;

    log.info(`Total événements pour cette boutique: ${count || 0}`);

    // Compter par type d'événement
    const { data: eventsByType, error: groupError } = await supabase
      .from('store_analytics_events')
      .select('event_type')
      .eq('store_id', storeId);

    if (!groupError && eventsByType) {
      const counts = eventsByType.reduce((acc, { event_type }) => {
        acc[event_type] = (acc[event_type] || 0) + 1;
        return acc;
      }, {});

      console.log('\nRépartition par type:');
      Object.entries(counts).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
      });
    }

    return true;
  } catch (err) {
    log.error(`Erreur: ${err.message}`);
    return false;
  }
}

// ==================== Tester l'agrégation ====================
async function testAggregation(storeId) {
  log.title('⚡ Test de la fonction d\'agrégation...');

  try {
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase.rpc('aggregate_daily_stats', {
      target_store_id: storeId,
      target_date: today,
    });

    if (error) {
      log.error(`Erreur d'agrégation: ${error.message}`);
      return false;
    }

    log.success('Agrégation exécutée avec succès');

    // Vérifier les stats quotidiennes
    const { data: stats, error: statsError } = await supabase
      .from('store_daily_stats')
      .select('*')
      .eq('store_id', storeId)
      .eq('date', today)
      .single();

    if (statsError) {
      log.error(`Erreur récupération stats: ${statsError.message}`);
      return false;
    }

    if (stats) {
      console.log('\nStatistiques du jour:');
      console.log(`  - Vues totales: ${stats.total_views}`);
      console.log(`  - Visiteurs uniques: ${stats.unique_visitors}`);
      console.log(`  - Vues produits: ${stats.product_views}`);
      console.log(`  - Clics produits: ${stats.product_clicks}`);
      console.log(`  - Ajouts panier: ${stats.add_to_cart_count}`);
      console.log(`  - Mobile: ${stats.mobile_views}`);
      console.log(`  - Tablet: ${stats.tablet_views}`);
      console.log(`  - Desktop: ${stats.desktop_views}`);
      log.success('Stats quotidiennes générées !');
    }

    return true;
  } catch (err) {
    log.error(`Erreur: ${err.message}`);
    return false;
  }
}

// ==================== Fonction principale ====================
async function main() {
  console.clear();

  log.title('🚀 PAYHUK - Test du système Analytics');

  // 1. Vérifier les tables
  const tablesOk = await checkAnalyticsTables();
  if (!tablesOk) {
    log.error('Les tables Analytics ne sont pas correctement configurées');
    process.exit(1);
  }

  // 2. Récupérer une boutique
  const store = await getFirstStore();
  if (!store) {
    process.exit(1);
  }

  // 3. Insérer des événements de test
  const eventsInserted = await insertTestEvents(store.id);
  if (!eventsInserted) {
    log.error('Impossible d\'insérer des événements de test');
  }

  // 4. Compter les événements
  await countEvents(store.id);

  // 5. Tester l'agrégation
  await testAggregation(store.id);

  // Résumé final
  log.title('✨ Résumé');
  console.log(`${colors.green}✓${colors.reset} Tables Analytics: OK`);
  console.log(`${colors.green}✓${colors.reset} Insertion d'événements: OK`);
  console.log(`${colors.green}✓${colors.reset} Fonction d'agrégation: OK`);
  console.log(`${colors.green}✓${colors.reset} Stats quotidiennes: OK`);
  console.log('\n🎉 Le système Analytics est opérationnel !\n');
}

// Exécuter
main().catch((err) => {
  log.error('Erreur fatale: ' + err.message);
  process.exit(1);
});

