-- P0: Autoriser product_type = artist dans validate_order_item_product_type (checkout panier)

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
