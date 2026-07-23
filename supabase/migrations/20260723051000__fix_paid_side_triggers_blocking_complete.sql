-- P0: payment completion must not die on loyalty/digital/payment side-triggers

BEGIN;

-- 1) Digital fulfill: customers has no user_id column
CREATE OR REPLACE FUNCTION public.fulfill_digital_order_items_on_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    c.email,
    COALESCE(NULLIF(TRIM(c.name), ''), 'Client')
  INTO v_customer_email, v_customer_name
  FROM public.customers c
  WHERE c.id = NEW.customer_id;

  v_user_id := NULL;
  IF NEW.metadata IS NOT NULL AND (NEW.metadata ? 'checkout_user_id') THEN
    BEGIN
      v_user_id := (NEW.metadata->>'checkout_user_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_user_id := NULL;
    END;
  END IF;

  -- Fallback: order.customer_id may itself be an auth user id on some paths
  IF v_user_id IS NULL AND NEW.customer_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM auth.users u WHERE u.id = NEW.customer_id) THEN
      v_user_id := NEW.customer_id;
    END IF;
  END IF;

  IF v_customer_email IS NULL OR trim(v_customer_email) = '' THEN
    v_customer_email := NULLIF(trim(COALESCE(NEW.customer_email, '')), '');
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
        user_id = COALESCE(user_id, v_user_id),
        updated_at = now()
      WHERE id = item.license_id
        AND status IN ('pending', 'active');
      CONTINUE;
    END IF;

    IF item.digital_product_id IS NULL THEN
      CONTINUE;
    END IF;
    IF v_user_id IS NULL AND (v_customer_email IS NULL OR trim(v_customer_email) = '') THEN
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
      id,
      license_type,
      max_activations,
      auto_generate_keys
    INTO dp
    FROM public.digital_products
    WHERE id = item.digital_product_id;

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
$function$;

-- 2) payments → transactions side-effect: stores.user_id not owner_id; soft-fail
CREATE OR REPLACE FUNCTION public.create_transaction_after_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Legacy mirror into transactions is obsolete (PSP path owns transactions).
  -- Keep as no-op so INSERT payments never blocks S4 sync.
  RETURN NEW;
END;
$function$;

COMMIT;
