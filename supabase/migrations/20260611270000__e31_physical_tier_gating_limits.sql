-- E31 Epic 3.2.7: Tier gating physique — limites DB alignées frontend
-- Starter: 50 produits, 3 variantes, 0 entrepôt, pas FedEx/serial
-- Professional: 200 produits, 10 variantes, 1 entrepôt, serial + FedEx
-- Enterprise: illimité

BEGIN;

ALTER TABLE public.platform_vendor_plans
  ADD COLUMN IF NOT EXISTS max_variants_per_product INTEGER,
  ADD COLUMN IF NOT EXISTS max_warehouses INTEGER;

COMMENT ON COLUMN public.platform_vendor_plans.max_variants_per_product IS
  'Variantes max par produit physique (NULL = illimité).';
COMMENT ON COLUMN public.platform_vendor_plans.max_warehouses IS
  'Entrepôts max par boutique (NULL = illimité, 0 = aucun).';

UPDATE public.platform_vendor_plans
SET
  max_products = 50,
  max_variants_per_product = 3,
  max_warehouses = 0
WHERE slug = 'physical_basic';

UPDATE public.platform_vendor_plans
SET
  max_products = 200,
  max_variants_per_product = 10,
  max_warehouses = 1
WHERE slug = 'physical_standard';

UPDATE public.platform_vendor_plans
SET
  max_products = NULL,
  max_variants_per_product = NULL,
  max_warehouses = NULL
WHERE slug = 'physical_premium';

-- ---------------------------------------------------------------------------
-- Plan rank helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.physical_plan_rank(p_slug TEXT)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_slug
    WHEN 'physical_basic' THEN 1
    WHEN 'physical_standard' THEN 2
    WHEN 'physical_premium' THEN 3
    ELSE 0
  END;
$$;

-- ---------------------------------------------------------------------------
-- Counters (before get_store_physical_plan_limits)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.count_store_active_physical_products(p_store_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INT
  FROM public.products p
  WHERE p.store_id = p_store_id
    AND p.product_type = 'physical'
    AND COALESCE(p.is_active, false) = true
    AND COALESCE(p.is_draft, false) = false;
$$;

CREATE OR REPLACE FUNCTION public.count_store_warehouses(p_store_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INT
  FROM public.warehouses w
  WHERE w.store_id = p_store_id;
$$;

CREATE OR REPLACE FUNCTION public.count_physical_product_variants(p_physical_product_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INT
  FROM public.product_variants pv
  WHERE pv.physical_product_id = p_physical_product_id;
$$;

GRANT EXECUTE ON FUNCTION public.count_store_active_physical_products(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_store_warehouses(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_physical_product_variants(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Limits JSON for frontend (single source of truth)
-- ---------------------------------------------------------------------------
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
      'shipping.tracking', v_rank >= 2,
      'shipping.fedex_live', v_rank >= 2,
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

GRANT EXECUTE ON FUNCTION public.get_store_physical_plan_limits(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Feature gating (aligné matrice enterprise)
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
    WHEN 'shipping.tracking' THEN 2
    WHEN 'shipping.fedex_live' THEN 2
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

  IF p_feature_key = 'warehouses.manage' AND COALESCE(v_max_wh, 999) <= 0 THEN
    RETURN FALSE;
  END IF;

  RETURN v_rank >= v_required;
END;
$$;

-- ---------------------------------------------------------------------------
-- Quota enforcement triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_physical_product_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max INT;
  v_count INT;
  v_slug TEXT;
BEGIN
  IF NEW.product_type IS DISTINCT FROM 'physical' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF COALESCE(OLD.is_active, false) = COALESCE(NEW.is_active, false)
       AND COALESCE(OLD.is_draft, true) = COALESCE(NEW.is_draft, true) THEN
      RETURN NEW;
    END IF;
  END IF;

  IF COALESCE(NEW.is_draft, false) OR NOT COALESCE(NEW.is_active, false) THEN
    RETURN NEW;
  END IF;

  IF public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  v_slug := public.get_store_physical_plan_slug(NEW.store_id);
  IF v_slug IS NULL THEN
    RAISE EXCEPTION 'PHYSICAL_SUBSCRIPTION_REQUIRED'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT p.max_products INTO v_max
  FROM public.platform_vendor_plans p
  WHERE p.slug = v_slug;

  IF v_max IS NULL THEN
    RETURN NEW;
  END IF;

  v_count := public.count_store_active_physical_products(NEW.store_id);
  IF TG_OP = 'UPDATE' AND COALESCE(OLD.is_active, false) AND NOT COALESCE(OLD.is_draft, false) THEN
    v_count := v_count - 1;
  END IF;

  IF v_count >= v_max THEN
    RAISE EXCEPTION 'PHYSICAL_PRODUCT_LIMIT_REACHED:%', v_max
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_physical_variant_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
  v_slug TEXT;
  v_max INT;
  v_count INT;
BEGIN
  IF public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  SELECT p.store_id INTO v_store_id
  FROM public.physical_products pp
  JOIN public.products p ON p.id = pp.product_id
  WHERE pp.id = NEW.physical_product_id;

  IF v_store_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_slug := public.get_store_physical_plan_slug(v_store_id);
  IF v_slug IS NULL THEN
    RAISE EXCEPTION 'PHYSICAL_SUBSCRIPTION_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT p.max_variants_per_product INTO v_max
  FROM public.platform_vendor_plans p
  WHERE p.slug = v_slug;

  IF v_max IS NULL THEN
    RETURN NEW;
  END IF;

  v_count := public.count_physical_product_variants(NEW.physical_product_id);

  IF v_count >= v_max THEN
    RAISE EXCEPTION 'PHYSICAL_VARIANT_LIMIT_REACHED:%', v_max
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_warehouse_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug TEXT;
  v_max INT;
  v_count INT;
BEGIN
  IF public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  IF NOT public.store_has_physical_feature(NEW.store_id, 'warehouses.manage') THEN
    RAISE EXCEPTION 'PHYSICAL_FEATURE_WAREHOUSES_REQUIRED'
      USING ERRCODE = 'P0001';
  END IF;

  v_slug := public.get_store_physical_plan_slug(NEW.store_id);
  SELECT p.max_warehouses INTO v_max
  FROM public.platform_vendor_plans p
  WHERE p.slug = v_slug;

  IF v_max IS NULL THEN
    RETURN NEW;
  END IF;

  v_count := public.count_store_warehouses(NEW.store_id);
  IF v_count >= v_max THEN
    RAISE EXCEPTION 'PHYSICAL_WAREHOUSE_LIMIT_REACHED:%', v_max
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_physical_product_limit ON public.products;
CREATE TRIGGER trg_enforce_physical_product_limit
  BEFORE INSERT OR UPDATE OF is_active, is_draft, product_type ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_physical_product_limit();

DROP TRIGGER IF EXISTS trg_enforce_physical_variant_limit ON public.product_variants;
CREATE TRIGGER trg_enforce_physical_variant_limit
  BEFORE INSERT ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_physical_variant_limit();

DO $$
BEGIN
  IF to_regclass('public.warehouses') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_enforce_warehouse_limit ON public.warehouses';
    EXECUTE 'CREATE TRIGGER trg_enforce_warehouse_limit
      BEFORE INSERT ON public.warehouses
      FOR EACH ROW
      EXECUTE FUNCTION public.enforce_warehouse_limit()';
  END IF;
END $$;

COMMIT;
