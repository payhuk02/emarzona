-- P2 audit C9: seed store_notification_settings row when a store is created
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

COMMENT ON FUNCTION public.seed_store_notification_settings_on_create IS
  'Crée les paramètres de notifications email par défaut pour chaque nouvelle boutique.';
