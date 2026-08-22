-- Allow Daily.co (and custom links) as persisted preferred_meeting_platform.
-- Previously CHECK only allowed zoom / google_meet, so Daily stayed runtime-only.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    WHERE con.conrelid = 'public.service_products'::regclass
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%preferred_meeting_platform%'
  LOOP
    EXECUTE format('ALTER TABLE public.service_products DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.service_products
  ADD CONSTRAINT service_products_preferred_meeting_platform_check
  CHECK (
    preferred_meeting_platform IS NULL
    OR preferred_meeting_platform IN ('zoom', 'google_meet', 'daily', 'custom')
  );

COMMENT ON COLUMN public.service_products.preferred_meeting_platform IS
  'Plateforme visio par défaut : daily (Emarzona Visio), zoom, google_meet, ou custom (meeting_url).';

UPDATE public.service_products
SET preferred_meeting_platform = 'daily'
WHERE preferred_meeting_platform IS NULL
  AND location_type IN ('online', 'flexible');

CREATE OR REPLACE FUNCTION public.service_products_default_meeting_platform()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.preferred_meeting_platform IS NULL
     AND NEW.location_type IN ('online', 'flexible') THEN
    NEW.preferred_meeting_platform := 'daily';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_service_products_default_meeting_platform ON public.service_products;
CREATE TRIGGER trg_service_products_default_meeting_platform
  BEFORE INSERT OR UPDATE OF location_type, preferred_meeting_platform
  ON public.service_products
  FOR EACH ROW
  EXECUTE FUNCTION public.service_products_default_meeting_platform();
