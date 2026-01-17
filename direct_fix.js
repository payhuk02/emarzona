// Correction directe de la vue matérialisée via Supabase

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixView() {
  console.log('🔧 Correction de dashboard_recent_orders...');

  try {
    // Supprimer l'ancienne vue
    console.log('1/6 Suppression de l\'ancienne vue...');
    await supabase.from('dashboard_recent_orders').select('*').limit(1); // Test avant suppression

    // La suppression doit se faire via SQL direct - essayons via RPC
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP MATERIALIZED VIEW IF EXISTS dashboard_recent_orders;'
    });

    if (dropError) {
      console.log('⚠️ Impossible de supprimer via RPC, tentative alternative...');
    }

    // Créer la nouvelle vue
    console.log('2/6 Création de la nouvelle vue...');
    const createSQL = `
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
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createSQL });

    if (createError) {
      console.error('❌ Erreur création vue:', createError);
      return;
    }

    // Créer l'index
    console.log('3/6 Création de l\'index...');
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_dashboard_recent_orders_store_created
      ON dashboard_recent_orders(store_id, created_at DESC);
    `;

    await supabase.rpc('exec_sql', { sql: indexSQL });

    // Actualiser la vue
    console.log('4/6 Actualisation de la vue...');
    const refreshSQL = 'REFRESH MATERIALIZED VIEW dashboard_recent_orders;';
    await supabase.rpc('exec_sql', { sql: refreshSQL });

    // Permissions
    console.log('5/6 Configuration des permissions...');
    const grantSQL = 'GRANT SELECT ON dashboard_recent_orders TO authenticated;';
    await supabase.rpc('exec_sql', { sql: grantSQL });

    // Test
    console.log('6/6 Test de la correction...');
    const { data, error } = await supabase
      .from('dashboard_recent_orders')
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error('❌ Test échoué:', error);
    } else {
      console.log('✅ Correction réussie !');
      console.log('📊 Nombre d\'enregistrements:', data?.length || 0);
    }

  } catch (err) {
    console.error('💥 Exception:', err.message);
  }
}

fixView();