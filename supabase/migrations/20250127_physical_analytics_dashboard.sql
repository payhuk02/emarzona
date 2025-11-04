-- =====================================================
-- PAYHUK PHYSICAL PRODUCTS ANALYTICS DASHBOARD
-- Date: 27 Janvier 2025
-- Description: Vues et fonctions pour dashboard analytics produits physiques
--              KPIs, tendances, rapports
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. VIEW: physical_products_sales_summary
-- =====================================================
CREATE OR REPLACE VIEW public.physical_products_sales_summary AS
SELECT 
  pp.id as physical_product_id,
  p.id as product_id,
  p.store_id,
  p.name as product_name,
  
  -- Sales
  COUNT(DISTINCT oi.order_id) as total_orders,
  SUM(oi.quantity) as total_units_sold,
  COALESCE(SUM(oi.total_price), SUM(oi.unit_price * oi.quantity), 0) as total_revenue,
  COALESCE(AVG(oi.unit_price), 0) as average_selling_price,
  
  -- Inventory
  COALESCE(SUM(ii.quantity_available), 0) as current_stock,
  COALESCE(SUM(ii.quantity_reserved), 0) as reserved_stock,
  
  -- Returns
  COUNT(DISTINCT pr.id) as total_returns,
  SUM(pr.quantity) as total_units_returned,
  COUNT(DISTINCT pr.id) FILTER (WHERE pr.status = 'refunded') as refunded_returns,
  
  -- Time periods
  COUNT(DISTINCT oi.order_id) FILTER (
    WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
  ) as orders_last_30_days,
  SUM(oi.quantity) FILTER (
    WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
  ) as units_sold_last_30_days,
  COALESCE(SUM(oi.total_price), SUM(oi.unit_price * oi.quantity), 0) FILTER (
    WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
  ) as revenue_last_30_days,
  
  COUNT(DISTINCT oi.order_id) FILTER (
    WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days'
  ) as orders_last_7_days,
  SUM(oi.quantity) FILTER (
    WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days'
  ) as units_sold_last_7_days,
  
  -- Dates
  MIN(o.created_at) as first_sale_date,
  MAX(o.created_at) as last_sale_date
  
FROM public.physical_products pp
JOIN public.products p ON p.id = pp.product_id
LEFT JOIN public.order_items oi ON oi.product_id = p.id
LEFT JOIN public.orders o ON o.id = oi.order_id AND o.status IN ('completed', 'delivered')
LEFT JOIN public.inventory_items ii ON (
  ii.physical_product_id = pp.id OR 
  ii.variant_id IN (SELECT id FROM public.product_variants WHERE physical_product_id = pp.id)
)
LEFT JOIN public.product_returns pr ON pr.product_id = p.id

WHERE p.product_type = 'physical'
GROUP BY pp.id, p.id, p.store_id, p.name;

-- =====================================================
-- 2. VIEW: physical_products_daily_sales
-- =====================================================
CREATE OR REPLACE VIEW public.physical_products_daily_sales AS
SELECT 
  DATE(o.created_at) as sale_date,
  p.store_id,
  p.id as product_id,
  pp.id as physical_product_id,
  
  COUNT(DISTINCT o.id) as orders_count,
  SUM(oi.quantity) as units_sold,
  COALESCE(SUM(oi.total_price), SUM(oi.unit_price * oi.quantity), 0) as revenue,
  COALESCE(AVG(oi.unit_price), 0) as average_price
  
FROM public.orders o
JOIN public.order_items oi ON oi.order_id = o.id
JOIN public.products p ON p.id = oi.product_id
JOIN public.physical_products pp ON pp.product_id = p.id

WHERE o.status IN ('completed', 'delivered')
  AND p.product_type = 'physical'
  AND o.created_at >= CURRENT_DATE - INTERVAL '90 days'

GROUP BY DATE(o.created_at), p.store_id, p.id, pp.id;

-- =====================================================
-- 3. FUNCTION: get_physical_products_kpis
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_physical_products_kpis(
  p_store_id UUID,
  p_date_from TIMESTAMPTZ DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_date_to TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
  total_revenue NUMERIC,
  total_orders INTEGER,
  total_units_sold INTEGER,
  average_order_value NUMERIC,
  total_returns INTEGER,
  return_rate NUMERIC,
  low_stock_count INTEGER,
  out_of_stock_count INTEGER,
  top_selling_product_id UUID,
  top_selling_product_name TEXT,
  revenue_growth NUMERIC,
  orders_growth NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_previous_revenue NUMERIC;
  v_previous_orders INTEGER;
BEGIN
  -- KPIs période actuelle
  SELECT 
      COALESCE(SUM(oi.total_price), SUM(oi.unit_price * oi.quantity), 0),
    COUNT(DISTINCT o.id),
    COALESCE(SUM(oi.quantity), 0),
    COALESCE(AVG(o.total_amount), 0)
  INTO 
    total_revenue,
    total_orders,
    total_units_sold,
    average_order_value
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  JOIN public.products p ON p.id = oi.product_id
  WHERE o.store_id = p_store_id
    AND p.product_type = 'physical'
    AND o.created_at >= p_date_from
    AND o.created_at <= p_date_to
    AND o.status IN ('completed', 'delivered');
  
  -- Retours
  SELECT 
    COUNT(*),
    CASE 
      WHEN total_units_sold > 0 THEN 
        (COUNT(*)::NUMERIC / total_units_sold::NUMERIC) * 100
      ELSE 0
    END
  INTO total_returns, return_rate
  FROM public.product_returns pr
  WHERE pr.store_id = p_store_id
    AND pr.requested_at >= p_date_from
    AND pr.requested_at <= p_date_to;
  
  -- Stock alerts
  SELECT 
    COUNT(*) FILTER (WHERE aa.alert_type = 'low_stock' AND aa.status = 'active'),
    COUNT(*) FILTER (WHERE aa.alert_type = 'out_of_stock' AND aa.status = 'active')
  INTO low_stock_count, out_of_stock_count
  FROM public.physical_product_alerts aa
  WHERE aa.store_id = p_store_id;
  
  -- Top selling product
  SELECT 
    p.id,
    p.name
  INTO top_selling_product_id, top_selling_product_name
  FROM public.products p
  JOIN public.order_items oi ON oi.product_id = p.id
  JOIN public.orders o ON o.id = oi.order_id
  WHERE p.store_id = p_store_id
    AND p.product_type = 'physical'
    AND o.created_at >= p_date_from
    AND o.created_at <= p_date_to
    AND o.status IN ('completed', 'delivered')
  GROUP BY p.id, p.name
  ORDER BY SUM(oi.quantity) DESC
  LIMIT 1;
  
  -- Croissance (comparaison avec période précédente)
  SELECT 
      COALESCE(SUM(oi.total_price), SUM(oi.unit_price * oi.quantity), 0),
    COUNT(DISTINCT o.id)
  INTO v_previous_revenue, v_previous_orders
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  JOIN public.products p ON p.id = oi.product_id
  WHERE o.store_id = p_store_id
    AND p.product_type = 'physical'
    AND o.created_at >= (p_date_from - (p_date_to - p_date_from))
    AND o.created_at < p_date_from
    AND o.status IN ('completed', 'delivered');
  
  revenue_growth := CASE 
    WHEN v_previous_revenue > 0 THEN 
      ((total_revenue - v_previous_revenue) / v_previous_revenue) * 100
    ELSE 0
  END;
  
  orders_growth := CASE 
    WHEN v_previous_orders > 0 THEN 
      ((total_orders - v_previous_orders)::NUMERIC / v_previous_orders::NUMERIC) * 100
    ELSE 0
  END;
  
  RETURN QUERY SELECT 
    total_revenue,
    total_orders,
    total_units_sold,
    average_order_value,
    total_returns,
    return_rate,
    low_stock_count,
    out_of_stock_count,
    top_selling_product_id,
    top_selling_product_name,
    revenue_growth,
    orders_growth;
END;
$$;

-- =====================================================
-- 4. FUNCTION: get_physical_products_trends
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_physical_products_trends(
  p_store_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  revenue NUMERIC,
  orders INTEGER,
  units_sold INTEGER,
  returns INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(o.created_at) as date,
    COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
    COUNT(DISTINCT o.id) as orders,
    COALESCE(SUM(oi.quantity), 0) as units_sold,
    (
      SELECT COUNT(*)
      FROM public.product_returns pr
      WHERE pr.store_id = p_store_id
        AND DATE(pr.requested_at) = DATE(o.created_at)
    ) as returns
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  JOIN public.products p ON p.id = oi.product_id
  WHERE o.store_id = p_store_id
    AND p.product_type = 'physical'
    AND o.created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL
    AND o.status IN ('completed', 'delivered')
  GROUP BY DATE(o.created_at)
  ORDER BY date ASC;
END;
$$;

-- =====================================================
-- 5. FUNCTION: get_top_physical_products
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_top_physical_products(
  p_store_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  image_url TEXT,
  total_units_sold INTEGER,
  total_revenue NUMERIC,
  average_rating NUMERIC,
  current_stock INTEGER,
  return_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    p.image_url,
    COALESCE(SUM(oi.quantity), 0) as total_units_sold,
    COALESCE(SUM(oi.total_price), SUM(oi.unit_price * oi.quantity), 0) as total_revenue,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COALESCE(SUM(ii.quantity_available), 0) as current_stock,
    CASE 
      WHEN SUM(oi.quantity) > 0 THEN
        (COUNT(DISTINCT pr.id)::NUMERIC / SUM(oi.quantity)::NUMERIC) * 100
      ELSE 0
    END as return_rate
  FROM public.products p
  JOIN public.physical_products pp ON pp.product_id = p.id
  LEFT JOIN public.order_items oi ON oi.product_id = p.id
  LEFT JOIN public.orders o ON o.id = oi.order_id
    AND o.created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL
    AND o.status IN ('completed', 'delivered')
  LEFT JOIN public.reviews r ON r.product_id = p.id
  LEFT JOIN public.inventory_items ii ON (
    ii.physical_product_id = pp.id OR 
    ii.variant_id IN (SELECT id FROM public.product_variants WHERE physical_product_id = pp.id)
  )
  LEFT JOIN public.product_returns pr ON pr.product_id = p.id
    AND pr.requested_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL
  
  WHERE p.store_id = p_store_id
    AND p.product_type = 'physical'
  
  GROUP BY p.id, p.name, p.image_url
  
  ORDER BY total_revenue DESC
  
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- 6. COMMENTS
-- =====================================================
COMMENT ON VIEW public.physical_products_sales_summary IS 'Résumé des ventes par produit physique';
COMMENT ON VIEW public.physical_products_daily_sales IS 'Ventes quotidiennes produits physiques';
COMMENT ON FUNCTION public.get_physical_products_kpis IS 'KPIs pour dashboard produits physiques';
COMMENT ON FUNCTION public.get_physical_products_trends IS 'Tendances ventes produits physiques';
COMMENT ON FUNCTION public.get_top_physical_products IS 'Top produits physiques par revenus';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

