-- Template applique par scripts/deploy-cache-enterprise.ps1
-- Remplace {{CACHE_INVALIDATION_SECRET}} et {{SUPABASE_PROJECT_REF}}

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
  v_project_url TEXT := 'https://{{SUPABASE_PROJECT_REF}}.supabase.co';
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
      'x-cache-invalidate-secret', '{{CACHE_INVALIDATION_SECRET}}'
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
