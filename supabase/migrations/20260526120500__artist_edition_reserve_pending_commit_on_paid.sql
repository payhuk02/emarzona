-- H-01 : réserver le stock sur commandes pending (sans incrémenter version)
-- Incrémenter version uniquement après paiement confirmé (paid/completed)

CREATE OR REPLACE FUNCTION public.check_and_increment_artist_product_version(
  p_product_id UUID,
  p_expected_version INTEGER,
  p_quantity INTEGER DEFAULT 1
)
RETURNS TABLE(
  success BOOLEAN,
  current_version INTEGER,
  available_editions INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_artist_product RECORD;
  v_current_version INTEGER;
  v_total_editions INTEGER;
  v_reserved INTEGER;
  v_available INTEGER;
BEGIN
  SELECT
    ap.*,
    ap.version AS current_version,
    ap.total_editions,
    COALESCE((
      SELECT SUM(oi.quantity)
      FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.product_id = p_product_id
        AND oi.product_type = 'artist'
        AND o.payment_status IN ('pending', 'paid', 'completed')
    ), 0) AS reserved_count
  INTO v_artist_product
  FROM public.artist_products ap
  WHERE ap.product_id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, 'Œuvre non trouvée'::TEXT;
    RETURN;
  END IF;

  IF v_artist_product.artwork_edition_type IS DISTINCT FROM 'limited_edition'
     OR v_artist_product.total_editions IS NULL THEN
    RETURN QUERY SELECT
      true,
      COALESCE(v_artist_product.current_version, 1),
      NULL::INTEGER,
      'Non limitée'::TEXT;
    RETURN;
  END IF;

  v_current_version := COALESCE(v_artist_product.current_version, 1);
  v_total_editions := v_artist_product.total_editions;
  v_reserved := v_artist_product.reserved_count;
  v_available := COALESCE(v_total_editions, 0) - v_reserved;

  IF v_available < p_quantity THEN
    RETURN QUERY SELECT
      false,
      v_current_version,
      GREATEST(v_available, 0),
      format('Seulement %s exemplaire(s) disponible(s) sur %s', GREATEST(v_available, 0), v_total_editions)::TEXT;
    RETURN;
  END IF;

  -- Réservation OK : pas d'incrément de version ici (commit au paiement)
  RETURN QUERY SELECT
    true,
    v_current_version,
    v_available - p_quantity,
    'Réservé'::TEXT;
END;
$$;

COMMENT ON FUNCTION public.check_and_increment_artist_product_version IS
'Réserve une édition limitée (pending+paid+completed comptés). Version incrémentée au paiement via trigger fulfill_artist_limited_edition_on_order_paid.';

CREATE OR REPLACE FUNCTION public.fulfill_artist_limited_edition_on_order_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
BEGIN
  IF COALESCE(OLD.payment_status, '') IN ('paid', 'completed') THEN
    RETURN NEW;
  END IF;

  IF NEW.payment_status NOT IN ('paid', 'completed') THEN
    RETURN NEW;
  END IF;

  FOR v_item IN
    SELECT oi.product_id, oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_type = 'artist'
  LOOP
    UPDATE public.artist_products ap
    SET
      version = COALESCE(ap.version, 1) + 1,
      updated_at = now()
    WHERE ap.product_id = v_item.product_id
      AND ap.artwork_edition_type = 'limited_edition'
      AND ap.total_editions IS NOT NULL;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fulfill_artist_limited_edition_on_order_paid ON public.orders;
CREATE TRIGGER trg_fulfill_artist_limited_edition_on_order_paid
  AFTER UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.fulfill_artist_limited_edition_on_order_paid();
