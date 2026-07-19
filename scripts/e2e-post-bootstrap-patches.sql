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

NOTIFY pgrst, 'reload schema';
