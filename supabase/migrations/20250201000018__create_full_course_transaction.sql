-- =====================================================
-- Migration : Fonction SQL avec transaction pour création de cours
-- Date: 1er Février 2025
-- Description: Crée une fonction SQL avec transaction pour garantir l'intégrité des données
-- =====================================================

-- Fonction pour créer un cours complet avec transaction SQL
CREATE OR REPLACE FUNCTION create_full_course(
  -- Données du produit (obligatoires)
  p_store_id UUID,
  p_name TEXT,
  p_slug TEXT,
  p_short_description TEXT,
  p_description TEXT,
  p_category TEXT,
  p_price NUMERIC,
  p_level TEXT,
  p_sections JSONB,
  
  -- Données du produit (optionnelles)
  p_image_url TEXT DEFAULT NULL,
  p_images JSONB DEFAULT '[]'::jsonb,
  p_currency TEXT DEFAULT 'XOF',
  p_promotional_price NUMERIC DEFAULT NULL,
  p_pricing_model TEXT DEFAULT 'one-time',
  p_licensing_type TEXT DEFAULT 'standard',
  p_license_terms TEXT DEFAULT NULL,
  p_meta_title TEXT DEFAULT NULL,
  p_meta_description TEXT DEFAULT NULL,
  p_meta_keywords TEXT DEFAULT NULL,
  p_og_image TEXT DEFAULT NULL,
  p_faqs JSONB DEFAULT '[]'::jsonb,
  
  -- Données du cours (optionnelles)
  p_language TEXT DEFAULT 'fr',
  p_certificate_enabled BOOLEAN DEFAULT true,
  p_certificate_passing_score INTEGER DEFAULT 80,
  p_learning_objectives TEXT[] DEFAULT '{}',
  p_prerequisites TEXT[] DEFAULT '{}',
  p_target_audience TEXT[] DEFAULT '{}',
  
  -- Affiliation (optionnelles)
  p_affiliate_enabled BOOLEAN DEFAULT false,
  p_commission_rate NUMERIC DEFAULT NULL,
  p_commission_type TEXT DEFAULT NULL,
  p_fixed_commission_amount NUMERIC DEFAULT NULL,
  p_cookie_duration_days INTEGER DEFAULT NULL,
  p_max_commission_per_sale NUMERIC DEFAULT NULL,
  p_min_order_amount NUMERIC DEFAULT NULL,
  p_allow_self_referral BOOLEAN DEFAULT NULL,
  p_require_approval BOOLEAN DEFAULT NULL,
  p_affiliate_terms_and_conditions TEXT DEFAULT NULL,
  
  -- Analytics (optionnelles)
  p_tracking_enabled BOOLEAN DEFAULT true,
  p_google_analytics_id TEXT DEFAULT NULL,
  p_facebook_pixel_id TEXT DEFAULT NULL,
  p_google_tag_manager_id TEXT DEFAULT NULL,
  p_tiktok_pixel_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
  v_course_id UUID;
  v_section JSONB;
  v_lesson JSONB;
  v_created_section_id UUID;
  v_total_lessons INTEGER := 0;
  v_total_duration INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Démarrer la transaction
  BEGIN
    -- Vérifier si meta_keywords existe, sinon l'ajouter
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'products' 
      AND column_name = 'meta_keywords'
    ) THEN
      ALTER TABLE public.products ADD COLUMN meta_keywords TEXT;
    END IF;
    
    -- 1. Créer le produit
    INSERT INTO products (
      store_id,
      name,
      slug,
      short_description,
      description,
      category,
      product_type,
      price,
      currency,
      promotional_price,
      pricing_model,
      image_url,
      images,
      licensing_type,
      license_terms,
      is_active,
      is_draft,
      meta_title,
      meta_description,
      meta_keywords,
      og_image,
      faqs
    ) VALUES (
      p_store_id,
      p_name,
      p_slug,
      p_short_description,
      p_description,
      p_category,
      'course',
      CASE WHEN p_pricing_model = 'free' THEN 0 ELSE p_price END,
      p_currency,
      p_promotional_price,
      CASE 
        WHEN p_pricing_model IS NULL THEN 'one-time'::pricing_model
        ELSE p_pricing_model::pricing_model
      END,
      p_image_url,
      p_images,
      p_licensing_type,
      p_license_terms,
      true,
      false,
      p_meta_title,
      p_meta_description,
      p_meta_keywords,
      p_og_image,
      p_faqs
    )
    RETURNING id INTO v_product_id;
    
    -- 2. Calculer les statistiques (total_lessons, total_duration)
    IF p_sections IS NOT NULL THEN
      FOR v_section IN SELECT * FROM jsonb_array_elements(p_sections)
      LOOP
        IF v_section->'lessons' IS NOT NULL THEN
          FOR v_lesson IN SELECT * FROM jsonb_array_elements(v_section->'lessons')
          LOOP
            v_total_lessons := v_total_lessons + 1;
            v_total_duration := v_total_duration + COALESCE((v_lesson->>'video_duration_seconds')::INTEGER, 0);
          END LOOP;
        END IF;
      END LOOP;
    END IF;
    
    -- 3. Créer le cours
    INSERT INTO courses (
      product_id,
      level,
      language,
      total_duration_minutes,
      total_lessons,
      learning_objectives,
      prerequisites,
      target_audience,
      certificate_enabled,
      certificate_passing_score
    ) VALUES (
      v_product_id,
      p_level,
      p_language,
      ROUND(v_total_duration / 60.0),
      v_total_lessons,
      p_learning_objectives,
      p_prerequisites,
      p_target_audience,
      p_certificate_enabled,
      p_certificate_passing_score
    )
    RETURNING id INTO v_course_id;
    
    -- 4. Créer les sections et leçons
    IF p_sections IS NOT NULL THEN
      FOR v_section IN SELECT * FROM jsonb_array_elements(p_sections)
      LOOP
        -- Créer la section
        INSERT INTO course_sections (
          course_id,
          title,
          description,
          order_index
        ) VALUES (
          v_course_id,
          v_section->>'title',
          NULLIF(v_section->>'description', ''),
          (v_section->>'order_index')::INTEGER
        )
        RETURNING id INTO v_created_section_id;
        
        -- Créer les leçons de cette section
        IF v_section->'lessons' IS NOT NULL THEN
          FOR v_lesson IN SELECT * FROM jsonb_array_elements(v_section->'lessons')
          LOOP
            INSERT INTO course_lessons (
              section_id,
              course_id,
              title,
              description,
              order_index,
              video_type,
              video_url,
              video_duration_seconds,
              is_preview,
              is_required
            ) VALUES (
              v_created_section_id,
              v_course_id,
              v_lesson->>'title',
              NULLIF(v_lesson->>'description', ''),
              (v_lesson->>'order_index')::INTEGER,
              COALESCE(v_lesson->>'video_type', 'upload'),
              COALESCE(v_lesson->>'video_url', ''),
              COALESCE((v_lesson->>'video_duration_seconds')::INTEGER, 0),
              COALESCE((v_lesson->>'is_preview')::BOOLEAN, false),
              true
            );
          END LOOP;
        END IF;
      END LOOP;
    END IF;
    
    -- 5. Créer les settings d'affiliation (si activé)
    IF p_affiliate_enabled THEN
      INSERT INTO product_affiliate_settings (
        product_id,
        store_id,
        affiliate_enabled,
        commission_rate,
        commission_type,
        fixed_commission_amount,
        cookie_duration_days,
        max_commission_per_sale,
        min_order_amount,
        allow_self_referral,
        require_approval,
        terms_and_conditions
      ) VALUES (
        v_product_id,
        p_store_id,
        true,
        p_commission_rate,
        p_commission_type,
        p_fixed_commission_amount,
        p_cookie_duration_days,
        p_max_commission_per_sale,
        p_min_order_amount,
        p_allow_self_referral,
        p_require_approval,
        p_affiliate_terms_and_conditions
      )
      ON CONFLICT (product_id) DO UPDATE SET
        affiliate_enabled = true,
        commission_rate = EXCLUDED.commission_rate,
        commission_type = EXCLUDED.commission_type,
        fixed_commission_amount = EXCLUDED.fixed_commission_amount,
        cookie_duration_days = EXCLUDED.cookie_duration_days,
        max_commission_per_sale = EXCLUDED.max_commission_per_sale,
        min_order_amount = EXCLUDED.min_order_amount,
        allow_self_referral = EXCLUDED.allow_self_referral,
        require_approval = EXCLUDED.require_approval,
        terms_and_conditions = EXCLUDED.terms_and_conditions;
    END IF;
    
    -- 6. Configurer le tracking et les pixels (si la table existe)
    IF EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'product_analytics'
    ) THEN
      -- Vérifier si un enregistrement existe déjà pour ce produit
      IF EXISTS (SELECT 1 FROM product_analytics WHERE product_id = v_product_id) THEN
        -- Mettre à jour l'enregistrement existant
        UPDATE product_analytics SET
          tracking_enabled = p_tracking_enabled,
          google_analytics_id = p_google_analytics_id,
          facebook_pixel_id = p_facebook_pixel_id,
          google_tag_manager_id = p_google_tag_manager_id,
          tiktok_pixel_id = p_tiktok_pixel_id,
          updated_at = now()
        WHERE product_id = v_product_id;
      ELSE
        -- Créer un nouvel enregistrement
        INSERT INTO product_analytics (
          product_id,
          store_id,
          tracking_enabled,
          google_analytics_id,
          facebook_pixel_id,
          google_tag_manager_id,
          tiktok_pixel_id
        ) VALUES (
          v_product_id,
          p_store_id,
          p_tracking_enabled,
          p_google_analytics_id,
          p_facebook_pixel_id,
          p_google_tag_manager_id,
          p_tiktok_pixel_id
        );
      END IF;
    END IF;
    
    -- Construire le résultat
    v_result := jsonb_build_object(
      'success', true,
      'product_id', v_product_id,
      'course_id', v_course_id,
      'sections_count', jsonb_array_length(COALESCE(p_sections, '[]'::jsonb)),
      'lessons_count', v_total_lessons
    );
    
    RETURN v_result;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- En cas d'erreur, la transaction est automatiquement rollback
      -- Retourner l'erreur
      RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE
      );
  END;
END;
$$;

-- Commentaire
COMMENT ON FUNCTION create_full_course IS 'Crée un cours complet avec toutes ses dépendances dans une transaction SQL atomique';

