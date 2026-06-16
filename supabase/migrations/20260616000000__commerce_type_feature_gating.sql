-- Commerce type aware feature gating:
-- - Physical trial/subscription only for physical stores
-- - Full emailing for digital/service/course/artist (no subscription)
-- - Physical plan features only apply to physical commerce stores

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.store_commerce_type(p_store_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT metadata->>'commerce_type' FROM public.stores WHERE id = p_store_id),
    'physical'
  );
$$;

CREATE OR REPLACE FUNCTION public.store_uses_physical_ecommerce(p_store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.store_commerce_type(p_store_id) = 'physical';
$$;

COMMENT ON FUNCTION public.store_commerce_type(UUID) IS
  'Type de boutique (metadata.commerce_type), défaut physical pour rétrocompat.';

COMMENT ON FUNCTION public.store_uses_physical_ecommerce(UUID) IS
  'True si la boutique utilise le système e-commerce produits physiques (abonnement requis).';

GRANT EXECUTE ON FUNCTION public.store_commerce_type(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_uses_physical_ecommerce(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 2) Trial physique uniquement à la création d'une boutique physique
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_store_physical_trial_on_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id UUID;
  v_trial_days INTEGER;
  v_commerce_type TEXT;
BEGIN
  v_commerce_type := COALESCE(NEW.metadata->>'commerce_type', 'physical');

  IF v_commerce_type IS DISTINCT FROM 'physical' THEN
    RETURN NEW;
  END IF;

  SELECT id, trial_days
  INTO v_plan_id, v_trial_days
  FROM public.platform_vendor_plans
  WHERE slug = 'physical_basic'
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_trial_days := COALESCE(v_trial_days, 30);

  INSERT INTO public.store_platform_subscriptions (
    store_id,
    plan_id,
    status,
    billing_cycle,
    mrr_amount,
    trial_ends_at,
    current_period_start,
    current_period_end
  )
  VALUES (
    NEW.id,
    v_plan_id,
    'trialing',
    'monthly',
    0,
    now() + (v_trial_days || ' days')::interval,
    now(),
    now() + interval '30 days'
  )
  ON CONFLICT (store_id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.ensure_store_physical_trial_on_create IS
  'Crée un abonnement physical_basic en essai 30j uniquement pour les boutiques produits physiques.';

-- ---------------------------------------------------------------------------
-- 3) Nettoyage : retirer les abonnements physiques des boutiques non-physiques
-- ---------------------------------------------------------------------------
DELETE FROM public.store_platform_subscriptions s
USING public.stores st
WHERE s.store_id = st.id
  AND COALESCE(st.metadata->>'commerce_type', 'physical') IS DISTINCT FROM 'physical';

-- ---------------------------------------------------------------------------
-- 4) Feature gating : emails débloqués pour les 4 autres types e-commerce
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

  IF NOT public.store_uses_physical_ecommerce(p_store_id) THEN
    IF p_feature_key = 'emails.manage' THEN
      RETURN TRUE;
    END IF;
    RETURN FALSE;
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

COMMIT;
