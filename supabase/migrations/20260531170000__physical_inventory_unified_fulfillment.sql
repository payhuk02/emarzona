-- Plan 30j : schéma inventaire physique unifié, réservation/commit/release stock, trial auto boutique

-- ---------------------------------------------------------------------------
-- 0. Table de base (absente sur certains projets liés)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.physical_product_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  physical_product_id UUID REFERENCES public.physical_products(id) ON DELETE CASCADE,
  variant_id UUID,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  warehouse_id UUID,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  quantity_available INTEGER,
  quantity_reserved INTEGER DEFAULT 0,
  available_quantity INTEGER GENERATED ALWAYS AS (quantity - COALESCE(reserved_quantity, 0)) STORED,
  track_inventory BOOLEAN NOT NULL DEFAULT true,
  location_name TEXT,
  location TEXT,
  low_stock_threshold INTEGER DEFAULT 5,
  reorder_point INTEGER DEFAULT 10,
  reorder_quantity INTEGER DEFAULT 50,
  unit_cost NUMERIC DEFAULT 0,
  batch_number TEXT,
  expiry_date TIMESTAMPTZ,
  last_counted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.physical_product_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners manage physical inventory" ON public.physical_product_inventory;
CREATE POLICY "Store owners manage physical inventory"
  ON public.physical_product_inventory
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = physical_product_inventory.store_id
        AND s.user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS update_physical_product_inventory_updated_at ON public.physical_product_inventory;
CREATE TRIGGER update_physical_product_inventory_updated_at
  BEFORE UPDATE ON public.physical_product_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 1. Colonnes alignées avec l'application (rétro-compat quantity / reserved_quantity)
-- ---------------------------------------------------------------------------
ALTER TABLE public.physical_product_inventory
  ADD COLUMN IF NOT EXISTS physical_product_id UUID REFERENCES public.physical_products(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS quantity_available INTEGER,
  ADD COLUMN IF NOT EXISTS quantity_reserved INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS location_name TEXT,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

CREATE INDEX IF NOT EXISTS idx_physical_product_inventory_physical_product_id
  ON public.physical_product_inventory(physical_product_id);

-- Backfill physical_product_id + colonnes app depuis le schéma legacy
UPDATE public.physical_product_inventory ppi
SET physical_product_id = pp.id
FROM public.physical_products pp
WHERE pp.product_id = ppi.product_id
  AND ppi.physical_product_id IS NULL;

UPDATE public.physical_product_inventory
SET
  quantity_available = COALESCE(quantity_available, quantity, 0),
  quantity_reserved = COALESCE(quantity_reserved, reserved_quantity, 0),
  location_name = COALESCE(location_name, location, 'Default'),
  low_stock_threshold = COALESCE(low_stock_threshold, reorder_point, 5),
  track_inventory = COALESCE(track_inventory, true)
WHERE quantity_available IS NULL
   OR quantity_reserved IS NULL
   OR location_name IS NULL
   OR low_stock_threshold IS NULL;

UPDATE public.physical_product_inventory
SET quantity = quantity_available
WHERE quantity IS DISTINCT FROM quantity_available
  AND quantity_available IS NOT NULL;

UPDATE public.physical_product_inventory
SET reserved_quantity = quantity_reserved
WHERE reserved_quantity IS DISTINCT FROM quantity_reserved
  AND quantity_reserved IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Sync bidirectionnel colonnes legacy <-> app
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_physical_product_inventory_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.quantity_available IS NOT NULL THEN
    NEW.quantity := NEW.quantity_available;
  ELSIF NEW.quantity IS NOT NULL AND NEW.quantity_available IS NULL THEN
    NEW.quantity_available := NEW.quantity;
  END IF;

  IF NEW.quantity_reserved IS NOT NULL THEN
    NEW.reserved_quantity := NEW.quantity_reserved;
  ELSIF NEW.reserved_quantity IS NOT NULL THEN
    NEW.quantity_reserved := NEW.reserved_quantity;
  END IF;

  IF NEW.location_name IS NOT NULL AND (NEW.location IS NULL OR NEW.location = '') THEN
    NEW.location := NEW.location_name;
  ELSIF NEW.location IS NOT NULL AND NEW.location_name IS NULL THEN
    NEW.location_name := NEW.location;
  END IF;

  IF NEW.physical_product_id IS NOT NULL AND NEW.product_id IS NULL THEN
    SELECT pp.product_id INTO NEW.product_id
    FROM public.physical_products pp
    WHERE pp.id = NEW.physical_product_id;
  ELSIF NEW.product_id IS NOT NULL AND NEW.physical_product_id IS NULL THEN
    SELECT pp.id INTO NEW.physical_product_id
    FROM public.physical_products pp
    WHERE pp.product_id = NEW.product_id
    LIMIT 1;
  END IF;

  IF NEW.store_id IS NULL AND NEW.product_id IS NOT NULL THEN
    SELECT p.store_id INTO NEW.store_id
    FROM public.products p
    WHERE p.id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_physical_product_inventory_columns ON public.physical_product_inventory;
CREATE TRIGGER sync_physical_product_inventory_columns
  BEFORE INSERT OR UPDATE ON public.physical_product_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_physical_product_inventory_columns();

-- ---------------------------------------------------------------------------
-- 3. Helpers stock
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.physical_inventory_sellable(p_row public.physical_product_inventory)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT GREATEST(
    0,
    COALESCE(p_row.quantity, p_row.quantity_available, 0)
      - COALESCE(p_row.reserved_quantity, p_row.quantity_reserved, 0)
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. Réserver le stock pour une commande (checkout panier / buy-now)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_physical_inventory_for_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  inv RECORD;
  v_need INTEGER;
  v_avail INTEGER;
  v_meta JSONB;
  v_inv_id UUID;
BEGIN
  FOR item IN
    SELECT
      oi.id,
      oi.physical_product_id,
      oi.quantity,
      oi.item_metadata
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.product_type = 'physical'
  LOOP
    IF item.physical_product_id IS NULL THEN
      RAISE EXCEPTION 'physical_product_id manquant pour order_item %', item.id;
    END IF;

    IF COALESCE((item.item_metadata->>'inventory_reserved')::boolean, false) IS TRUE THEN
      CONTINUE;
    END IF;

    v_need := GREATEST(COALESCE(item.quantity, 1), 1);

    SELECT ppi.*
    INTO inv
    FROM public.physical_product_inventory ppi
    WHERE ppi.physical_product_id = item.physical_product_id
      AND COALESCE(ppi.track_inventory, true) = true
    ORDER BY public.physical_inventory_sellable(ppi) DESC, ppi.created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
      SELECT ppi.*
      INTO inv
      FROM public.physical_product_inventory ppi
      INNER JOIN public.physical_products pp ON pp.id = item.physical_product_id
      WHERE ppi.product_id = pp.product_id
        AND COALESCE(ppi.track_inventory, true) = true
      ORDER BY public.physical_inventory_sellable(ppi) DESC, ppi.created_at ASC
      LIMIT 1
      FOR UPDATE;
    END IF;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Aucun inventaire suivi pour le produit physique %', item.physical_product_id;
    END IF;

    v_avail := public.physical_inventory_sellable(inv);

    IF v_avail < v_need THEN
      RAISE EXCEPTION 'Stock insuffisant (demandé: %, disponible: %)', v_need, v_avail;
    END IF;

    UPDATE public.physical_product_inventory
    SET
      reserved_quantity = COALESCE(reserved_quantity, 0) + v_need,
      quantity_reserved = COALESCE(quantity_reserved, reserved_quantity, 0) + v_need,
      updated_at = now()
    WHERE id = inv.id;

    v_meta := COALESCE(item.item_metadata, '{}'::jsonb)
      || jsonb_build_object(
        'inventory_id', inv.id,
        'inventory_reserved', true,
        'inventory_reservation_qty', v_need,
        'inventory_location', COALESCE(inv.location_name, inv.location)
      );

    UPDATE public.order_items
    SET item_metadata = v_meta
    WHERE id = item.id;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.reserve_physical_inventory_for_order IS
  'Réserve le stock physique pour chaque ligne physical d''une commande pending (avant paiement).';

-- ---------------------------------------------------------------------------
-- 5. Libérer les réservations (paiement échoué / annulation)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_physical_inventory_for_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  v_inv_id UUID;
  v_qty INTEGER;
BEGIN
  FOR item IN
    SELECT oi.id, oi.quantity, oi.item_metadata
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.product_type = 'physical'
  LOOP
    IF NOT COALESCE((item.item_metadata->>'inventory_reserved')::boolean, false) IS TRUE THEN
      CONTINUE;
    END IF;

    BEGIN
      v_inv_id := (item.item_metadata->>'inventory_id')::uuid;
    EXCEPTION
      WHEN OTHERS THEN
        v_inv_id := NULL;
    END;

    v_qty := COALESCE(
      NULLIF(item.item_metadata->>'inventory_reservation_qty', '')::integer,
      item.quantity,
      1
    );

    IF v_inv_id IS NOT NULL THEN
      UPDATE public.physical_product_inventory
      SET
        reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - v_qty),
        quantity_reserved = GREATEST(0, COALESCE(quantity_reserved, reserved_quantity, 0) - v_qty),
        updated_at = now()
      WHERE id = v_inv_id;
    END IF;

    UPDATE public.order_items
    SET item_metadata = COALESCE(item.item_metadata, '{}'::jsonb)
      - 'inventory_reserved'
      - 'inventory_reservation_qty'
    WHERE id = item.id;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.release_physical_inventory_for_order IS
  'Annule les réservations de stock pour une commande non payée.';

-- ---------------------------------------------------------------------------
-- 6. Déduire le stock vendu quand la commande est payée (trigger orders)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fulfill_physical_inventory_on_order_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  v_inv_id UUID;
  v_qty INTEGER;
  v_already_committed BOOLEAN;
BEGIN
  IF COALESCE(OLD.payment_status, '') IN ('paid', 'completed') THEN
    RETURN NEW;
  END IF;

  IF NEW.payment_status NOT IN ('paid', 'completed') THEN
    RETURN NEW;
  END IF;

  FOR item IN
    SELECT oi.id, oi.quantity, oi.item_metadata
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_type = 'physical'
  LOOP
    v_already_committed := COALESCE((item.item_metadata->>'inventory_committed')::boolean, false);
    IF v_already_committed THEN
      CONTINUE;
    END IF;

    BEGIN
      v_inv_id := (item.item_metadata->>'inventory_id')::uuid;
    EXCEPTION
      WHEN OTHERS THEN
        v_inv_id := NULL;
    END;

    v_qty := COALESCE(
      NULLIF(item.item_metadata->>'inventory_reservation_qty', '')::integer,
      item.quantity,
      1
    );

    IF v_inv_id IS NULL THEN
      CONTINUE;
    END IF;

    UPDATE public.physical_product_inventory
    SET
      quantity = GREATEST(0, COALESCE(quantity, quantity_available, 0) - v_qty),
      quantity_available = GREATEST(0, COALESCE(quantity_available, quantity, 0) - v_qty),
      reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - v_qty),
      quantity_reserved = GREATEST(0, COALESCE(quantity_reserved, reserved_quantity, 0) - v_qty),
      updated_at = now()
    WHERE id = v_inv_id;

    UPDATE public.order_items
    SET item_metadata = COALESCE(item.item_metadata, '{}'::jsonb)
      || jsonb_build_object('inventory_committed', true, 'inventory_reserved', false)
    WHERE id = item.id;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fulfill_physical_inventory_on_order_paid ON public.orders;
CREATE TRIGGER fulfill_physical_inventory_on_order_paid
  AFTER UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.fulfill_physical_inventory_on_order_paid();

COMMENT ON FUNCTION public.fulfill_physical_inventory_on_order_paid IS
  'Déduit le stock physique et libère la réservation après paiement confirmé.';

-- ---------------------------------------------------------------------------
-- 7. Libération auto si paiement échoue / annulé
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_physical_inventory_on_order_unpaid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(OLD.payment_status, '') IN ('paid', 'completed') THEN
    RETURN NEW;
  END IF;

  IF NEW.payment_status NOT IN ('failed', 'cancelled', 'canceled', 'refunded') THEN
    RETURN NEW;
  END IF;

  PERFORM public.release_physical_inventory_for_order(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS release_physical_inventory_on_order_unpaid ON public.orders;
CREATE TRIGGER release_physical_inventory_on_order_unpaid
  AFTER UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.release_physical_inventory_on_order_unpaid();

-- ---------------------------------------------------------------------------
-- 8. Trial physique automatique à la création d'une boutique
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_store_physical_trial_on_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id UUID;
  v_trial_days INTEGER;
BEGIN
  SELECT id, trial_days
  INTO v_plan_id, v_trial_days
  FROM public.platform_vendor_plans
  WHERE slug = 'physical_basic'
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_trial_days := COALESCE(v_trial_days, 30);

  INSERT INTO public.store_platform_subscriptions (
    store_id,
    plan_id,
    status,
    billing_cycle,
    mrr_amount,
    trial_ends_at,
    current_period_start,
    current_period_end
  )
  VALUES (
    NEW.id,
    v_plan_id,
    'trialing',
    'monthly',
    0,
    now() + (v_trial_days || ' days')::interval,
    now(),
    now() + interval '30 days'
  )
  ON CONFLICT (store_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_store_physical_trial_on_create ON public.stores;
CREATE TRIGGER trg_store_physical_trial_on_create
  AFTER INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_store_physical_trial_on_create();

COMMENT ON FUNCTION public.ensure_store_physical_trial_on_create IS
  'Crée un abonnement physical_basic en essai 30j pour chaque nouvelle boutique.';

-- RPC accessibles au client authentifié (checkout)
GRANT EXECUTE ON FUNCTION public.reserve_physical_inventory_for_order(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.release_physical_inventory_for_order(UUID) TO authenticated, service_role;
