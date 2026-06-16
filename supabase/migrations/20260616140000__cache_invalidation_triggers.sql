-- =========================================================
-- Cache invalidation automatique — triggers products / stores
-- Appelle l'Edge Function cache-invalidate via pg_net
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_cache_invalidate_catalog()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record_id UUID;
  v_store_id UUID;
  v_payload JSONB;
  v_project_url TEXT := 'https://hbdnzajbyjakdhuavrvb.supabase.co';
BEGIN
  v_record_id := COALESCE(NEW.id, OLD.id);
  v_store_id := COALESCE(NEW.store_id, OLD.store_id);

  v_payload := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'record_id', v_record_id::text,
    'store_id', CASE WHEN v_store_id IS NOT NULL THEN v_store_id::text ELSE NULL END
  );

  PERFORM net.http_post(
    url := v_project_url || '/functions/v1/cache-invalidate',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cache-invalidate-secret', 'REPLACE_WITH_CACHE_INVALIDATION_SECRET'
    ),
    body := v_payload
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'cache-invalidate trigger failed for %: %', TG_TABLE_NAME, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.notify_cache_invalidate_catalog IS
  'Déclenche purge Redis edge après mutation catalogue (products, stores). Configurer REPLACE_WITH_CACHE_INVALIDATION_SECRET via Supabase Vault ou migration manuelle.';

-- products
DROP TRIGGER IF EXISTS trg_products_cache_invalidate ON public.products;
CREATE TRIGGER trg_products_cache_invalidate
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_cache_invalidate_catalog();

-- stores
DROP TRIGGER IF EXISTS trg_stores_cache_invalidate ON public.stores;
CREATE TRIGGER trg_stores_cache_invalidate
  AFTER INSERT OR UPDATE OR DELETE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_cache_invalidate_catalog();
