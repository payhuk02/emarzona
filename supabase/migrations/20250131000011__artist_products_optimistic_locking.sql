-- ============================================================
-- Migration : Optimistic Locking pour artist_products
-- Date : 31 Janvier 2025
-- Description : Ajoute un système de versioning pour prévenir les doubles ventes d'éditions limitées
-- ============================================================

-- Ajouter une colonne version pour optimistic locking
ALTER TABLE public.artist_products
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Créer un index sur version pour performance
CREATE INDEX IF NOT EXISTS idx_artist_products_version ON public.artist_products(version);

-- Fonction pour vérifier et incrémenter la version (optimistic locking)
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
  v_total_sold INTEGER;
  v_available INTEGER;
BEGIN
  -- Récupérer l'œuvre d'artiste avec verrouillage (SELECT FOR UPDATE)
  SELECT 
    ap.*,
    ap.version as current_version,
    ap.total_editions,
    COALESCE((
      SELECT SUM(oi.quantity)
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = p_product_id
        AND oi.product_type = 'artist'
        AND o.payment_status = 'completed'
    ), 0) as sold_count
  INTO v_artist_product
  FROM artist_products ap
  WHERE ap.product_id = p_product_id
  FOR UPDATE; -- Verrouillage pessimiste pour cette transaction

  -- Vérifier si l'œuvre existe
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, 'Œuvre non trouvée'::TEXT;
    RETURN;
  END IF;

  v_current_version := v_artist_product.current_version;
  v_total_editions := v_artist_product.total_editions;
  v_total_sold := v_artist_product.sold_count;
  v_available := COALESCE(v_total_editions, 0) - v_total_sold;

  -- Vérifier optimistic locking (version)
  IF v_current_version != p_expected_version THEN
    RETURN QUERY SELECT 
      false, 
      v_current_version, 
      v_available,
      format('Version conflict: expected %s, got %s', p_expected_version, v_current_version)::TEXT;
    RETURN;
  END IF;

  -- Vérifier disponibilité
  IF v_available < p_quantity THEN
    RETURN QUERY SELECT 
      false, 
      v_current_version, 
      v_available,
      format('Seulement %s exemplaire(s) disponible(s) sur %s', v_available, v_total_editions)::TEXT;
    RETURN;
  END IF;

  -- Si tout est OK, incrémenter la version
  UPDATE artist_products
  SET version = version + 1,
      updated_at = now()
  WHERE product_id = p_product_id
    AND version = p_expected_version;

  -- Vérifier si la mise à jour a réussi (optimistic lock réussi)
  IF FOUND THEN
    RETURN QUERY SELECT 
      true, 
      v_current_version + 1, 
      v_available - p_quantity,
      'Succès'::TEXT;
  ELSE
    -- La version a changé entre temps (conflit)
    RETURN QUERY SELECT 
      false, 
      v_current_version, 
      v_available,
      'Conflit de version détecté'::TEXT;
  END IF;
END;
$$;

-- Commentaires
COMMENT ON FUNCTION public.check_and_increment_artist_product_version IS 
'Vérifie la version (optimistic locking) et la disponibilité avant d''incrémenter la version. Utilise SELECT FOR UPDATE pour verrouillage pessimiste pendant la transaction.';

COMMENT ON COLUMN public.artist_products.version IS 
'Numéro de version pour optimistic locking. Incrémenté à chaque modification pour détecter les conflits de concurrence.';

