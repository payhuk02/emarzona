-- E32: WhatsApp produit physique (Starter), conversion_rate réel, emailing (Professional)
BEGIN;

-- ---------------------------------------------------------------------------
-- 1) WhatsApp sur fiche produit physique (numéro vendeur, URL base admin)
-- ---------------------------------------------------------------------------
ALTER TABLE public.physical_products
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.physical_products.whatsapp_number IS
  'Numéro WhatsApp vendeur (indicatif pays, ex. 226 7X XX XX XX). URL wa.me configurée côté admin.';
COMMENT ON COLUMN public.physical_products.whatsapp_enabled IS
  'Afficher le bouton WhatsApp sur la fiche produit publique.';

-- ---------------------------------------------------------------------------
-- 2) conversion_rate réel = commandes / vues produit (product_views)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_product_analytics(
  p_physical_product_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_variant_id UUID DEFAULT NULL,
  p_warehouse_id UUID DEFAULT NULL,
  p_period_type TEXT DEFAULT 'daily'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_analytics_id UUID;
  v_product_id UUID;
  v_units_sold INTEGER;
  v_revenue NUMERIC;
  v_cogs NUMERIC;
  v_orders_count INTEGER;
  v_returns_count INTEGER;
  v_refunds_count INTEGER;
  v_views_count INTEGER;
  v_conversion_rate NUMERIC;
BEGIN
  SELECT pp.product_id INTO v_product_id
  FROM public.physical_products pp
  WHERE pp.id = p_physical_product_id;

  SELECT
    COALESCE(SUM(oi.quantity), 0),
    COALESCE(SUM(oi.price * oi.quantity), 0),
    COUNT(DISTINCT o.id),
    COALESCE(SUM(
      CASE
        WHEN oi.quantity * oi.unit_cost IS NOT NULL THEN oi.quantity * oi.unit_cost
        ELSE 0
      END
    ), 0)
  INTO v_units_sold, v_revenue, v_orders_count, v_cogs
  FROM public.order_items oi
  INNER JOIN public.orders o ON oi.order_id = o.id
  WHERE oi.physical_product_id = p_physical_product_id
    AND (p_variant_id IS NULL OR oi.variant_id = p_variant_id)
    AND o.created_at::DATE BETWEEN p_period_start AND p_period_end
    AND o.status IN ('completed', 'shipped', 'delivered');

  IF v_product_id IS NOT NULL THEN
    SELECT COUNT(DISTINCT COALESCE(pv.session_id, pv.id::text))
    INTO v_views_count
    FROM public.product_views pv
    WHERE pv.product_id = v_product_id
      AND pv.created_at::DATE BETWEEN p_period_start AND p_period_end;
  ELSE
    v_views_count := 0;
  END IF;

  v_conversion_rate := CASE
    WHEN COALESCE(v_views_count, 0) > 0
      THEN ROUND((v_orders_count::NUMERIC / v_views_count) * 100, 2)
    ELSE 0
  END;

  SELECT
    COUNT(*) FILTER (WHERE pr.status IN ('approved', 'received', 'processing', 'refunded')),
    COUNT(*) FILTER (WHERE pr.status = 'refunded')
  INTO v_returns_count, v_refunds_count
  FROM public.product_returns pr
  INNER JOIN public.orders o ON pr.order_id = o.id
  INNER JOIN public.order_items oi ON pr.order_item_id = oi.id
  WHERE oi.physical_product_id = p_physical_product_id
    AND (p_variant_id IS NULL OR oi.variant_id = p_variant_id)
    AND o.created_at::DATE BETWEEN p_period_start AND p_period_end;

  INSERT INTO public.physical_product_analytics (
    physical_product_id,
    variant_id,
    warehouse_id,
    period_start,
    period_end,
    period_type,
    units_sold,
    revenue,
    average_order_value,
    conversion_rate,
    cost_of_goods_sold,
    gross_profit,
    gross_profit_margin,
    return_rate,
    refund_rate
  ) VALUES (
    p_physical_product_id,
    p_variant_id,
    p_warehouse_id,
    p_period_start,
    p_period_end,
    p_period_type,
    v_units_sold,
    v_revenue,
    CASE WHEN v_orders_count > 0 THEN v_revenue / v_orders_count ELSE 0 END,
    v_conversion_rate,
    v_cogs,
    v_revenue - v_cogs,
    CASE WHEN v_revenue > 0 THEN ((v_revenue - v_cogs) / v_revenue) * 100 ELSE 0 END,
    CASE WHEN v_orders_count > 0 THEN (v_returns_count::NUMERIC / v_orders_count) * 100 ELSE 0 END,
    CASE WHEN v_orders_count > 0 THEN (v_refunds_count::NUMERIC / v_orders_count) * 100 ELSE 0 END
  )
  ON CONFLICT (physical_product_id, variant_id, warehouse_id, period_start, period_end, period_type)
  DO UPDATE SET
    units_sold = EXCLUDED.units_sold,
    revenue = EXCLUDED.revenue,
    average_order_value = EXCLUDED.average_order_value,
    conversion_rate = EXCLUDED.conversion_rate,
    cost_of_goods_sold = EXCLUDED.cost_of_goods_sold,
    gross_profit = EXCLUDED.gross_profit,
    gross_profit_margin = EXCLUDED.gross_profit_margin,
    return_rate = EXCLUDED.return_rate,
    refund_rate = EXCLUDED.refund_rate,
    calculated_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_analytics_id;

  RETURN v_analytics_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_product_analytics(UUID, DATE, DATE, UUID, UUID, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) RPC publique : base URL WhatsApp (sans secrets)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_whatsapp_config()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'click_url_base',
    COALESCE(
      NULLIF(trim(settings -> 'integrations' -> 'whatsapp' ->> 'clickUrlBase'), ''),
      'https://wa.me'
    ),
    'enabled',
    COALESCE((settings -> 'integrations' -> 'whatsapp' ->> 'enabled')::boolean, true)
  )
  FROM public.platform_settings
  WHERE key = 'customization'
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_public_whatsapp_config() IS
  'URL de base wa.me (admin) + flag global. Lecture publique pour fiches produit.';

GRANT EXECUTE ON FUNCTION public.get_public_whatsapp_config() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_whatsapp_config() TO authenticated;

-- ---------------------------------------------------------------------------
-- 4) Feature gating : whatsapp.product_button (Starter+), emails.manage (Professional+)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.store_has_physical_feature(
  p_store_id UUID,
  p_feature_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug TEXT;
  v_rank INT := 0;
  v_required INT := 99;
  v_max_wh INT;
BEGIN
  IF public.is_platform_admin() THEN
    RETURN TRUE;
  END IF;

  v_slug := public.get_store_physical_plan_slug(p_store_id);
  IF v_slug IS NULL THEN
    RETURN FALSE;
  END IF;

  v_rank := public.physical_plan_rank(v_slug);

  SELECT p.max_warehouses INTO v_max_wh
  FROM public.platform_vendor_plans p
  WHERE p.slug = v_slug
  LIMIT 1;

  v_required := CASE p_feature_key
    WHEN 'whatsapp.product_button' THEN 1
    WHEN 'shipping.tracking' THEN 2
    WHEN 'shipping.fedex_live' THEN 2
    WHEN 'suppliers.manage' THEN 2
    WHEN 'analytics.physical' THEN 2
    WHEN 'emails.manage' THEN 2
    WHEN 'serial_tracking.manage' THEN 2
    WHEN 'warehouses.manage' THEN 2
    WHEN 'batch_shipping.manage' THEN 3
    WHEN 'lots_expiration.manage' THEN 3
    WHEN 'barcode_scanner.use' THEN 3
    WHEN 'preorders.manage' THEN 3
    WHEN 'backorders.manage' THEN 3
    WHEN 'bundles.manage' THEN 3
    WHEN 'forecasting.demand' THEN 3
    WHEN 'cost_optimization.manage' THEN 3
    ELSE 99
  END;

  IF p_feature_key = 'warehouses.manage' AND COALESCE(v_max_wh, 999) <= 0 THEN
    RETURN FALSE;
  END IF;

  RETURN v_rank >= v_required;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_store_physical_plan_limits(p_store_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug TEXT;
  v_plan public.platform_vendor_plans%ROWTYPE;
  v_rank INT;
BEGIN
  v_slug := public.get_store_physical_plan_slug(p_store_id);

  IF v_slug IS NULL THEN
    RETURN jsonb_build_object(
      'plan_slug', null,
      'allowed', false,
      'active_physical_products', public.count_store_active_physical_products(p_store_id)
    );
  END IF;

  SELECT * INTO v_plan
  FROM public.platform_vendor_plans
  WHERE slug = v_slug
  LIMIT 1;

  v_rank := public.physical_plan_rank(v_slug);

  RETURN jsonb_build_object(
    'plan_slug', v_slug,
    'allowed', true,
    'max_products', v_plan.max_products,
    'max_variants_per_product', v_plan.max_variants_per_product,
    'max_warehouses', v_plan.max_warehouses,
    'active_physical_products', public.count_store_active_physical_products(p_store_id),
    'warehouse_count', public.count_store_warehouses(p_store_id),
    'features', jsonb_build_object(
      'whatsapp.product_button', v_rank >= 1,
      'shipping.tracking', v_rank >= 2,
      'shipping.fedex_live', v_rank >= 2,
      'suppliers.manage', v_rank >= 2,
      'analytics.physical', v_rank >= 2,
      'emails.manage', v_rank >= 2,
      'serial_tracking.manage', v_rank >= 2,
      'warehouses.manage', v_rank >= 2 AND COALESCE(v_plan.max_warehouses, 1) > 0,
      'batch_shipping.manage', v_rank >= 3,
      'lots_expiration.manage', v_rank >= 3,
      'barcode_scanner.use', v_rank >= 3,
      'preorders.manage', v_rank >= 3,
      'backorders.manage', v_rank >= 3,
      'bundles.manage', v_rank >= 3,
      'forecasting.demand', v_rank >= 3,
      'cost_optimization.manage', v_rank >= 3
    )
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 5) RLS emailing : Professional+ (emails.manage)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.email_campaigns') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Store owners can manage own campaigns" ON public.email_campaigns';
    EXECUTE 'CREATE POLICY "Store owners can manage own campaigns" ON public.email_campaigns
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = email_campaigns.store_id AND s.user_id = auth.uid()
        )
        AND public.store_has_physical_feature(email_campaigns.store_id, ''emails.manage'')
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = email_campaigns.store_id AND s.user_id = auth.uid()
        )
        AND public.store_has_physical_feature(email_campaigns.store_id, ''emails.manage'')
      )';
  END IF;

  IF to_regclass('public.email_segments') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Store owners can manage own segments" ON public.email_segments';
    EXECUTE 'CREATE POLICY "Store owners can manage own segments" ON public.email_segments
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = email_segments.store_id AND s.user_id = auth.uid()
        )
        AND public.store_has_physical_feature(email_segments.store_id, ''emails.manage'')
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = email_segments.store_id AND s.user_id = auth.uid()
        )
        AND public.store_has_physical_feature(email_segments.store_id, ''emails.manage'')
      )';
  END IF;

  IF to_regclass('public.email_sequences') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Store owners can manage own sequences" ON public.email_sequences';
    EXECUTE 'CREATE POLICY "Store owners can manage own sequences" ON public.email_sequences
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = email_sequences.store_id AND s.user_id = auth.uid()
        )
        AND public.store_has_physical_feature(email_sequences.store_id, ''emails.manage'')
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = email_sequences.store_id AND s.user_id = auth.uid()
        )
        AND public.store_has_physical_feature(email_sequences.store_id, ''emails.manage'')
      )';
  END IF;

  IF to_regclass('public.email_workflows') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Store owners can manage own workflows" ON public.email_workflows';
    EXECUTE 'CREATE POLICY "Store owners can manage own workflows" ON public.email_workflows
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = email_workflows.store_id AND s.user_id = auth.uid()
        )
        AND public.store_has_physical_feature(email_workflows.store_id, ''emails.manage'')
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = email_workflows.store_id AND s.user_id = auth.uid()
        )
        AND public.store_has_physical_feature(email_workflows.store_id, ''emails.manage'')
      )';
  END IF;

  IF to_regclass('public.email_analytics_daily') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Store owners can view own analytics" ON public.email_analytics_daily';
    EXECUTE 'DROP POLICY IF EXISTS "Store owners can view own email analytics" ON public.email_analytics_daily';
    EXECUTE 'CREATE POLICY "Store owners can view own analytics" ON public.email_analytics_daily
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = email_analytics_daily.store_id AND s.user_id = auth.uid()
        )
        AND public.store_has_physical_feature(email_analytics_daily.store_id, ''emails.manage'')
      )';
  END IF;
END;
$$;

COMMIT;
