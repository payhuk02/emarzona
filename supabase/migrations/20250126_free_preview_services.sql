-- Migration pour ajouter le système de services gratuits preview
-- Permet de créer un service gratuit qui présente un aperçu du service payant
-- Date: 2025-01-26

-- Les colonnes free_product_id, paid_product_id, is_free_preview, preview_content_description
-- sont déjà dans la table products (migration 20250126_free_preview_products.sql)

-- Fonction pour créer automatiquement un service preview gratuit
CREATE OR REPLACE FUNCTION public.create_free_preview_service(
  p_paid_product_id UUID,
  p_preview_content_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paid_product RECORD;
  v_paid_service RECORD;
  v_preview_product_id UUID;
  v_preview_service_id UUID;
BEGIN
  -- Récupérer les données du produit payant
  SELECT * INTO v_paid_product
  FROM products
  WHERE id = p_paid_product_id AND product_type = 'service';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit service payant non trouvé';
  END IF;

  -- Récupérer le service payant
  SELECT * INTO v_paid_service
  FROM service_products
  WHERE product_id = p_paid_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service payant non trouvé';
  END IF;

  -- Créer le produit preview gratuit
  INSERT INTO products (
    store_id,
    name,
    slug,
    description,
    short_description,
    price,
    pricing_model,
    currency,
    product_type,
    category,
    image_url,
    images,
    is_active,
    is_draft,
    is_free_preview,
    paid_product_id,
    preview_content_description,
    licensing_type,
    license_terms
  )
  SELECT 
    store_id,
    name || ' - Version Preview Gratuite',
    slug || '-preview-free',
    COALESCE(
      p_preview_content_description,
      'Version preview gratuite de "' || name || '". Contient un aperçu du service complet disponible dans la version payante.'
    ),
    short_description || ' (Version Preview)',
    0,
    'free',
    currency,
    product_type,
    category,
    image_url,
    images,
    is_active,
    false, -- Preview n'est pas un draft
    true,
    p_paid_product_id,
    p_preview_content_description,
    licensing_type,
    license_terms
  FROM products
  WHERE id = p_paid_product_id
  RETURNING id INTO v_preview_product_id;

  -- Lier le produit payant au preview
  UPDATE products
  SET free_product_id = v_preview_product_id
  WHERE id = p_paid_product_id;

  -- Créer le service preview (copie du service payant avec durée limitée ou consultation gratuite)
  INSERT INTO service_products (
    product_id,
    service_type,
    duration_minutes,
    location_type,
    location_address,
    meeting_url,
    timezone,
    requires_staff,
    max_participants,
    pricing_type,
    deposit_required,
    deposit_amount,
    deposit_type,
    allow_booking_cancellation,
    cancellation_deadline_hours,
    require_approval,
    buffer_time_before,
    buffer_time_after,
    max_bookings_per_day,
    advance_booking_days
  )
  SELECT 
    v_preview_product_id,
    service_type,
    -- Durée réduite pour preview (ex: 15 minutes au lieu de 60)
    CASE 
      WHEN duration_minutes > 60 THEN 15
      WHEN duration_minutes > 30 THEN 10
      ELSE 5
    END,
    location_type,
    location_address,
    meeting_url,
    timezone,
    requires_staff,
    max_participants,
    'fixed', -- Prix fixe gratuit
    false, -- Pas d'acompte pour preview
    NULL,
    NULL,
    allow_booking_cancellation,
    cancellation_deadline_hours,
    require_approval,
    buffer_time_before,
    buffer_time_after,
    max_bookings_per_day,
    advance_booking_days
  FROM service_products
  WHERE id = v_paid_service.id
  RETURNING id INTO v_preview_service_id;

  -- Copier les disponibilités (slots) si elles existent
  INSERT INTO service_availability_slots (
    service_product_id,
    day_of_week,
    start_time,
    end_time,
    staff_member_id,
    is_active
  )
  SELECT 
    v_preview_service_id,
    day_of_week,
    start_time,
    end_time,
    staff_member_id,
    is_active
  FROM service_availability_slots
  WHERE service_product_id = v_paid_service.id;

  RETURN v_preview_service_id;
END;
$$;

COMMENT ON FUNCTION public.create_free_preview_service IS 'Crée automatiquement un service gratuit preview à partir d''un service payant. La durée est réduite (15min au lieu de 60min par exemple) pour offrir un aperçu gratuit.';

