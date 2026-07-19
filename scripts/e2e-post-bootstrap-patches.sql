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

NOTIFY pgrst, 'reload schema';
