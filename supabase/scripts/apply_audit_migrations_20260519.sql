-- =============================================================================
-- Emarzona — Audit migrations combinées (2026-05-19)
-- 1) 20260519120000 — validate_order_item_product_type (+ artist)
-- 2) 20260519130000 — fulfill_digital_order_items_on_paid
-- Idempotent : CREATE OR REPLACE + DROP TRIGGER IF EXISTS
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1/2 validate_order_item_product_type (artist dans checkout panier)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_order_item_product_type()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  CASE NEW.product_type
    WHEN 'digital' THEN
      IF NEW.digital_product_id IS NULL THEN
        RAISE EXCEPTION 'digital_product_id requis pour product_type=digital';
      END IF;
      NEW.physical_product_id := NULL;
      NEW.service_product_id := NULL;

    WHEN 'physical' THEN
      IF NEW.physical_product_id IS NULL THEN
        RAISE EXCEPTION 'physical_product_id requis pour product_type=physical';
      END IF;
      NEW.digital_product_id := NULL;
      NEW.service_product_id := NULL;
      NEW.license_id := NULL;
      NEW.booking_id := NULL;

    WHEN 'service' THEN
      IF NEW.service_product_id IS NULL THEN
        RAISE EXCEPTION 'service_product_id requis pour product_type=service';
      END IF;
      NEW.digital_product_id := NULL;
      NEW.physical_product_id := NULL;
      NEW.license_id := NULL;
      NEW.variant_id := NULL;

    WHEN 'generic', 'course', 'artist' THEN
      NULL;

    ELSE
      RAISE EXCEPTION 'product_type invalide: %', NEW.product_type;
  END CASE;

  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2/2 fulfill_digital_order_items_on_paid (licences après paiement)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fulfill_digital_order_items_on_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  dp RECORD;
  v_user_id UUID;
  v_customer_email TEXT;
  v_customer_name TEXT;
  v_license_id UUID;
  v_auto_generate BOOLEAN;
  v_license_type TEXT;
  v_max_activations INTEGER;
BEGIN
  IF COALESCE(OLD.payment_status, '') IN ('paid', 'completed') THEN
    RETURN NEW;
  END IF;

  IF NEW.payment_status NOT IN ('paid', 'completed') THEN
    RETURN NEW;
  END IF;

  SELECT
    c.user_id,
    c.email,
    COALESCE(NULLIF(TRIM(c.name), ''), 'Client')
  INTO v_user_id, v_customer_email, v_customer_name
  FROM public.customers c
  WHERE c.id = NEW.customer_id;

  IF v_user_id IS NULL AND NEW.metadata IS NOT NULL AND (NEW.metadata ? 'checkout_user_id') THEN
    BEGIN
      v_user_id := (NEW.metadata->>'checkout_user_id')::uuid;
    EXCEPTION
      WHEN OTHERS THEN
        v_user_id := NULL;
    END;
  END IF;

  FOR item IN
    SELECT
      oi.id,
      oi.digital_product_id,
      oi.license_id,
      oi.item_metadata
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_type = 'digital'
  LOOP
    IF item.license_id IS NOT NULL THEN
      UPDATE public.digital_licenses
      SET
        status = 'active',
        activated_at = COALESCE(activated_at, now()),
        order_id = COALESCE(order_id, NEW.id),
        updated_at = now()
      WHERE id = item.license_id
        AND status = 'pending';

      CONTINUE;
    END IF;

    IF item.digital_product_id IS NULL OR v_user_id IS NULL THEN
      CONTINUE;
    END IF;

    v_auto_generate := COALESCE(
      NULLIF(item.item_metadata->>'auto_generate_license', '')::boolean,
      true
    );

    IF NOT v_auto_generate THEN
      CONTINUE;
    END IF;

    SELECT
      dp.id,
      dp.license_type,
      dp.max_activations,
      dp.auto_generate_keys
    INTO dp
    FROM public.digital_products dp
    WHERE dp.id = item.digital_product_id;

    IF NOT FOUND OR COALESCE(dp.auto_generate_keys, true) IS NOT TRUE THEN
      CONTINUE;
    END IF;

    v_license_type := COALESCE(dp.license_type, 'single');
    v_max_activations := CASE
      WHEN v_license_type = 'unlimited' THEN -1
      ELSE COALESCE(dp.max_activations, 1)
    END;

    INSERT INTO public.digital_licenses (
      digital_product_id,
      user_id,
      license_key,
      license_type,
      status,
      max_activations,
      current_activations,
      activated_at,
      order_id,
      customer_email,
      customer_name
    )
    VALUES (
      item.digital_product_id,
      v_user_id,
      public.generate_license_key(),
      v_license_type,
      'active',
      v_max_activations,
      0,
      now(),
      NEW.id,
      v_customer_email,
      v_customer_name
    )
    RETURNING id INTO v_license_id;

    UPDATE public.order_items
    SET license_id = v_license_id
    WHERE id = item.id;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fulfill_digital_items_on_order_paid ON public.orders;
CREATE TRIGGER fulfill_digital_items_on_order_paid
  AFTER UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.fulfill_digital_order_items_on_paid();

COMMENT ON FUNCTION public.fulfill_digital_order_items_on_paid IS
  'Active les licences pending ou en crée de nouvelles pour les order_items digital après paiement (checkout panier inclus).';

-- Enregistrer dans l'historique Supabase CLI (évite un re-push accidentel)
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES
  ('20260519120000'),
  ('20260519130000')
ON CONFLICT (version) DO NOTHING;

COMMIT;
