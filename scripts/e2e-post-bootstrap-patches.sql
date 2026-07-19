-- Idempotent patches applied after prod schema dump on E2E.
-- pg_dump --no-privileges + trigger/function ordering can leave this RPC missing while
-- trg_seed_store_notification_settings on public.stores still exists.

CREATE OR REPLACE FUNCTION public.get_or_create_store_notification_settings(p_store_id UUID)
RETURNS public.store_notification_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings public.store_notification_settings;
BEGIN
  SELECT * INTO v_settings
  FROM public.store_notification_settings
  WHERE store_id = p_store_id;

  IF v_settings IS NULL THEN
    INSERT INTO public.store_notification_settings (store_id)
    VALUES (p_store_id)
    RETURNING * INTO v_settings;
  END IF;

  RETURN v_settings;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_store_notification_settings_on_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.get_or_create_store_notification_settings(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_store_notification_settings ON public.stores;
CREATE TRIGGER trg_seed_store_notification_settings
  AFTER INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_store_notification_settings_on_create();

GRANT EXECUTE ON FUNCTION public.get_or_create_store_notification_settings(UUID) TO postgres, service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_store_notification_settings_on_create() TO postgres, service_role;

-- update_store_stats trigger expects denormalized counters on stores (not always in pg_dump order).
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS total_orders INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue NUMERIC NOT NULL DEFAULT 0;

-- service_products.store_id required by E2E seeds + RLS (older service_products DDL lacked it).
ALTER TABLE public.service_products
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

UPDATE public.service_products sp
SET store_id = p.store_id
FROM public.products p
WHERE sp.product_id = p.id
  AND sp.store_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_service_products_store_id ON public.service_products(store_id);

-- physical_products.store_id required by mixed-cart E2E seeds (PostgREST schema cache).
ALTER TABLE public.physical_products
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

UPDATE public.physical_products pp
SET store_id = p.store_id
FROM public.products p
WHERE pp.product_id = p.id
  AND pp.store_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_physical_products_store_id ON public.physical_products(store_id);

-- Idempotent DDL callable from CI verify (service_role) without a separate patches-only run.
CREATE OR REPLACE FUNCTION public.e2e_apply_schema_patches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  ALTER TABLE public.stores
    ADD COLUMN IF NOT EXISTS total_orders INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_revenue NUMERIC NOT NULL DEFAULT 0;

  ALTER TABLE public.service_products
    ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

  UPDATE public.service_products sp
  SET store_id = p.store_id
  FROM public.products p
  WHERE sp.product_id = p.id
    AND sp.store_id IS NULL;

  ALTER TABLE public.physical_products
    ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

  UPDATE public.physical_products pp
  SET store_id = p.store_id
  FROM public.products p
  WHERE pp.product_id = p.id
    AND pp.store_id IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.e2e_apply_schema_patches() TO service_role;

-- Store wizard + create flow RPCs (pg_dump --no-privileges may omit EXECUTE for authenticated).
GRANT EXECUTE ON FUNCTION public.is_store_slug_available(text, uuid) TO authenticated, anon, service_role;

-- pg_dump --schema-only omits migration INSERT seeds (platform_vendor_plans, legal_documents).
INSERT INTO public.platform_vendor_plans (
  slug, name, description, applies_to_product_type, trial_days, monthly_price, yearly_price,
  max_products, max_staff, max_variants_per_product, max_warehouses, features, display_order
) VALUES
  (
    'physical_basic',
    'Physique — Basic',
    'Abonnement requis pour vendre des produits physiques.',
    'physical',
    30,
    7500, 0,
    50, NULL, 3, 0,
    '["Produits physiques", "Essai 30 jours"]'::jsonb,
    0
  ),
  (
    'physical_standard',
    'Physique — Standard',
    'Abonnement requis pour vendre des produits physiques.',
    'physical',
    30,
    12500, 0,
    200, NULL, 10, 1,
    '["Produits physiques", "Essai 30 jours"]'::jsonb,
    1
  ),
  (
    'physical_premium',
    'Physique — Premium',
    'Abonnement requis pour vendre des produits physiques.',
    'physical',
    30,
    15000, 0,
    NULL, NULL, NULL, NULL,
    '["Produits physiques", "Essai 30 jours"]'::jsonb,
    2
  )
ON CONFLICT (slug) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  trial_days = EXCLUDED.trial_days,
  monthly_price = EXCLUDED.monthly_price,
  max_products = EXCLUDED.max_products,
  max_variants_per_product = EXCLUDED.max_variants_per_product,
  max_warehouses = EXCLUDED.max_warehouses,
  updated_at = now();

INSERT INTO public.legal_documents (
  document_type, version, language, title, content, effective_date, is_active
)
SELECT
  'terms-of-service',
  '1.0',
  'fr',
  'Conditions Générales de Vente E2E',
  'Contenu CGV minimal pour les tests E2E commerce.',
  now(),
  true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.legal_documents ld
  WHERE ld.document_type = 'terms-of-service'
    AND ld.language = 'fr'
    AND ld.version = '1.0'
);

NOTIFY pgrst, 'reload schema';
