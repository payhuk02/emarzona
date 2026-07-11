-- Phase 1: Block commerce_type changes when a store already has catalog products.
-- Exposes RPC for UI guards and enforces at DB level.

BEGIN;

CREATE OR REPLACE FUNCTION public.store_catalog_product_count(p_store_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::BIGINT
  FROM public.products
  WHERE store_id = p_store_id;
$$;

COMMENT ON FUNCTION public.store_catalog_product_count(UUID) IS
  'Nombre de produits catalogue d''une boutique (tous types confondus).';

GRANT EXECUTE ON FUNCTION public.store_catalog_product_count(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_change_store_commerce_type(p_store_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owned BOOLEAN;
  v_count BIGINT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = p_store_id AND s.user_id = auth.uid()
  ) INTO v_owned;

  IF NOT v_owned THEN
    RETURN FALSE;
  END IF;

  v_count := public.store_catalog_product_count(p_store_id);
  RETURN v_count = 0;
END;
$$;

COMMENT ON FUNCTION public.can_change_store_commerce_type(UUID) IS
  'True si le propriétaire peut changer commerce_type (aucun produit en catalogue).';

GRANT EXECUTE ON FUNCTION public.can_change_store_commerce_type(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.store_commerce_type_change_status(p_store_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owned BOOLEAN;
  v_count BIGINT;
  v_type TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = p_store_id AND s.user_id = auth.uid()
  ) INTO v_owned;

  IF NOT v_owned THEN
    RETURN jsonb_build_object(
      'can_change', false,
      'product_count', 0,
      'current_type', 'physical',
      'error', 'not_owner'
    );
  END IF;

  v_count := public.store_catalog_product_count(p_store_id);
  v_type := public.store_commerce_type(p_store_id);

  RETURN jsonb_build_object(
    'can_change', v_count = 0,
    'product_count', v_count,
    'current_type', v_type
  );
END;
$$;

COMMENT ON FUNCTION public.store_commerce_type_change_status(UUID) IS
  'Statut UI: changement de type autorisé + nombre de produits + type courant.';

GRANT EXECUTE ON FUNCTION public.store_commerce_type_change_status(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_store_commerce_type_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_type TEXT;
  v_new_type TEXT;
  v_product_count BIGINT;
BEGIN
  v_old_type := COALESCE(NULLIF(OLD.commerce_type, ''), OLD.metadata->>'commerce_type', 'physical');
  v_new_type := COALESCE(NULLIF(NEW.commerce_type, ''), NEW.metadata->>'commerce_type', 'physical');

  IF v_old_type IS DISTINCT FROM v_new_type THEN
    v_product_count := public.store_catalog_product_count(OLD.id);
    IF v_product_count > 0 THEN
      RAISE EXCEPTION
        'STORE_COMMERCE_TYPE_LOCKED: impossible de changer le type de boutique (% produit(s) en catalogue)',
        v_product_count
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_store_commerce_type_change_trg ON public.stores;
CREATE TRIGGER guard_store_commerce_type_change_trg
BEFORE UPDATE OF commerce_type, metadata ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.guard_store_commerce_type_change();

COMMIT;
