-- P2 audit C2: slug availability case-insensitive (align with generateSlug lowercasing)
CREATE OR REPLACE FUNCTION public.is_store_slug_available(check_slug text, exclude_store_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_slug text;
BEGIN
  normalized_slug := lower(trim(check_slug));

  IF normalized_slug IS NULL OR normalized_slug = '' THEN
    RETURN false;
  END IF;

  IF exclude_store_id IS NOT NULL THEN
    RETURN NOT EXISTS (
      SELECT 1
      FROM public.stores
      WHERE lower(slug) = normalized_slug
        AND id != exclude_store_id
    );
  END IF;

  RETURN NOT EXISTS (
    SELECT 1
    FROM public.stores
    WHERE lower(slug) = normalized_slug
  );
END;
$$;

COMMENT ON FUNCTION public.is_store_slug_available IS
  'Vérifie la disponibilité d''un slug boutique (comparaison insensible à la casse).';
