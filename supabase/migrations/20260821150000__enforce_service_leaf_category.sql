-- Enforce service taxonomy: products.category_id must be a service leaf.
-- Also keep products.category in sync with the leaf slug.

CREATE OR REPLACE FUNCTION public.sync_service_product_category()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_leaf public.categories%ROWTYPE;
  v_parent public.categories%ROWTYPE;
BEGIN
  IF NEW.product_type IS DISTINCT FROM 'service' THEN
    RETURN NEW;
  END IF;

  IF NEW.category_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_leaf FROM public.categories WHERE id = NEW.category_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Catégorie introuvable';
  END IF;

  IF v_leaf.parent_id IS NULL THEN
    RAISE EXCEPTION 'Sélectionnez une sous-catégorie, pas une catégorie parente';
  END IF;

  IF COALESCE(v_leaf.is_active, true) = false THEN
    RAISE EXCEPTION 'Cette sous-catégorie est inactive';
  END IF;

  IF v_leaf.product_types IS NULL OR NOT ('service' = ANY (v_leaf.product_types)) THEN
    RAISE EXCEPTION 'Cette catégorie n''est pas une catégorie service';
  END IF;

  SELECT * INTO v_parent FROM public.categories WHERE id = v_leaf.parent_id;
  IF NOT FOUND OR v_parent.parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'La sous-catégorie doit appartenir à une catégorie racine';
  END IF;

  IF v_parent.product_types IS NULL OR NOT ('service' = ANY (v_parent.product_types)) THEN
    RAISE EXCEPTION 'La catégorie parente n''est pas une catégorie service';
  END IF;

  NEW.category := v_leaf.slug;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_service_product_category ON public.products;
CREATE TRIGGER trg_sync_service_product_category
  BEFORE INSERT OR UPDATE OF category_id, category, product_type
  ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_service_product_category();
