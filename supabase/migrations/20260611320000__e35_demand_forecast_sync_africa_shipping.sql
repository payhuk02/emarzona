-- E35 Epic 3.2.6 + 3.2.8: sync sales_history, zones Afrique forfait, feature gating
BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Zones Afrique — type + libellé transporteur
-- ---------------------------------------------------------------------------
ALTER TABLE public.shipping_zones
  ADD COLUMN IF NOT EXISTS zone_type TEXT NOT NULL DEFAULT 'standard';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'shipping_zones_zone_type_check'
  ) THEN
    ALTER TABLE public.shipping_zones
      ADD CONSTRAINT shipping_zones_zone_type_check
      CHECK (zone_type IN ('standard', 'local_africa'));
  END IF;
END $$;

ALTER TABLE public.shipping_rates
  ADD COLUMN IF NOT EXISTS carrier_label TEXT;

COMMENT ON COLUMN public.shipping_zones.zone_type IS
  'standard | local_africa (forfait régional phase 1)';
COMMENT ON COLUMN public.shipping_rates.carrier_label IS
  'Nom affiché du transporteur local (ex. Chronopost Afrique)';

-- ---------------------------------------------------------------------------
-- 2) Sync historique ventes → sales_history (prévisions demande)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_store_sales_history(p_store_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = p_store_id AND s.user_id = auth.uid()
  ) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  INSERT INTO public.sales_history (
    store_id,
    product_id,
    order_id,
    order_item_id,
    quantity_sold,
    unit_price,
    total_amount,
    sale_date,
    sale_timestamp,
    channel
  )
  SELECT
    o.store_id,
    oi.product_id,
    o.id,
    oi.id,
    COALESCE(oi.quantity, 1),
    COALESCE(oi.unit_price, 0),
    COALESCE(oi.total_price, COALESCE(oi.unit_price, 0) * COALESCE(oi.quantity, 1)),
    (o.created_at AT TIME ZONE 'UTC')::date,
    o.created_at,
    'web'
  FROM public.orders o
  INNER JOIN public.order_items oi ON oi.order_id = o.id
  INNER JOIN public.products p ON p.id = oi.product_id
  WHERE o.store_id = p_store_id
    AND o.payment_status = 'paid'
    AND p.product_type = 'physical'
    AND oi.product_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.sales_history sh
      WHERE sh.order_item_id = oi.id
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_store_sales_history(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) Seed zones forfait Afrique (UEMOA, Afrique de l'Ouest, Afrique centrale)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.seed_africa_local_shipping_zones(p_store_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_zone_id UUID;
  v_created INTEGER := 0;
  v_rates INTEGER := 0;
BEGIN
  IF NOT public.store_has_physical_feature(p_store_id, 'shipping.local_africa') THEN
    RAISE EXCEPTION 'Fonctionnalité transporteur local Afrique non incluse dans votre plan';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = p_store_id AND s.user_id = auth.uid()
  ) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  -- Zone UEMOA
  IF NOT EXISTS (
    SELECT 1 FROM public.shipping_zones
    WHERE store_id = p_store_id AND name = 'Afrique — UEMOA (forfait)'
  ) THEN
    INSERT INTO public.shipping_zones (store_id, name, countries, is_active, priority, zone_type)
    VALUES (
      p_store_id,
      'Afrique — UEMOA (forfait)',
      ARRAY['BF','BJ','CI','GW','ML','NE','SN','TG']::text[],
      true,
      10,
      'local_africa'
    )
    RETURNING id INTO v_zone_id;

    INSERT INTO public.shipping_rates (
      shipping_zone_id, name, description, rate_type, base_price,
      estimated_days_min, estimated_days_max, is_active, priority, carrier_label
    ) VALUES (
      v_zone_id,
      'Livraison locale UEMOA',
      'Forfait transporteur régional — zone UEMOA',
      'flat',
      2500,
      2,
      5,
      true,
      10,
      'Transporteur local UEMOA'
    );
    v_created := v_created + 1;
    v_rates := v_rates + 1;
  END IF;

  -- Zone Afrique de l'Ouest élargie
  IF NOT EXISTS (
    SELECT 1 FROM public.shipping_zones
    WHERE store_id = p_store_id AND name = 'Afrique — Ouest (forfait)'
  ) THEN
    INSERT INTO public.shipping_zones (store_id, name, countries, is_active, priority, zone_type)
    VALUES (
      p_store_id,
      'Afrique — Ouest (forfait)',
      ARRAY['GH','NG','LR','SL','GM','MR','CV','ST']::text[],
      true,
      20,
      'local_africa'
    )
    RETURNING id INTO v_zone_id;

    INSERT INTO public.shipping_rates (
      shipping_zone_id, name, description, rate_type, base_price,
      estimated_days_min, estimated_days_max, is_active, priority, carrier_label
    ) VALUES (
      v_zone_id,
      'Livraison Afrique de l''Ouest',
      'Forfait transporteur régional',
      'flat',
      5000,
      5,
      10,
      true,
      20,
      'Transporteur Afrique Ouest'
    );
    v_created := v_created + 1;
    v_rates := v_rates + 1;
  END IF;

  -- Zone Afrique centrale
  IF NOT EXISTS (
    SELECT 1 FROM public.shipping_zones
    WHERE store_id = p_store_id AND name = 'Afrique — Centrale (forfait)'
  ) THEN
    INSERT INTO public.shipping_zones (store_id, name, countries, is_active, priority, zone_type)
    VALUES (
      p_store_id,
      'Afrique — Centrale (forfait)',
      ARRAY['CM','GA','CG','CD','GQ','CF','TD','AO']::text[],
      true,
      30,
      'local_africa'
    )
    RETURNING id INTO v_zone_id;

    INSERT INTO public.shipping_rates (
      shipping_zone_id, name, description, rate_type, base_price,
      estimated_days_min, estimated_days_max, is_active, priority, carrier_label
    ) VALUES (
      v_zone_id,
      'Livraison Afrique centrale',
      'Forfait transporteur régional',
      'flat',
      7500,
      7,
      14,
      true,
      30,
      'Transporteur Afrique Centrale'
    );
    v_created := v_created + 1;
    v_rates := v_rates + 1;
  END IF;

  RETURN jsonb_build_object(
    'zones_created', v_created,
    'rates_created', v_rates,
    'success', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_africa_local_shipping_zones(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4) Feature gating shipping.local_africa (Professional+)
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
    WHEN 'emails.manage' THEN 2
    WHEN 'shipping.tracking' THEN 2
    WHEN 'shipping.fedex_live' THEN 2
    WHEN 'shipping.local_africa' THEN 2
    WHEN 'suppliers.manage' THEN 2
    WHEN 'analytics.physical' THEN 2
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

  IF p_feature_key = 'warehouses.manage' AND COALESCE(v_max_wh, 0) = 0 THEN
    RETURN FALSE;
  END IF;

  RETURN v_rank >= v_required;
END;
$$;

-- Mettre à jour get_store_physical_plan_limits (feature shipping.local_africa)
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
  IF p_store_id IS NULL THEN
    RETURN jsonb_build_object('plan_slug', null, 'allowed', false);
  END IF;

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
      'emails.manage', v_rank >= 2,
      'shipping.tracking', v_rank >= 2,
      'shipping.fedex_live', v_rank >= 2,
      'shipping.local_africa', v_rank >= 2,
      'suppliers.manage', v_rank >= 2,
      'analytics.physical', v_rank >= 2,
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

COMMIT;
