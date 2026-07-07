-- Hotfix prod: colonnes order_items manquantes pour checkout physique invité
-- (migration 20251028000001 jamais appliquée en prod)

BEGIN;

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS digital_product_id UUID REFERENCES public.digital_products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS physical_product_id UUID REFERENCES public.physical_products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS service_product_id UUID REFERENCES public.service_products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.physical_product_variants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS license_id UUID REFERENCES public.digital_licenses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.service_bookings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS item_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.order_items oi
SET
  physical_product_id = pp.id,
  item_metadata = COALESCE(oi.item_metadata, '{}'::jsonb)
FROM public.physical_products pp
WHERE oi.product_type = 'physical'
  AND oi.physical_product_id IS NULL
  AND pp.product_id = oi.product_id;

UPDATE public.order_items
SET item_metadata = '{}'::jsonb
WHERE item_metadata IS NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_physical_product
  ON public.order_items(physical_product_id)
  WHERE physical_product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_variant
  ON public.order_items(variant_id)
  WHERE variant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_order_product_type
  ON public.order_items(order_id, product_type);

CREATE OR REPLACE FUNCTION public.validate_order_item_product_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
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

DROP TRIGGER IF EXISTS validate_order_item_type ON public.order_items;

CREATE TRIGGER validate_order_item_type
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW
  WHEN (NEW.product_type IS NOT NULL)
  EXECUTE FUNCTION public.validate_order_item_product_type();

COMMENT ON COLUMN public.order_items.physical_product_id IS
  'Référence vers physical_products si product_type=physical';

COMMENT ON COLUMN public.order_items.item_metadata IS
  'Métadonnées additionnelles (inventaire, adresse livraison, etc.)';

COMMIT;
