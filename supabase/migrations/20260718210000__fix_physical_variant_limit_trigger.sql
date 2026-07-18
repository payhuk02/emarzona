-- P0: enforce variant limits on physical_product_variants (canonical table used by wizards/RPCs)
BEGIN;

CREATE OR REPLACE FUNCTION public.count_physical_product_variants(p_physical_product_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INT
  FROM public.physical_product_variants ppv
  WHERE ppv.physical_product_id = p_physical_product_id;
$$;

DROP TRIGGER IF EXISTS trg_enforce_physical_variant_limit ON public.product_variants;
DROP TRIGGER IF EXISTS trg_enforce_physical_variant_limit ON public.physical_product_variants;

CREATE TRIGGER trg_enforce_physical_variant_limit
  BEFORE INSERT ON public.physical_product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_physical_variant_limit();

COMMIT;
