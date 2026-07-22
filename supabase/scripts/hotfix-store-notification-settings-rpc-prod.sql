-- Hotfix prod: store create fails with 42883
-- function public.get_or_create_store_notification_settings(uuid) does not exist
-- while trg_seed_store_notification_settings still fires on INSERT stores.
-- Idempotent — coller dans Supabase SQL Editor (projet prod hbdnzajbyjakdhuavrvb).

BEGIN;

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
  BEGIN
    PERFORM public.get_or_create_store_notification_settings(NEW.id);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'seed_store_notification_settings_on_create failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_store_notification_settings ON public.stores;
CREATE TRIGGER trg_seed_store_notification_settings
  AFTER INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_store_notification_settings_on_create();

GRANT EXECUTE ON FUNCTION public.get_or_create_store_notification_settings(UUID)
  TO postgres, service_role, authenticated, anon;

NOTIFY pgrst, 'reload schema';

COMMIT;
