/**
 * Fix validate_product_slug function
 * Date: 1 Février 2025
 * 
 * Correction: Les tables digital_products, physical_products, et services
 * n'ont pas de colonne slug. Le slug est uniquement dans la table products.
 * Suppression des vérifications inutiles sur ces tables.
 */

-- =====================================================
-- CORRECTION validate_product_slug
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_product_slug(
  p_slug TEXT,
  p_store_id UUID,
  p_product_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
  v_message TEXT;
BEGIN
  -- Vérifier format slug
  IF p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'format',
      'message', 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets'
    );
  END IF;

  -- Vérifier longueur
  IF length(p_slug) < 3 OR length(p_slug) > 50 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'length',
      'message', 'Le slug doit contenir entre 3 et 50 caractères'
    );
  END IF;

  -- Vérifier unicité dans products (seule table qui contient le slug)
  SELECT EXISTS(
    SELECT 1 FROM public.products
    WHERE slug = p_slug
      AND store_id = p_store_id
      AND (p_product_id IS NULL OR id != p_product_id)
  ) INTO v_exists;

  IF v_exists THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'unique',
      'message', 'Ce slug est déjà utilisé pour un autre produit'
    );
  END IF;

  -- Note: Les tables digital_products, physical_products, et services n'ont pas de colonne slug
  -- Le slug est uniquement dans la table products, donc la vérification ci-dessus est suffisante

  RETURN jsonb_build_object('valid', true);
END;
$$;

