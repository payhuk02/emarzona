// Correction simple via l'API REST de Supabase
// Utilise les credentials du fichier .env

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Assurez-vous que .env contient VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleFix() {
  console.log('🔧 Correction directe de dashboard_recent_orders...');

  try {
    // Test de la fonction RPC actuelle pour voir l'erreur
    console.log('1/3 Test de l\'état actuel...');
    const testStoreId = '58874540-6553-45e3-bc98-14ea3808208c';

    const { error: currentError } = await supabase.rpc('get_dashboard_stats_rpc', {
      store_id: testStoreId,
      period_days: 30
    });

    if (currentError) {
      console.log('❌ État actuel - Erreur attendue:', currentError.message);
    }

    // Utiliser une approche différente : créer une fonction temporaire pour exécuter le SQL
    console.log('2/3 Tentative de correction via approche alternative...');

    // Essayer de créer une fonction temporaire pour exécuter notre SQL
    const createFixFunctionSQL = `
      CREATE OR REPLACE FUNCTION temp_fix_dashboard_view()
      RETURNS void
      LANGUAGE sql
      SECURITY DEFINER
      AS $$
        -- Supprimer l'ancienne vue
        DROP MATERIALIZED VIEW IF EXISTS dashboard_recent_orders;

        -- Créer la nouvelle vue corrigée
        CREATE MATERIALIZED VIEW dashboard_recent_orders AS
        SELECT
          o.id,
          o.order_number,
          o.total_amount,
          o.status,
          o.created_at,
          o.store_id,
          JSON_BUILD_OBJECT(
            'id', c.id,
            'name', c.name,
            'email', c.email
          ) as customer,
          COALESCE(ARRAY_AGG(DISTINCT p.product_type) FILTER (WHERE p.product_type IS NOT NULL), ARRAY[]::text[]) as product_types
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.created_at >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY o.id, o.order_number, o.total_amount, o.status, o.created_at, o.store_id, c.id, c.name, c.email
        ORDER BY o.created_at DESC;

        -- Créer l'index
        CREATE INDEX IF NOT EXISTS idx_dashboard_recent_orders_store_created
        ON dashboard_recent_orders(store_id, created_at DESC);

        -- Actualiser
        REFRESH MATERIALIZED VIEW dashboard_recent_orders;

        -- Permissions
        GRANT SELECT ON dashboard_recent_orders TO authenticated;
      $$;
    `;

    console.log('Création de la fonction temporaire...');
    // Note: Cette approche pourrait ne pas marcher si on n'a pas les droits

    // Alternative: utiliser une requête directe via fetch
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/temp_fix_dashboard_view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    });

    if (response.ok) {
      console.log('✅ Fonction temporaire créée, exécution...');

      // Appeler la fonction
      const execResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/temp_fix_dashboard_view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });

      if (execResponse.ok) {
        console.log('✅ Fonction exécutée avec succès');
      } else {
        console.error('❌ Échec exécution:', await execResponse.text());
      }

      // Nettoyer la fonction temporaire
      await fetch(`${supabaseUrl}/rest/v1/rpc/temp_fix_dashboard_view`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });

    } else {
      console.log('⚠️ Approche RPC impossible, tentative via interface Supabase...');
      console.log('📋 Veuillez exécuter ce SQL dans l\'éditeur SQL de Supabase:');
      console.log(`
-- Correction de dashboard_recent_orders

-- 1. Supprimer l'ancienne vue
DROP MATERIALIZED VIEW IF EXISTS dashboard_recent_orders;

-- 2. Créer la nouvelle vue
CREATE MATERIALIZED VIEW dashboard_recent_orders AS
SELECT
  o.id,
  o.order_number,
  o.total_amount,
  o.status,
  o.created_at,
  o.store_id,
  JSON_BUILD_OBJECT(
    'id', c.id,
    'name', c.name,
    'email', c.email
  ) as customer,
  COALESCE(ARRAY_AGG(DISTINCT p.product_type) FILTER (WHERE p.product_type IS NOT NULL), ARRAY[]::text[]) as product_types
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY o.id, o.order_number, o.total_amount, o.status, o.created_at, o.store_id, c.id, c.name, c.email
ORDER BY o.created_at DESC;

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_dashboard_recent_orders_store_created
ON dashboard_recent_orders(store_id, created_at DESC);

-- 4. Actualiser
REFRESH MATERIALIZED VIEW dashboard_recent_orders;

-- 5. Permissions
GRANT SELECT ON dashboard_recent_orders TO authenticated;
      `);
    }

    // Test final
    console.log('3/3 Test final...');
    const { data, error } = await supabase.rpc('get_dashboard_stats_rpc', {
      store_id: testStoreId,
      period_days: 30
    });

    if (error) {
      console.error('❌ Test final échoué:', error.message);
      console.log('🔧 Veuillez appliquer le SQL ci-dessus dans Supabase SQL Editor');
    } else {
      console.log('✅ Correction réussie ! Dashboard fonctionnel');
    }

  } catch (err) {
    console.error('💥 Exception:', err.message);
  }
}

simpleFix();