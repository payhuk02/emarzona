-- Phase 1 : synchronisation inventaire legacy + backfill licences digitales

-- ---------------------------------------------------------------------------
-- 1. Sync inventory_items ← physical_product_inventory (legacy warehouse UI)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_inventory_items_from_ppi()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id UUID;
  v_sku TEXT;
BEGIN
  IF NEW.physical_product_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.variant_id IS NOT NULL THEN
    SELECT pv.sku INTO v_sku
    FROM public.physical_product_variants pv
    WHERE pv.id = NEW.variant_id;
  END IF;

  SELECT ii.id
  INTO v_existing_id
  FROM public.inventory_items ii
  WHERE ii.physical_product_id = NEW.physical_product_id
    AND ii.variant_id IS NOT DISTINCT FROM NEW.variant_id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.inventory_items
    SET
      quantity_available = COALESCE(NEW.quantity_available, NEW.quantity, 0),
      quantity_reserved = COALESCE(NEW.quantity_reserved, NEW.reserved_quantity, 0),
      warehouse_location = NEW.location_name,
      reorder_point = COALESCE(NEW.reorder_point, reorder_point),
      reorder_quantity = COALESCE(NEW.reorder_quantity, reorder_quantity),
      unit_cost = COALESCE(NEW.unit_cost, unit_cost),
      last_counted_at = COALESCE(NEW.last_counted_at, last_counted_at),
      updated_at = now()
    WHERE id = v_existing_id;
  ELSE
    INSERT INTO public.inventory_items (
      physical_product_id,
      variant_id,
      sku,
      quantity_available,
      quantity_reserved,
      warehouse_location,
      reorder_point,
      reorder_quantity,
      unit_cost,
      last_counted_at
    )
    VALUES (
      NEW.physical_product_id,
      NEW.variant_id,
      COALESCE(v_sku, 'PPI-' || LEFT(NEW.id::text, 8)),
      COALESCE(NEW.quantity_available, NEW.quantity, 0),
      COALESCE(NEW.quantity_reserved, NEW.reserved_quantity, 0),
      NEW.location_name,
      COALESCE(NEW.reorder_point, 10),
      COALESCE(NEW.reorder_quantity, 50),
      COALESCE(NEW.unit_cost, 0),
      NEW.last_counted_at
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_inventory_items_from_ppi ON public.physical_product_inventory;
CREATE TRIGGER sync_inventory_items_from_ppi
  AFTER INSERT OR UPDATE OF
    quantity,
    quantity_available,
    quantity_reserved,
    reserved_quantity,
    location_name,
    reorder_point,
    reorder_quantity,
    unit_cost,
    last_counted_at
  ON public.physical_product_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_inventory_items_from_ppi();

-- Backfill initial : déclencher le trigger sur toutes les lignes PPI
UPDATE public.physical_product_inventory
SET updated_at = now()
WHERE physical_product_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Backfill digital_licenses depuis digital_product_licenses (legacy, si table existe)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'digital_product_licenses'
  ) THEN
    INSERT INTO public.digital_licenses (
      digital_product_id,
      user_id,
      order_id,
      license_key,
      license_type,
      status,
      max_activations,
      current_activations,
      issued_at,
      activated_at,
      expires_at,
      customer_email,
      internal_notes,
      created_at,
      updated_at
    )
    SELECT
      dp.id,
      c.user_id,
      dpl.order_id,
      dpl.license_key,
      CASE dpl.license_type::text
        WHEN 'subscription' THEN 'subscription'
        WHEN 'unlimited' THEN 'unlimited'
        WHEN 'multi' THEN 'multi'
        ELSE 'single'
      END,
      CASE dpl.status::text
        WHEN 'active' THEN 'active'
        WHEN 'expired' THEN 'expired'
        WHEN 'revoked' THEN 'revoked'
        WHEN 'suspended' THEN 'suspended'
        ELSE 'pending'
      END,
      dpl.max_activations,
      dpl.current_activations,
      COALESCE(dpl.issued_at, dpl.created_at),
      dpl.activated_at,
      dpl.expires_at,
      c.email,
      dpl.notes,
      dpl.created_at,
      dpl.updated_at
    FROM public.digital_product_licenses dpl
    INNER JOIN public.digital_products dp ON dp.product_id = dpl.product_id
    LEFT JOIN public.customers c ON c.id = dpl.customer_id
    WHERE c.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.digital_licenses dl
        WHERE dl.license_key = dpl.license_key
      );
  END IF;
END;
$$;
