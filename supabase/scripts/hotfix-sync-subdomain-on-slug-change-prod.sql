-- Hotfix prod: sync subdomain when store slug changes
-- Mirror of 20260722110000__sync_subdomain_on_slug_change.sql

DROP FUNCTION IF EXISTS public.generate_subdomain_from_slug(text);

CREATE OR REPLACE FUNCTION public.generate_subdomain_from_slug(
  store_slug text,
  exclude_store_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  generated_subdomain text;
  counter integer := 0;
  max_attempts integer := 100;
  base_slug text;
BEGIN
  base_slug := lower(trim(store_slug));
  generated_subdomain := regexp_replace(base_slug, '[^a-z0-9-]', '', 'g');
  generated_subdomain := regexp_replace(generated_subdomain, '-+', '-', 'g');
  generated_subdomain := trim(both '-' from generated_subdomain);

  IF length(generated_subdomain) > 63 THEN
    generated_subdomain := trim(both '-' from substring(generated_subdomain, 1, 63));
  END IF;

  WHILE (
    public.is_subdomain_reserved(generated_subdomain)
    OR NOT public.is_valid_subdomain(generated_subdomain)
    OR EXISTS (
      SELECT 1
      FROM public.stores s
      WHERE lower(trim(s.subdomain)) = generated_subdomain
        AND (exclude_store_id IS NULL OR s.id <> exclude_store_id)
    )
  ) AND counter < max_attempts
  LOOP
    counter := counter + 1;
    generated_subdomain := base_slug || '-' || counter::text;
    generated_subdomain := regexp_replace(generated_subdomain, '[^a-z0-9-]', '', 'g');
    generated_subdomain := regexp_replace(generated_subdomain, '-+', '-', 'g');
    generated_subdomain := trim(both '-' from generated_subdomain);
    IF length(generated_subdomain) > 63 THEN
      generated_subdomain := trim(both '-' from substring(generated_subdomain, 1, 63));
    END IF;
  END LOOP;

  IF counter >= max_attempts THEN
    RETURN NULL;
  END IF;

  RETURN generated_subdomain;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_generate_subdomain()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  old_slug text;
  old_subdomain text;
  should_rematch boolean;
BEGIN
  old_slug := CASE WHEN TG_OP = 'UPDATE' THEN lower(trim(OLD.slug)) ELSE NULL END;
  old_subdomain := CASE WHEN TG_OP = 'UPDATE' THEN lower(trim(COALESCE(OLD.subdomain, ''))) ELSE NULL END;

  should_rematch :=
    TG_OP = 'UPDATE'
    AND NEW.slug IS DISTINCT FROM OLD.slug
    AND (
      NEW.subdomain IS NULL
      OR trim(NEW.subdomain) = ''
      OR old_subdomain = old_slug
      OR old_subdomain = ''
    );

  IF should_rematch THEN
    NEW.subdomain := public.generate_subdomain_from_slug(NEW.slug, NEW.id);
  ELSIF NEW.subdomain IS NULL OR trim(NEW.subdomain) = '' THEN
    NEW.subdomain := public.generate_subdomain_from_slug(NEW.slug, NEW.id);
  ELSE
    NEW.subdomain := lower(trim(NEW.subdomain));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_generate_subdomain ON public.stores;
CREATE TRIGGER trigger_auto_generate_subdomain
  BEFORE INSERT OR UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_subdomain();
