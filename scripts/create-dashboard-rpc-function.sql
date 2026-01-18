-- Script SQL pour créer la fonction RPC get_dashboard_stats_rpc manquante
-- À exécuter dans Supabase Dashboard > SQL Editor
-- Date: 2026-01-21

-- D'abord, vérifier si les tables/vues matérialisées existent
-- Si elles n'existent pas, cette fonction utilisera des requêtes directes

CREATE OR REPLACE FUNCTION get_dashboard_stats_rpc(store_id_param UUID, period_days_param INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  base_stats JSON;
  orders_stats JSON;
  customers_stats JSON;
  product_performance JSON[];
  top_products JSON[];
  recent_orders JSON[];
BEGIN
  -- Vérifier si les tables/vues matérialisées existent et les utiliser si disponibles
  -- Sinon, utiliser des requêtes directes sur les tables sources

  -- Récupérer les statistiques de base
  BEGIN
    SELECT json_build_object(
      'totalProducts', total_products,
      'activeProducts', active_products,
      'digitalProducts', digital_products,
      'physicalProducts', physical_products,
      'serviceProducts', service_products,
      'courseProducts', course_products,
      'artistProducts', artist_products,
      'avgProductPrice', COALESCE(avg_product_price, 0)
    ) INTO base_stats
    FROM dashboard_base_stats
    WHERE store_id = store_id_param;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback : requête directe sur products
    SELECT json_build_object(
      'totalProducts', COUNT(*),
      'activeProducts', COUNT(CASE WHEN is_active THEN 1 END),
      'digitalProducts', COUNT(CASE WHEN is_active AND product_type = 'digital' THEN 1 END),
      'physicalProducts', COUNT(CASE WHEN is_active AND product_type = 'physical' THEN 1 END),
      'serviceProducts', COUNT(CASE WHEN is_active AND product_type = 'service' THEN 1 END),
      'courseProducts', COUNT(CASE WHEN is_active AND product_type = 'course' THEN 1 END),
      'artistProducts', COUNT(CASE WHEN is_active AND product_type = 'artist' THEN 1 END),
      'avgProductPrice', COALESCE(AVG(CASE WHEN is_active THEN price END), 0)
    ) INTO base_stats
    FROM products
    WHERE store_id = store_id_param;
  END;

  -- Récupérer les statistiques de commandes
  BEGIN
    SELECT json_build_object(
      'totalOrders', total_orders,
      'completedOrders', completed_orders,
      'pendingOrders', pending_orders,
      'cancelledOrders', cancelled_orders,
      'totalRevenue', COALESCE(total_revenue, 0),
      'avgOrderValue', COALESCE(avg_order_value, 0),
      'revenue30d', COALESCE(revenue_30d, 0),
      'orders30d', orders_30d,
      'revenue7d', COALESCE(revenue_7d, 0),
      'orders7d', orders_7d,
      'revenue90d', COALESCE(revenue_90d, 0),
      'orders90d', orders_90d
    ) INTO orders_stats
    FROM dashboard_orders_stats
    WHERE store_id = store_id_param;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback : requête directe sur orders
    SELECT json_build_object(
      'totalOrders', COUNT(*),
      'completedOrders', COUNT(CASE WHEN status = 'completed' THEN 1 END),
      'pendingOrders', COUNT(CASE WHEN status = 'pending' THEN 1 END),
      'cancelledOrders', COUNT(CASE WHEN status = 'cancelled' THEN 1 END),
      'totalRevenue', COALESCE(SUM(total_amount), 0),
      'avgOrderValue', COALESCE(AVG(total_amount), 0),
      'revenue30d', COALESCE(SUM(CASE WHEN status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days' THEN total_amount END), 0),
      'orders30d', COUNT(CASE WHEN status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END),
      'revenue7d', COALESCE(SUM(CASE WHEN status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '7 days' THEN total_amount END), 0),
      'orders7d', COUNT(CASE WHEN status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END),
      'revenue90d', COALESCE(SUM(CASE WHEN status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '90 days' THEN total_amount END), 0),
      'orders90d', COUNT(CASE WHEN status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END)
    ) INTO orders_stats
    FROM orders
    WHERE store_id = store_id_param
      AND created_at >= CURRENT_DATE - INTERVAL '90 days';
  END;

  -- Récupérer les statistiques clients
  BEGIN
    SELECT json_build_object(
      'totalCustomers', total_customers,
      'newCustomers30d', new_customers_30d,
      'newCustomers7d', new_customers_7d,
      'newCustomers90d', new_customers_90d,
      'customersWithOrders', customers_with_orders
    ) INTO customers_stats
    FROM dashboard_customers_stats
    WHERE store_id = store_id_param;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback : requête directe sur customers
    SELECT json_build_object(
      'totalCustomers', COUNT(*),
      'newCustomers30d', COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END),
      'newCustomers7d', COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END),
      'newCustomers90d', COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END),
      'customersWithOrders', COUNT(CASE WHEN id IN (
        SELECT DISTINCT customer_id FROM orders WHERE status = 'completed' AND store_id = store_id_param
      ) THEN 1 END)
    ) INTO customers_stats
    FROM customers
    WHERE store_id = store_id_param
      AND created_at >= CURRENT_DATE - INTERVAL '90 days';
  END;

  -- Récupérer les performances par type de produit
  BEGIN
    SELECT array_agg(
      json_build_object(
        'type', product_type,
        'orders', orders,
        'revenue', revenue,
        'quantity', quantity,
        'avgOrderValue', avg_order_value,
        'productsSold', products_sold,
        'orders30d', orders_30d,
        'revenue30d', revenue_30d
      )
    ) INTO product_performance
    FROM dashboard_product_performance
    WHERE store_id = store_id_param;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback : requête directe
    SELECT array_agg(
      json_build_object(
        'type', type,
        'orders', orders,
        'revenue', revenue,
        'quantity', quantity,
        'avgOrderValue', avg_order_value,
        'productsSold', products_sold,
        'orders30d', orders_30d,
        'revenue30d', revenue_30d
      )
    ) INTO product_performance
    FROM (
      SELECT
        p.product_type as type,
        COUNT(DISTINCT o.id) as orders,
        COALESCE(SUM(oi.total_price), 0) as revenue,
        COALESCE(SUM(oi.quantity), 0) as quantity,
        COALESCE(AVG(oi.total_price), 0) as avg_order_value,
        COUNT(DISTINCT oi.product_id) as products_sold,
        COUNT(DISTINCT CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN o.id END) as orders_30d,
        COALESCE(SUM(CASE WHEN o.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN oi.total_price END), 0) as revenue_30d
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.store_id = store_id_param
        AND o.created_at >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY p.product_type
    ) sub;
  END;

  -- Récupérer les top produits
  BEGIN
    SELECT array_agg(
      json_build_object(
        'id', product_id,
        'name', product_name,
        'price', price,
        'imageUrl', image_url,
        'productType', product_type,
        'revenue', total_revenue,
        'quantity', total_quantity,
        'orderCount', order_count
      )
    ) INTO top_products
    FROM dashboard_top_products
    WHERE store_id = store_id_param
    LIMIT 5;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback : requête directe
    SELECT array_agg(
      json_build_object(
        'id', id,
        'name', name,
        'price', price,
        'imageUrl', image_url,
        'productType', product_type,
        'revenue', revenue,
        'quantity', quantity,
        'orderCount', order_count
      )
    ) INTO top_products
    FROM (
      SELECT
        p.id,
        p.name,
        p.price,
        p.image_url,
        p.product_type,
        COALESCE(SUM(oi.total_price), 0) as revenue,
        COALESCE(SUM(oi.quantity), 0) as quantity,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE p.store_id = store_id_param
        AND o.created_at >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY p.id, p.name, p.price, p.image_url, p.product_type
      ORDER BY revenue DESC
      LIMIT 5
    ) sub;
  END;

  -- Récupérer les commandes récentes
  BEGIN
    SELECT array_agg(
      json_build_object(
        'id', order_id,
        'orderNumber', order_number,
        'totalAmount', total_amount,
        'status', status,
        'createdAt', created_at,
        'customer', CASE
          WHEN customer_id IS NOT NULL THEN json_build_object(
            'id', customer_id,
            'name', customer_name,
            'email', customer_email
          )
          ELSE NULL
        END,
        'productTypes', COALESCE(product_types, ARRAY[]::text[])
      )
    ) INTO recent_orders
    FROM dashboard_recent_orders
    WHERE store_id = store_id_param
    ORDER BY created_at DESC
    LIMIT 5;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback : requête directe simplifiée
    WITH OrderProductTypes AS (
      SELECT
        oi.order_id,
        COALESCE(ARRAY_AGG(DISTINCT p.product_type) FILTER (WHERE p.product_type IS NOT NULL), ARRAY[]::text[]) as product_types
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY oi.order_id
    )
    SELECT array_agg(
      json_build_object(
        'id', o.id,
        'orderNumber', o.order_number,
        'totalAmount', o.total_amount,
        'status', o.status,
        'createdAt', o.created_at,
        'customer', CASE
          WHEN c.id IS NOT NULL THEN json_build_object(
            'id', c.id,
            'name', c.name,
            'email', c.email
          )
          ELSE NULL
        END,
        'productTypes', COALESCE(opt.product_types, ARRAY[]::text[])
      )
    ) INTO recent_orders
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN OrderProductTypes opt ON o.id = opt.order_id
    WHERE o.store_id = store_id_param
      AND o.created_at >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY o.id, o.order_number, o.total_amount, o.status, o.created_at, c.id, c.name, c.email, opt.product_types
    ORDER BY o.created_at DESC
    LIMIT 5;
  END;

  -- Construire le résultat final
  SELECT json_build_object(
    'baseStats', base_stats,
    'ordersStats', orders_stats,
    'customersStats', customers_stats,
    'productPerformance', COALESCE(product_performance, ARRAY[]::json[]),
    'topProducts', COALESCE(top_products, ARRAY[]::json[]),
    'recentOrders', COALESCE(recent_orders, ARRAY[]::json[]),
    'generatedAt', NOW(),
    'periodDays', period_days_param
  ) INTO result;

  RETURN result;
END;
$$;

-- Commentaire pour documenter la fonction
COMMENT ON FUNCTION get_dashboard_stats_rpc(UUID, INTEGER) IS 'RPC function to get dashboard statistics. Uses materialized views if available, falls back to direct queries.';

-- Vérifier que la fonction a été créée
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'get_dashboard_stats_rpc'
  ) THEN
    RAISE NOTICE '✅ Fonction get_dashboard_stats_rpc créée avec succès';
  ELSE
    RAISE WARNING '❌ Échec de la création de la fonction get_dashboard_stats_rpc';
  END IF;
END;
$$;