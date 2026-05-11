-- Migration pour ajouter le système de cours gratuits preview
-- Permet de créer un cours gratuit qui présente un aperçu du contenu payant
-- Date: 2025-01-26

-- Les colonnes free_product_id, paid_product_id, is_free_preview, preview_content_description
-- sont déjà dans la table products (migration 20250126_free_preview_products.sql)

-- Fonction pour créer automatiquement un cours preview gratuit
CREATE OR REPLACE FUNCTION public.create_free_preview_course(
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
  v_paid_course RECORD;
  v_preview_product_id UUID;
  v_preview_course_id UUID;
  v_section RECORD;
  v_lesson RECORD;
  v_new_section_id UUID;
  v_new_lesson_id UUID;
BEGIN
  -- Récupérer les données du produit payant
  SELECT * INTO v_paid_product
  FROM products
  WHERE id = p_paid_product_id AND product_type = 'course';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit cours payant non trouvé';
  END IF;

  -- Récupérer le cours payant
  SELECT * INTO v_paid_course
  FROM courses
  WHERE product_id = p_paid_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cours payant non trouvé';
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
      'Version preview gratuite de "' || name || '". Contient un aperçu du contenu complet disponible dans la version payante.'
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

  -- Créer le cours preview (copie du cours payant avec seules les leçons preview)
  INSERT INTO courses (
    product_id,
    level,
    language,
    subtitles,
    total_duration_minutes,
    total_lessons,
    total_quizzes,
    total_resources,
    learning_objectives,
    prerequisites,
    target_audience,
    certificate_enabled,
    certificate_template_url,
    certificate_passing_score,
    drip_enabled,
    drip_type,
    drip_interval,
    enable_qa,
    enable_discussions,
    enable_notes,
    enable_downloads,
    auto_play_next
  )
  SELECT 
    v_preview_product_id,
    level,
    language,
    subtitles,
    -- Calculer durée et nombre de leçons preview (sera mis à jour après insertion)
    0,
    0,
    0,
    0,
    learning_objectives,
    prerequisites,
    target_audience,
    false, -- Certificat désactivé pour preview
    certificate_template_url,
    certificate_passing_score,
    drip_enabled,
    drip_type,
    drip_interval,
    enable_qa,
    enable_discussions,
    enable_notes,
    enable_downloads,
    auto_play_next
  FROM courses
  WHERE id = v_paid_course.id
  RETURNING id INTO v_preview_course_id;

  -- Copier les sections avec seulement les leçons preview
  FOR v_section IN 
    SELECT * FROM course_sections 
    WHERE course_id = v_paid_course.id 
    ORDER BY order_index
  LOOP
    -- Insérer la section
    INSERT INTO course_sections (
      course_id,
      title,
      description,
      order_index
    ) VALUES (
      v_preview_course_id,
      v_section.title,
      v_section.description,
      v_section.order_index
    ) RETURNING id INTO v_new_section_id;

    -- Copier uniquement les leçons marquées comme preview
    FOR v_lesson IN 
      SELECT * FROM course_lessons 
      WHERE section_id = v_section.id AND is_preview = true
      ORDER BY order_index
    LOOP
      INSERT INTO course_lessons (
        section_id,
        title,
        description,
        video_url,
        video_duration_seconds,
        content,
        order_index,
        is_preview,
        is_free
      ) VALUES (
        v_new_section_id,
        v_lesson.title,
        v_lesson.description,
        v_lesson.video_url,
        v_lesson.video_duration_seconds,
        v_lesson.content,
        v_lesson.order_index,
        true,
        true
      ) RETURNING id INTO v_new_lesson_id;

      -- Mettre à jour les compteurs du cours
      UPDATE courses
      SET 
        total_lessons = total_lessons + 1,
        total_duration_minutes = total_duration_minutes + COALESCE(v_lesson.video_duration_seconds, 0) / 60
      WHERE id = v_preview_course_id;
    END LOOP;

    -- Mettre à jour total_sections du cours si nécessaire
    -- (les sections seront comptées automatiquement)
  END LOOP;

  -- Mettre à jour les stats finales du cours preview
  UPDATE courses
  SET 
    total_resources = (
      SELECT COUNT(*) 
      FROM course_lessons 
      WHERE section_id IN (
        SELECT id FROM course_sections WHERE course_id = v_preview_course_id
      ) AND resources IS NOT NULL AND jsonb_array_length(resources) > 0
    )
  WHERE id = v_preview_course_id;

  RETURN v_preview_course_id;
END;
$$;

COMMENT ON FUNCTION public.create_free_preview_course IS 'Crée automatiquement un cours gratuit preview à partir d''un cours payant. Copie uniquement les leçons marquées comme is_preview=true.';

