-- =====================================================
-- EMARZONA COURSE CERTIFICATE TEMPLATES SYSTEM
-- Date: 3 Février 2025
-- Description: Système de templates personnalisables pour certificats de cours
-- =====================================================

-- =====================================================
-- 1. TABLE: course_certificate_templates
-- =====================================================
CREATE TABLE IF NOT EXISTS public.course_certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  course_id UUID,
  
  -- Nom et description
  template_name TEXT NOT NULL,
  template_description TEXT,
  
  -- Design
  template_type TEXT NOT NULL CHECK (template_type IN (
    'classic',      -- Classique
    'modern',       -- Moderne
    'elegant',      -- Élégant
    'minimalist',   -- Minimaliste
    'professional', -- Professionnel
    'custom'        -- Personnalisé
  )) DEFAULT 'classic',
  
  -- Configuration du design (JSONB)
  design_config JSONB NOT NULL DEFAULT '{
    "background_color": "#FFFFFF",
    "border_color": "#F97316",
    "border_width": 8,
    "border_style": "double",
    "text_color": "#1F2937",
    "accent_color": "#F97316",
    "logo_url": null,
    "watermark": "Emarzona Academy",
    "font_family": "Arial",
    "title_font_size": 48,
    "name_font_size": 36,
    "body_font_size": 18
  }'::jsonb,
  
  -- Champs affichés
  show_student_name BOOLEAN DEFAULT true,
  show_course_name BOOLEAN DEFAULT true,
  show_completion_date BOOLEAN DEFAULT true,
  show_certificate_number BOOLEAN DEFAULT true,
  show_instructor_name BOOLEAN DEFAULT true,
  show_final_score BOOLEAN DEFAULT false,
  show_duration BOOLEAN DEFAULT false,
  show_verification_code BOOLEAN DEFAULT true,
  
  -- Texte personnalisé
  header_text TEXT DEFAULT 'CERTIFICAT',
  subheader_text TEXT DEFAULT 'de Réussite',
  body_text TEXT DEFAULT 'Ceci certifie que {student_name} a terminé avec succès le cours {course_name}',
  footer_text TEXT,
  
  -- Signature
  show_signature BOOLEAN DEFAULT true,
  signature_name TEXT,
  signature_title TEXT,
  signature_image_url TEXT,
  
  -- Statut
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_course_certificate_templates_store_id ON public.course_certificate_templates(store_id);
CREATE INDEX IF NOT EXISTS idx_course_certificate_templates_course_id ON public.course_certificate_templates(course_id);
CREATE INDEX IF NOT EXISTS idx_course_certificate_templates_active ON public.course_certificate_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_course_certificate_templates_default ON public.course_certificate_templates(is_default);

-- Ajouter les foreign keys si les tables existent
DO $$ 
BEGIN
  -- Foreign key vers stores
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'course_certificate_templates'
      AND constraint_name = 'fk_course_certificate_templates_store_id'
    ) THEN
      ALTER TABLE public.course_certificate_templates
      ADD CONSTRAINT fk_course_certificate_templates_store_id 
        FOREIGN KEY (store_id) 
        REFERENCES public.stores(id) 
        ON DELETE CASCADE;
    END IF;
  END IF;
  
  -- Foreign key vers courses
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'course_certificate_templates'
      AND constraint_name = 'fk_course_certificate_templates_course_id'
    ) THEN
      ALTER TABLE public.course_certificate_templates
      ADD CONSTRAINT fk_course_certificate_templates_course_id 
        FOREIGN KEY (course_id) 
        REFERENCES public.courses(id) 
        ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- =====================================================
-- 2. MISE À JOUR TABLE course_certificates
-- =====================================================

-- Ajouter colonnes si elles n'existent pas
DO $$ 
BEGIN
  -- Vérifier d'abord si la table course_certificates existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_certificates') THEN
    -- Template utilisé
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'course_certificates' 
      AND column_name = 'template_id'
    ) THEN
      ALTER TABLE public.course_certificates
      ADD COLUMN template_id UUID;
    
      -- Ajouter la foreign key si la table existe
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_certificate_templates') THEN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_schema = 'public' 
          AND table_name = 'course_certificates'
          AND constraint_name = 'fk_course_certificates_template_id'
        ) THEN
          ALTER TABLE public.course_certificates
          ADD CONSTRAINT fk_course_certificates_template_id 
            FOREIGN KEY (template_id) 
            REFERENCES public.course_certificate_templates(id) 
            ON DELETE SET NULL;
        END IF;
      END IF;
    END IF;
    
    -- Code de vérification
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'course_certificates' 
      AND column_name = 'verification_code'
    ) THEN
      ALTER TABLE public.course_certificates
      ADD COLUMN verification_code TEXT UNIQUE;
    END IF;
    
    -- URL de vérification publique
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'course_certificates' 
      AND column_name = 'verification_url'
    ) THEN
      ALTER TABLE public.course_certificates
      ADD COLUMN verification_url TEXT;
    END IF;
    
    -- Métadonnées
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'course_certificates' 
      AND column_name = 'metadata'
    ) THEN
      ALTER TABLE public.course_certificates
      ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
  END IF;
END $$;

-- Indexes pour nouvelles colonnes (seulement si la table existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_certificates') THEN
    CREATE INDEX IF NOT EXISTS idx_course_certificates_template_id ON public.course_certificates(template_id);
    CREATE INDEX IF NOT EXISTS idx_course_certificates_verification_code ON public.course_certificates(verification_code);
  END IF;
END $$;

-- =====================================================
-- 3. FUNCTIONS & TRIGGERS
-- =====================================================

-- Fonction pour valider qu'il n'y a qu'un seul template par défaut par store/cours
CREATE OR REPLACE FUNCTION validate_unique_default_template()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si on essaie de créer/mettre à jour un template par défaut
  IF NEW.is_default = true THEN
    -- Vérifier s'il existe déjà un autre template par défaut pour le même store/cours
    IF EXISTS (
      SELECT 1 FROM public.course_certificate_templates
      WHERE store_id = NEW.store_id
      AND (course_id = NEW.course_id OR (course_id IS NULL AND NEW.course_id IS NULL))
      AND is_default = true
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    ) THEN
      RAISE EXCEPTION 'Un seul template par défaut est autorisé par store/cours';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger pour valider l'unicité du template par défaut
DROP TRIGGER IF EXISTS trigger_validate_unique_default_template ON public.course_certificate_templates;

CREATE TRIGGER trigger_validate_unique_default_template
  BEFORE INSERT OR UPDATE ON public.course_certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION validate_unique_default_template();

-- =====================================================
-- 4. FUNCTIONS
-- =====================================================

-- Fonction pour générer un code de vérification unique
CREATE OR REPLACE FUNCTION generate_certificate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Générer un code aléatoire de 12 caractères
    v_code := UPPER(
      SUBSTRING(
        MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT),
        1,
        12
      )
    );
    
    -- Vérifier l'unicité
    SELECT EXISTS(
      SELECT 1 FROM public.course_certificates
      WHERE verification_code = v_code
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;

-- Fonction pour générer automatiquement un certificat à la complétion
CREATE OR REPLACE FUNCTION auto_generate_course_certificate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_course RECORD;
  v_template RECORD := NULL;
  v_certificate_number TEXT;
  v_verification_code TEXT;
  v_certificate_id UUID;
  v_user_profile RECORD;
  v_instructor RECORD;
BEGIN
  -- Vérifier si les tables nécessaires existent
  -- Cette fonction est un trigger sur course_enrollments, donc on vérifie d'abord si cette table existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_enrollments') THEN
    RETURN NEW;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses') THEN
    RETURN NEW;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    RETURN NEW;
  END IF;
  
  -- Vérifier si le cours est complété à 100% et certificat activé
  IF NEW.progress_percentage = 100 
     AND NEW.status = 'completed' 
     AND OLD.status != 'completed' THEN
    
    -- Récupérer les infos du cours
    SELECT 
      c.*,
      COALESCE(p.name, 'Cours') as course_name,
      COALESCE(p.store_id, '00000000-0000-0000-0000-000000000000'::UUID) as store_id
    INTO v_course
    FROM public.courses c
    LEFT JOIN public.products p ON p.id = c.product_id
    WHERE c.id = NEW.course_id;
    
    -- Vérifier si certificat activé
    IF v_course.certificate_enabled THEN
      -- Vérifier si la table course_certificates existe
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_certificates') THEN
        -- Vérifier si certificat n'existe pas déjà
        IF NOT EXISTS (
          SELECT 1 FROM public.course_certificates
          WHERE enrollment_id = NEW.id
        ) THEN
          -- Récupérer le template (par cours ou par défaut store) si la table existe
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_certificate_templates') THEN
            SELECT * INTO v_template
            FROM public.course_certificate_templates
            WHERE (
              (course_id = NEW.course_id AND is_active = true)
              OR (course_id IS NULL AND store_id = v_course.store_id AND is_default = true AND is_active = true)
            )
            ORDER BY course_id NULLS LAST, is_default DESC, created_at DESC
            LIMIT 1;
          END IF;
          
          -- Récupérer le profil utilisateur si la table existe
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
            SELECT full_name, email INTO v_user_profile
            FROM public.profiles
            WHERE id = NEW.user_id;
          ELSE
            v_user_profile.full_name := 'Étudiant';
            v_user_profile.email := NULL;
          END IF;
          
          -- Récupérer l'instructeur (premier instructeur du cours) si les tables existent
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_sections')
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_lessons')
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
            SELECT 
              p.full_name as instructor_name
            INTO v_instructor
            FROM public.course_sections cs
            INNER JOIN public.course_lessons cl ON cl.section_id = cs.id
            INNER JOIN public.profiles p ON p.id = cl.instructor_id
            WHERE cs.course_id = NEW.course_id
            LIMIT 1;
          ELSE
            v_instructor.instructor_name := 'Emarzona Academy';
          END IF;
        
          -- Générer numéro de certificat si la fonction existe
          IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_certificate_number') THEN
            v_certificate_number := public.generate_certificate_number();
          ELSE
            v_certificate_number := 'CERT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 12));
          END IF;
          
          -- Générer code de vérification
          v_verification_code := public.generate_certificate_verification_code();
          
          -- Créer le certificat
          INSERT INTO public.course_certificates (
            course_id,
            user_id,
            enrollment_id,
            certificate_number,
            certificate_url,
            student_name,
            course_title,
            instructor_name,
            completion_date,
            final_score,
            template_id,
            verification_code,
            verification_url,
            is_valid,
            is_public
          ) VALUES (
            NEW.course_id,
            NEW.user_id,
            NEW.id,
            v_certificate_number,
            '', -- Sera généré par le système
            COALESCE(v_user_profile.full_name, 'Étudiant'),
            v_course.course_name,
            COALESCE(v_instructor.instructor_name, 'Emarzona Academy'),
            CURRENT_DATE,
            NULL, -- Score final si disponible
            CASE WHEN v_template IS NOT NULL AND v_template.id IS NOT NULL THEN v_template.id ELSE NULL END,
            v_verification_code,
            '', -- URL de vérification publique
            true,
            true
          )
          RETURNING id INTO v_certificate_id;
          
          -- Mettre à jour l'enrollment si la table et la colonne existent
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_enrollments') THEN
            IF EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'course_enrollments' 
              AND column_name = 'certificate_earned'
            ) THEN
              UPDATE public.course_enrollments
              SET 
                certificate_earned = true,
                certificate_issued_at = NOW()
              WHERE id = NEW.id;
            END IF;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger pour génération automatique (seulement si la table existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_enrollments') THEN
    DROP TRIGGER IF EXISTS trigger_auto_generate_course_certificate ON public.course_enrollments;
    
    CREATE TRIGGER trigger_auto_generate_course_certificate
      AFTER UPDATE ON public.course_enrollments
      FOR EACH ROW
      WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.progress_percentage IS DISTINCT FROM NEW.progress_percentage)
      EXECUTE FUNCTION auto_generate_course_certificate();
  END IF;
END $$;

-- Trigger pour updated_at
CREATE TRIGGER update_course_certificate_templates_updated_at
  BEFORE UPDATE ON public.course_certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

ALTER TABLE public.course_certificate_templates ENABLE ROW LEVEL SECURITY;

-- Créer les RLS policies seulement si les tables nécessaires existent
DO $$ 
BEGIN
  -- Store owners can manage their templates
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'course_certificate_templates'
      AND policyname = 'Store owners can manage certificate templates'
    ) THEN
      EXECUTE '
        CREATE POLICY "Store owners can manage certificate templates"
          ON public.course_certificate_templates
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM public.stores
              WHERE stores.id = course_certificate_templates.store_id
              AND (stores.user_id = auth.uid() OR stores.owner_id = auth.uid())
            )
          )';
    END IF;
  END IF;

  -- Users can view active templates for their enrolled courses
  -- Note: Cette policy nécessite course_enrollments, donc on la crée seulement si la table existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'course_enrollments') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'course_certificate_templates'
      AND policyname = 'Users can view active templates'
    ) THEN
      EXECUTE '
        CREATE POLICY "Users can view active templates"
          ON public.course_certificate_templates
          FOR SELECT
          USING (
            is_active = true AND (
              course_id IS NULL OR
              EXISTS (
                SELECT 1 FROM public.course_enrollments
                WHERE course_enrollments.course_id = course_certificate_templates.course_id
                AND course_enrollments.user_id = auth.uid()
              )
            )
          )';
    END IF;
  END IF;
END $$;

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE public.course_certificate_templates IS 'Templates personnalisables pour certificats de cours';
COMMENT ON FUNCTION generate_certificate_verification_code IS 'Génère un code de vérification unique pour un certificat';
COMMENT ON FUNCTION auto_generate_course_certificate IS 'Génère automatiquement un certificat lorsque le cours est complété à 100%';

