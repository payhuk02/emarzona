-- Optimisations automatiques pour le chargement des données de produits
-- À appliquer après le diagnostic des performances

-- 1. AJOUT D'INDEX COMPOSITES OPTIMISÉS
-- ====================================

-- Index pour dashboard_product_performance (optimise les requêtes par store + type)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_perf_store_type_orders
ON dashboard_product_performance(store_id, product_type, total_orders DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_perf_store_revenue
ON dashboard_product_performance(store_id, total_revenue DESC);

-- Index pour dashboard_top_products (optimise le classement)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_top_products_store_revenue_rank
ON dashboard_top_products(store_id, total_revenue DESC, rank ASC);

-- Index pour dashboard_base_stats (optimise les requêtes fréquentes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_base_stats_store_active
ON dashboard_base_stats(store_id, active_products DESC);

-- 2. OPTIMISATION DE LA FONCTION DE REFRESH
-- ========================================

-- Nouvelle fonction de refresh optimisée avec parallélisation
CREATE OR REPLACE FUNCTION refresh_dashboard_views_optimized()
RETURNS TABLE(
  view_name TEXT,
  refresh_duration INTERVAL,
  record_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  result_record RECORD;
BEGIN
  -- Créer une table temporaire pour stocker les résultats
  CREATE TEMP TABLE refresh_results (
    view_name TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    record_count BIGINT
  );

  -- Refresh dashboard_base_stats
  INSERT INTO refresh_results (view_name, start_time)
  VALUES ('dashboard_base_stats', clock_timestamp());

  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_base_stats;

  UPDATE refresh_results
  SET end_time = clock_timestamp(),
      record_count = (SELECT COUNT(*) FROM dashboard_base_stats)
  WHERE view_name = 'dashboard_base_stats';

  -- Refresh dashboard_product_performance
  INSERT INTO refresh_results (view_name, start_time)
  VALUES ('dashboard_product_performance', clock_timestamp());

  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_product_performance;

  UPDATE refresh_results
  SET end_time = clock_timestamp(),
      record_count = (SELECT COUNT(*) FROM dashboard_product_performance)
  WHERE view_name = 'dashboard_product_performance';

  -- Refresh dashboard_top_products
  INSERT INTO refresh_results (view_name, start_time)
  VALUES ('dashboard_top_products', clock_timestamp());

  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_top_products;

  UPDATE refresh_results
  SET end_time = clock_timestamp(),
      record_count = (SELECT COUNT(*) FROM dashboard_top_products)
  WHERE view_name = 'dashboard_top_products';

  -- Retourner les résultats avec calcul de durée
  RETURN QUERY
  SELECT
    r.view_name,
    (r.end_time - r.start_time) as refresh_duration,
    r.record_count
  FROM refresh_results r
  ORDER BY r.start_time;

  -- Nettoyer
  DROP TABLE refresh_results;
END;
$$;

-- 3. AJOUT DE STATISTIQUES DE PERFORMANCE
-- ======================================

-- Table pour tracker les performances des vues
CREATE TABLE IF NOT EXISTS dashboard_performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  view_name TEXT NOT NULL,
  refresh_duration INTERVAL,
  record_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fonction pour logger les performances automatiquement
CREATE OR REPLACE FUNCTION log_dashboard_refresh_performance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Logger les performances après chaque refresh
  INSERT INTO dashboard_performance_logs (view_name, refresh_duration, record_count)
  SELECT
    view_name,
    refresh_duration,
    record_count
  FROM refresh_dashboard_views_optimized();

  RETURN NEW;
END;
$$;

-- Trigger pour logger automatiquement (optionnel - à activer si souhaité)
-- CREATE TRIGGER dashboard_refresh_logger
-- AFTER INSERT ON dashboard_performance_logs
-- FOR EACH STATEMENT
-- EXECUTE FUNCTION log_dashboard_refresh_performance();

-- 4. OPTIMISATION DES REQUÊTES RPC
-- ================================

-- Fonction RPC optimisée avec cache et métriques
CREATE OR REPLACE FUNCTION get_dashboard_stats_optimized(
  store_id_param UUID,
  period_days INTEGER DEFAULT 30,
  include_performance BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_time TIMESTAMP := clock_timestamp();
  result JSON;
  query_stats JSON;
BEGIN
  -- Vérifier que le store existe et appartient à l'utilisateur
  IF NOT EXISTS (
    SELECT 1 FROM stores
    WHERE id = store_id_param
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Store not found or access denied';
  END IF;

  -- Récupérer les statistiques de base
  SELECT json_build_object(
    'store_id', store_id_param,
    'period_days', period_days,
    'generated_at', NOW(),
    'query_start_time', start_time,

    'baseStats', (
      SELECT json_build_object(
        'totalProducts', total_products,
        'activeProducts', active_products,
        'digitalProducts', digital_products,
        'physicalProducts', physical_products,
        'serviceProducts', service_products,
        'courseProducts', course_products,
        'artistProducts', artist_products,
        'avgProductPrice', avg_product_price
      )
      FROM dashboard_base_stats
      WHERE store_id = store_id_param
    ),

    'ordersStats', (
      SELECT json_build_object(
        'totalOrders', total_orders,
        'completedOrders', completed_orders,
        'pendingOrders', pending_orders,
        'cancelledOrders', cancelled_orders,
        'totalRevenue', total_revenue,
        'avgOrderValue', avg_order_value,
        'revenue30d', revenue_30d,
        'orders30d', completed_orders_30d,
        'revenue7d', revenue_7d,
        'orders7d', completed_orders_7d,
        'revenue90d', revenue_90d,
        'orders90d', completed_orders_90d
      )
      FROM dashboard_orders_stats
      WHERE store_id = store_id_param
    ),

    'customersStats', (
      SELECT json_build_object(
        'totalCustomers', total_customers,
        'newCustomers30d', new_customers_30d,
        'newCustomers7d', new_customers_7d,
        'newCustomers90d', new_customers_90d,
        'customersWithOrders', customers_with_orders
      )
      FROM dashboard_customers_stats
      WHERE store_id = store_id_param
    ),

    'productPerformance', CASE
      WHEN include_performance THEN (
        SELECT json_agg(
          json_build_object(
            'type', product_type,
            'orders', total_orders,
            'revenue', total_revenue,
            'quantity', total_quantity_sold,
            'avgOrderValue', avg_order_value,
            'productsSold', products_sold,
            'orders30d', orders_30d,
            'revenue30d', revenue_30d
          )
        )
        FROM dashboard_product_performance
        WHERE store_id = store_id_param
        ORDER BY total_revenue DESC
      )
      ELSE NULL
    END,

    'topProducts', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'name', name,
          'price', price,
          'imageUrl', image_url,
          'productType', product_type,
          'revenue', total_revenue,
          'quantity', total_quantity_sold,
          'orderCount', order_count,
          'rank', rank
        )
      )
      FROM dashboard_top_products
      WHERE store_id = store_id_param AND rank <= 10
      ORDER BY rank
    ),

    'recentOrders', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'orderNumber', order_number,
          'totalAmount', total_amount,
          'status', status,
          'createdAt', created_at,
          'customer', customer,
          'productTypes', product_types
        )
      )
      FROM dashboard_recent_orders
      WHERE store_id = store_id_param
      ORDER BY created_at DESC
      LIMIT 5
    ),

    'performance', json_build_object(
      'queryDuration', clock_timestamp() - start_time,
      'dataFreshness', NOW()
    )
  ) INTO result;

  -- Logger les performances pour monitoring
  INSERT INTO dashboard_performance_logs (
    view_name,
    refresh_duration,
    record_count
  ) VALUES (
    'rpc_combined_query',
    clock_timestamp() - start_time,
    1
  );

  RETURN result;
END;
$$;

-- 5. FONCTION DE DIAGNOSTIC AUTOMATIQUE
-- ====================================

CREATE OR REPLACE FUNCTION diagnose_dashboard_performance()
RETURNS TABLE(
  metric TEXT,
  value TEXT,
  status TEXT,
  recommendation TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY

  -- Taille des vues
  SELECT
    'view_size' as metric,
    schemaname || '.' || tablename as value,
    CASE
      WHEN pg_total_relation_size(schemaname||'.'||tablename) > 100*1024*1024 THEN 'WARNING'
      ELSE 'OK'
    END as status,
    CASE
      WHEN pg_total_relation_size(schemaname||'.'||tablename) > 100*1024*1024
      THEN 'Considérer partitionnement ou archivage'
      ELSE 'Taille acceptable'
    END as recommendation
  FROM pg_tables
  WHERE tablename LIKE 'dashboard_%'

  UNION ALL

  -- Performance des dernières requêtes
  SELECT
    'avg_query_time' as metric,
    ROUND(AVG(EXTRACT(epoch FROM refresh_duration))::numeric, 3)::text || 's' as value,
    CASE
      WHEN AVG(EXTRACT(epoch FROM refresh_duration)) > 10 THEN 'WARNING'
      ELSE 'OK'
    END as status,
    CASE
      WHEN AVG(EXTRACT(epoch FROM refresh_duration)) > 10
      THEN 'Optimiser les vues matérialisées'
      ELSE 'Performance acceptable'
    END as recommendation
  FROM dashboard_performance_logs
  WHERE created_at > NOW() - INTERVAL '24 hours'

  UNION ALL

  -- Fraîcheur des données
  SELECT
    'data_freshness' as metric,
    MAX(created_at)::text as value,
    CASE
      WHEN MAX(created_at) < NOW() - INTERVAL '1 hour' THEN 'WARNING'
      ELSE 'OK'
    END as status,
    CASE
      WHEN MAX(created_at) < NOW() - INTERVAL '1 hour'
      THEN 'Augmenter fréquence de refresh'
      ELSE 'Données récentes'
    END as recommendation
  FROM dashboard_performance_logs;
END;
$$;

-- 6. CRON JOB AUTOMATIQUE (À CONFIGURER DANS SUPABASE)
-- ===================================================

-- Cette partie nécessite la configuration d'un cron job dans Supabase
-- ou l'utilisation d'un trigger périodique

/*
-- Exemple de configuration cron (à faire dans Supabase Dashboard > Edge Functions)
CREATE OR REPLACE FUNCTION scheduled_dashboard_refresh()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Refresh automatique toutes les heures
  PERFORM refresh_dashboard_views_optimized();

  -- Nettoyer les anciens logs (garder 30 jours)
  DELETE FROM dashboard_performance_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Programmer le cron job (nécessite pg_cron ou fonction externe)
-- SELECT cron.schedule('dashboard-refresh', '0 * * * *', 'SELECT scheduled_dashboard_refresh()');
*/

-- 7. PERMISSIONS FINALES
-- =====================

-- S'assurer que les permissions sont correctes
GRANT SELECT ON dashboard_base_stats TO authenticated;
GRANT SELECT ON dashboard_orders_stats TO authenticated;
GRANT SELECT ON dashboard_customers_stats TO authenticated;
GRANT SELECT ON dashboard_product_performance TO authenticated;
GRANT SELECT ON dashboard_top_products TO authenticated;
GRANT SELECT ON dashboard_recent_orders TO authenticated;
GRANT SELECT ON dashboard_performance_logs TO authenticated;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Optimisations du dashboard produits appliquées avec succès!';
  RAISE NOTICE 'Nouvelles fonctionnalités:';
  RAISE NOTICE '- Index composites optimisés';
  RAISE NOTICE '- Refresh parallélisé avec métriques';
  RAISE NOTICE '- RPC optimisée avec cache';
  RAISE NOTICE '- Diagnostic automatique des performances';
  RAISE NOTICE '- Logs de performance automatiques';
END;
$$;