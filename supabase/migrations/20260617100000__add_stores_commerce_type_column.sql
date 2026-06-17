-- Phase 1: Introduce typed stores.commerce_type and keep metadata in sync.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stores'
      AND column_name = 'commerce_type'
  ) THEN
    ALTER TABLE public.stores
      ADD COLUMN commerce_type TEXT;
  END IF;
END;
$$;

ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS stores_commerce_type_check;

ALTER TABLE public.stores
  ADD CONSTRAINT stores_commerce_type_check
  CHECK (commerce_type IN ('physical', 'digital', 'service', 'course', 'artist'));

UPDATE public.stores
SET commerce_type = COALESCE(NULLIF(metadata->>'commerce_type', ''), 'physical')
WHERE commerce_type IS NULL;

ALTER TABLE public.stores
  ALTER COLUMN commerce_type SET DEFAULT 'physical',
  ALTER COLUMN commerce_type SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stores_commerce_type ON public.stores (commerce_type);

CREATE OR REPLACE FUNCTION public.sync_store_commerce_type_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.commerce_type := COALESCE(NULLIF(NEW.commerce_type, ''), NEW.metadata->>'commerce_type', 'physical');
  NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb);
  NEW.metadata := jsonb_set(NEW.metadata, '{commerce_type}', to_jsonb(NEW.commerce_type), true);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_store_commerce_type_fields_trg ON public.stores;
CREATE TRIGGER sync_store_commerce_type_fields_trg
BEFORE INSERT OR UPDATE OF commerce_type, metadata ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.sync_store_commerce_type_fields();

COMMENT ON COLUMN public.stores.commerce_type IS
  'Typed commerce type for store feature capabilities. Synced to metadata.commerce_type for retrocompat.';

CREATE OR REPLACE FUNCTION public.store_commerce_type(p_store_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT COALESCE(
        NULLIF(commerce_type, ''),
        NULLIF(metadata->>'commerce_type', ''),
        'physical'
      )
      FROM public.stores
      WHERE id = p_store_id
    ),
    'physical'
  );
$$;

COMMENT ON FUNCTION public.store_commerce_type(UUID) IS
  'Type de boutique (stores.commerce_type, fallback metadata.commerce_type), défaut physical pour rétrocompat.';

COMMIT;
