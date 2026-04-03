/**
 * Server-Side Validation Functions for Wizards
 * Date: 28 Janvier 2025
 * 
 * Fonctions RPC pour valider les données des wizards côté serveur
 * Vérifications d'unicité, contraintes métier, etc.
 */

-- =====================================================
-- VALIDATION SLUG (unicité)
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

  -- Vérifier unicité dans products
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
  -- Les vérifications supplémentaires ci-dessous ne sont plus nécessaires car le slug est unique dans products

  RETURN jsonb_build_object('valid', true);
END;
$$;

-- =====================================================
-- VALIDATION SKU (unicité pour produits physiques)
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_sku(
  p_sku TEXT,
  p_store_id UUID,
  p_product_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Vérifier format SKU
  IF p_sku !~ '^[A-Z0-9-_]+$' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'format',
      'message', 'Le SKU doit contenir uniquement des majuscules, chiffres, tirets et underscores'
    );
  END IF;

  -- Vérifier longueur
  IF length(p_sku) < 3 OR length(p_sku) > 50 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'length',
      'message', 'Le SKU doit contenir entre 3 et 50 caractères'
    );
  END IF;

  -- Vérifier unicité
  SELECT EXISTS(
    SELECT 1 FROM public.physical_products
    WHERE sku = p_sku
      AND store_id = p_store_id
      AND (p_product_id IS NULL OR id != p_product_id)
  ) INTO v_exists;

  IF v_exists THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'unique',
      'message', 'Ce SKU est déjà utilisé pour un autre produit'
    );
  END IF;

  RETURN jsonb_build_object('valid', true);
END;
$$;

-- =====================================================
-- VALIDATION VERSION (unicité pour produits digitaux)
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_digital_version(
  p_version TEXT,
  p_digital_product_id UUID,
  p_store_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Vérifier format version
  IF p_version !~ '^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9]+)?$' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'format',
      'message', 'Format de version invalide (ex: 1.0.0 ou 1.0.0-beta)'
    );
  END IF;

  -- Vérifier si la version existe déjà pour ce produit
  SELECT EXISTS(
    SELECT 1 FROM public.digital_product_versions
    WHERE version = p_version
      AND digital_product_id = p_digital_product_id
  ) INTO v_exists;

  IF v_exists THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'unique',
      'message', 'Cette version existe déjà pour ce produit'
    );
  END IF;

  RETURN jsonb_build_object('valid', true);
END;
$$;

-- =====================================================
-- VALIDATION COMPLÈTE PRODUIT DIGITAL
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_digital_product(
  p_name TEXT,
  p_slug TEXT,
  p_price NUMERIC,
  p_store_id UUID,
  p_product_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_errors JSONB := '[]'::JSONB;
  v_slug_result JSONB;
BEGIN
  -- Validation nom
  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    v_errors := v_errors || jsonb_build_object('field', 'name', 'message', 'Le nom doit contenir au moins 2 caractères');
  END IF;

  IF length(trim(p_name)) > 100 THEN
    v_errors := v_errors || jsonb_build_object('field', 'name', 'message', 'Le nom ne peut pas dépasser 100 caractères');
  END IF;

  -- Validation prix
  IF p_price IS NULL OR p_price <= 0 THEN
    v_errors := v_errors || jsonb_build_object('field', 'price', 'message', 'Le prix doit être supérieur à 0');
  END IF;

  IF p_price > 1000000 THEN
    v_errors := v_errors || jsonb_build_object('field', 'price', 'message', 'Le prix ne peut pas dépasser 1,000,000');
  END IF;

  -- Validation slug
  IF p_slug IS NOT NULL THEN
    v_slug_result := validate_product_slug(p_slug, p_store_id, p_product_id);
    IF NOT (v_slug_result->>'valid')::BOOLEAN THEN
      v_errors := v_errors || jsonb_build_object('field', 'slug', 'message', v_slug_result->>'message');
    END IF;
  END IF;

  IF jsonb_array_length(v_errors) > 0 THEN
    RETURN jsonb_build_object('valid', false, 'errors', v_errors);
  END IF;

  RETURN jsonb_build_object('valid', true);
END;
$$;

-- =====================================================
-- VALIDATION COMPLÈTE PRODUIT PHYSIQUE
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_physical_product(
  p_name TEXT,
  p_slug TEXT,
  p_price NUMERIC,
  p_sku TEXT,
  p_weight NUMERIC,
  p_quantity INTEGER,
  p_store_id UUID,
  p_product_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_errors JSONB := '[]'::JSONB;
  v_slug_result JSONB;
  v_sku_result JSONB;
BEGIN
  -- Validation nom
  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    v_errors := v_errors || jsonb_build_object('field', 'name', 'message', 'Le nom doit contenir au moins 2 caractères');
  END IF;

  -- Validation prix
  IF p_price IS NULL OR p_price <= 0 THEN
    v_errors := v_errors || jsonb_build_object('field', 'price', 'message', 'Le prix doit être supérieur à 0');
  END IF;

  -- Validation slug
  IF p_slug IS NOT NULL THEN
    v_slug_result := validate_product_slug(p_slug, p_store_id, p_product_id);
    IF NOT (v_slug_result->>'valid')::BOOLEAN THEN
      v_errors := v_errors || jsonb_build_object('field', 'slug', 'message', v_slug_result->>'message');
    END IF;
  END IF;

  -- Validation SKU si fourni
  IF p_sku IS NOT NULL AND length(trim(p_sku)) > 0 THEN
    v_sku_result := validate_sku(p_sku, p_store_id, p_product_id);
    IF NOT (v_sku_result->>'valid')::BOOLEAN THEN
      v_errors := v_errors || jsonb_build_object('field', 'sku', 'message', v_sku_result->>'message');
    END IF;
  END IF;

  -- Validation poids si fourni
  IF p_weight IS NOT NULL AND p_weight <= 0 THEN
    v_errors := v_errors || jsonb_build_object('field', 'weight', 'message', 'Le poids doit être supérieur à 0');
  END IF;

  -- Validation quantité si fournie
  IF p_quantity IS NOT NULL AND p_quantity < 0 THEN
    v_errors := v_errors || jsonb_build_object('field', 'quantity', 'message', 'La quantité ne peut pas être négative');
  END IF;

  IF jsonb_array_length(v_errors) > 0 THEN
    RETURN jsonb_build_object('valid', false, 'errors', v_errors);
  END IF;

  RETURN jsonb_build_object('valid', true);
END;
$$;

-- =====================================================
-- VALIDATION COMPLÈTE SERVICE
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_service(
  p_name TEXT,
  p_slug TEXT,
  p_price NUMERIC,
  p_duration INTEGER,
  p_max_participants INTEGER,
  p_meeting_url TEXT,
  p_store_id UUID,
  p_product_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_errors JSONB := '[]'::JSONB;
  v_slug_result JSONB;
BEGIN
  -- Validation nom
  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    v_errors := v_errors || jsonb_build_object('field', 'name', 'message', 'Le nom doit contenir au moins 2 caractères');
  END IF;

  -- Validation prix
  IF p_price IS NULL OR p_price <= 0 THEN
    v_errors := v_errors || jsonb_build_object('field', 'price', 'message', 'Le prix doit être supérieur à 0');
  END IF;

  -- Validation slug
  IF p_slug IS NOT NULL THEN
    v_slug_result := validate_product_slug(p_slug, p_store_id, p_product_id);
    IF NOT (v_slug_result->>'valid')::BOOLEAN THEN
      v_errors := v_errors || jsonb_build_object('field', 'slug', 'message', v_slug_result->>'message');
    END IF;
  END IF;

  -- Validation durée
  IF p_duration IS NULL OR p_duration <= 0 THEN
    v_errors := v_errors || jsonb_build_object('field', 'duration', 'message', 'La durée doit être supérieure à 0');
  END IF;

  -- Validation participants max
  IF p_max_participants IS NOT NULL AND p_max_participants < 1 THEN
    v_errors := v_errors || jsonb_build_object('field', 'max_participants', 'message', 'Le nombre maximum de participants doit être au moins 1');
  END IF;

  -- Validation URL meeting si fournie
  IF p_meeting_url IS NOT NULL AND length(trim(p_meeting_url)) > 0 THEN
    IF p_meeting_url !~ '^https?://' THEN
      v_errors := v_errors || jsonb_build_object('field', 'meeting_url', 'message', 'L''URL de réunion doit commencer par http:// ou https://');
    END IF;
  END IF;

  IF jsonb_array_length(v_errors) > 0 THEN
    RETURN jsonb_build_object('valid', false, 'errors', v_errors);
  END IF;

  RETURN jsonb_build_object('valid', true);
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.validate_product_slug TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_sku TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_digital_version TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_digital_product TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_physical_product TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_service TO authenticated;

